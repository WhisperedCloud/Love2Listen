import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { Song, Playlist, RepeatMode } from '../types';
import { playlists as initialPlaylists } from '../data/mockData';
// Fix: Import GoogleGenAI for fetching lyrics.
import { GoogleGenAI } from '@google/genai';

declare global {
  interface Window {
    jsmediatags: any;
  }
}

interface PlayerContextType {
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  selectedPlaylistId: number | null;
  setSelectedPlaylistId: (id: number | null) => void;
  queue: Song[];
  setQueue: React.Dispatch<React.SetStateAction<Song[]>>;
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  isLyricsVisible: boolean;
  togglePlayPause: () => void;
  playSong: (song: Song, playlist?: Playlist) => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLyricsView: () => void;
  fetchLyrics: (song: Song) => Promise<void>;
  removeFromQueue: (queueId: string) => void;
  createPlaylist: (name: string) => Playlist;
  addFilesToPlaylist: (files: FileList, playlistId: number) => Promise<void>;
  updatePlaylistCover: (playlistId: number, newCoverArt: string) => void;
  artistBio: string | null;
  isBioLoading: boolean;
  bioError: string | null;
  fetchArtistBio: (artistName: string) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const generateDefaultCover = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#282828';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = '#7a7a7a';
        ctx.font = '100px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎵', 100, 100);
    }
    return canvas.toDataURL('image/png');
};

const generateCollageCover = async (songs: Song[]): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 200;
    canvas.width = size;
    canvas.height = size;

    if (!ctx) return generateDefaultCover();

    ctx.fillStyle = '#181818';
    ctx.fillRect(0, 0, size, size);

    const uniqueCovers = [...new Map(songs.map(s => [s.coverArt, s])).values()]
        .map(s => s.coverArt);

    if (uniqueCovers.length === 0) return generateDefaultCover();

    const imagePromises = uniqueCovers.slice(0, 4).map(src => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Could not load image: ${src}`));
            img.src = src;
        });
    });

    try {
        const images = await Promise.all(imagePromises);
        
        if (images.length === 1) {
            ctx.drawImage(images[0], 0, 0, size, size);
        } else if (images.length === 2) {
            ctx.drawImage(images[0], 0, 0, size / 2, size);
            ctx.drawImage(images[1], size / 2, 0, size / 2, size);
        } else if (images.length === 3) {
            ctx.drawImage(images[0], 0, 0, size, size / 2);
            ctx.drawImage(images[1], 0, size / 2, size / 2, size / 2);
            ctx.drawImage(images[2], size / 2, size / 2, size / 2, size / 2);
        } else {
            const s = size / 2;
            ctx.drawImage(images[0], 0, 0, s, s);
            ctx.drawImage(images[1], s, 0, s, s);
            ctx.drawImage(images[2], 0, s, s, s);
            ctx.drawImage(images[3], s, s, s, s);
        }
    } catch (error) {
        console.error("Error creating collage:", error);
        return generateDefaultCover();
    }
    
    return canvas.toDataURL('image/png');
};


export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [shuffledQueue, setShuffledQueue] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.NONE);
  const [isLyricsVisible, setIsLyricsVisible] = useState(false);
  const [artistBio, setArtistBio] = useState<string | null>(null);
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  
  const [defaultCoverArt] = useState(generateDefaultCover());
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentQueue = isShuffled ? shuffledQueue : queue;
  const currentSong = currentSongIndex >= 0 ? currentQueue[currentSongIndex] : null;

  const playNext = useCallback(() => {
    if (currentQueue.length === 0) return;
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= currentQueue.length) {
        if (repeatMode === RepeatMode.PLAYLIST) {
            nextIndex = 0;
        } else {
            setIsPlaying(false);
            return;
        }
    }
    setCurrentSongIndex(nextIndex);
    setIsPlaying(true);
  }, [currentQueue.length, currentSongIndex, repeatMode]);

  const handleSongEnd = useCallback(() => {
    if (repeatMode === RepeatMode.SONG) {
        audioRef.current?.play();
    } else {
        playNext();
    }
  }, [repeatMode, playNext]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Playback error:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleSongEnd);
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleSongEnd);
      };
    }
  }, [handleSongEnd]);

  const togglePlayPause = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };
  
  const playPrevious = () => {
    if (currentQueue.length === 0) return;
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) {
      prevIndex = currentQueue.length - 1;
    }
    setCurrentSongIndex(prevIndex);
    setIsPlaying(true);
  };
  
  const playSong = (song: Song, playlist?: Playlist) => {
    const playlistToUse = playlist?.songs || queue.length > 0 ? queue : [song];
    const newQueue = (playlist?.songs || playlistToUse).map(s => ({ ...s, queueId: `${s.id}_${Date.now()}_${Math.random()}` }));
    
    setQueue(newQueue);
    
    if (isShuffled) {
        const shuffled = [...newQueue].sort(() => Math.random() - 0.5);
        setShuffledQueue(shuffled);
        const songInShuffledIndex = shuffled.findIndex(s => s.id === song.id);
        setCurrentSongIndex(songInShuffledIndex);
    } else {
        const songIndex = newQueue.findIndex(s => s.id === song.id);
        setCurrentSongIndex(songIndex);
    }
    
    setIsPlaying(true);
  };
  
  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleShuffle = () => {
    const nextIsShuffled = !isShuffled;
    setIsShuffled(nextIsShuffled);
    if (nextIsShuffled) {
      const newShuffledQueue = [...queue].sort(() => Math.random() - 0.5);
      setShuffledQueue(newShuffledQueue);
      if (currentSong) {
        const newIndex = newShuffledQueue.findIndex(s => s.id === currentSong.id);
        setCurrentSongIndex(newIndex);
      }
    } else {
      if (currentSong) {
        const newIndex = queue.findIndex(s => s.id === currentSong.id);
        setCurrentSongIndex(newIndex);
      }
    }
  };

  const toggleRepeat = () => {
    const modes = [RepeatMode.NONE, RepeatMode.PLAYLIST, RepeatMode.SONG];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  const toggleLyricsView = () => {
    setIsLyricsVisible(!isLyricsVisible);
  };

  const removeFromQueue = (queueId: string) => {
    const songToRemove = queue.find(s => s.queueId === queueId);
    if (!songToRemove) return;

    if (currentSong?.queueId === queueId) {
        if (isPlaying) {
            playNext();
        }
    }

    const newQueue = queue.filter(s => s.queueId !== queueId);
    setQueue(newQueue);

    if (isShuffled) {
        const newShuffledQueue = shuffledQueue.filter(s => s.queueId !== queueId);
        setShuffledQueue(newShuffledQueue);
    }
    
    // Adjust current index if needed
    if (currentSong) {
        const newIndex = (isShuffled ? shuffledQueue : queue).findIndex(s => s.queueId === currentSong.queueId);
        if (newIndex < currentSongIndex) {
            setCurrentSongIndex(currentSongIndex - 1);
        }
    }
  };

  const createPlaylist = (name: string): Playlist => {
    const newPlaylist: Playlist = {
      id: Date.now(),
      name,
      songs: [],
      coverArt: defaultCoverArt,
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    setSelectedPlaylistId(newPlaylist.id);
    return newPlaylist;
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
            window.URL.revokeObjectURL(audio.src);
            resolve(audio.duration);
        };
        audio.src = window.URL.createObjectURL(file);
    });
  };
  
  const updatePlaylistCover = (playlistId: number, newCoverArt: string) => {
      setPlaylists(prev => prev.map(p =>
          p.id === playlistId ? { ...p, coverArt: newCoverArt } : p
      ));
  };

  const addFilesToPlaylist = async (files: FileList, playlistId: number) => {
    const newSongs: Song[] = [];

    for (const file of Array.from(files)) {
        const songUrl = URL.createObjectURL(file);
        const duration = await getAudioDuration(file);

        let songData: Omit<Song, 'id' | 'duration' | 'url'> = {
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            coverArt: defaultCoverArt,
        };

        if (window.jsmediatags) {
            await new Promise<void>((resolve) => {
                window.jsmediatags.read(file, {
                    onSuccess: (tag: any) => {
                        const { title, artist, album, picture } = tag.tags;
                        if (picture) {
                            let base64String = "";
                            for (let i = 0; i < picture.data.length; i++) {
                                base64String += String.fromCharCode(picture.data[i]);
                            }
                            songData.coverArt = `data:${picture.format};base64,${window.btoa(base64String)}`;
                        }
                        songData.title = title || songData.title;
                        songData.artist = artist || songData.artist;
                        songData.album = album || songData.album;
                        resolve();
                    },
                    onError: (error: any) => {
                        console.warn('Could not read metadata for file:', file.name, error);
                        resolve();
                    },
                });
            });
        }
        
        newSongs.push({
            ...songData,
            id: Date.now() + Math.random(),
            duration,
            url: songUrl,
        });
    }
    
    const targetPlaylist = playlists.find(p => p.id === playlistId);
    if (!targetPlaylist) return;

    const updatedSongs = [...targetPlaylist.songs, ...newSongs];
    let newCoverArt = targetPlaylist.coverArt;

    if (targetPlaylist.coverArt === defaultCoverArt && updatedSongs.length > 0) {
        newCoverArt = await generateCollageCover(updatedSongs);
    }

    setPlaylists(prev => prev.map(p => 
        p.id === playlistId ? { ...p, songs: updatedSongs, coverArt: newCoverArt } : p
    ));
  };

  const fetchLyrics = useCallback(async (song: Song) => {
    if (!song || song.lyrics) return;

    const updateSongWithLyrics = (lyrics: string) => {
      setQueue(prev => prev.map(s => (s.queueId === song.queueId ? { ...s, lyrics } : s)));
      setPlaylists(prev => prev.map(p => ({
        ...p,
        songs: p.songs.map(s => (s.id === song.id ? { ...s, lyrics } : s)),
      })));
    };

    try {
      const prompt = `Provide the lyrics for the song "${song.title}" by "${song.artist}". Only provide the lyrics. If you cannot find them, respond with "Lyrics not found."`;
      
      const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
      });

      const text = response.text;
      updateSongWithLyrics(text);
    } catch (e) {
      console.error('Failed to fetch lyrics', e);
      updateSongWithLyrics("Couldn't find lyrics for this song.");
    }
  }, []);

  const fetchArtistBio = useCallback(async (artistName: string) => {
    if (!artistName) return;
    
    setIsBioLoading(true);
    setArtistBio(null);
    setBioError(null);

    try {
      const prompt = `Provide a short, one-paragraph biography for the artist: "${artistName}". Focus on their musical career. If you cannot find one, respond with "Biography not found."`;
      
      const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
      });

      const text = response.text;
      if (text.trim() !== "Biography not found.") {
        setArtistBio(text);
      } else {
        setBioError("Biography not found for this artist.");
      }
    } catch (e) {
      console.error('Failed to fetch artist biography', e);
      setBioError("Couldn't fetch biography at this time.");
    } finally {
      setIsBioLoading(false);
    }
  }, []);

  const value = {
    playlists,
    setPlaylists,
    selectedPlaylistId,
    setSelectedPlaylistId,
    queue,
    setQueue,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    isLyricsVisible,
    togglePlayPause,
    playSong,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleLyricsView,
    fetchLyrics,
    removeFromQueue,
    createPlaylist,
    addFilesToPlaylist,
    updatePlaylistCover,
    artistBio,
    isBioLoading,
    bioError,
    fetchArtistBio,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} src={currentSong?.url}></audio>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};