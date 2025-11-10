
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { Song, Playlist, RepeatMode } from '../types';
import { GoogleGenAI } from '@google/genai';

declare global {
  interface Window {
    jsmediatags: any;
  }
}

// --- IndexedDB Helpers ---
const DB_NAME = 'MusicPlayerDB';
const DB_VERSION = 1;
const SONG_STORE_NAME = 'songs';

interface StoredSong {
    id: number;
    title: string;
    artist: string;
    album: string;
    duration: number;
    audioBlob: Blob;
    coverArtBlob: Blob | null;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SONG_STORE_NAME)) {
        db.createObjectStore(SONG_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// FIX: Changed from generic arrow function to a regular function to avoid TSX parsing ambiguity.
function getFromDB<T>(db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

const saveToDB = (db: IDBDatabase, storeName: string, data: any): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => resolve();
    });
};

// --- Player Context ---
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
  isLoading: boolean; // For initial data load
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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // --- Data Persistence ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedPlaylistsMeta = localStorage.getItem('music-player-playlists');
        if (storedPlaylistsMeta) {
          const playlistsMeta: Playlist[] = JSON.parse(storedPlaylistsMeta);
          const db = await openDB();
          
          const hydratedPlaylists = await Promise.all(
            playlistsMeta.map(async (playlist) => {
              const hydratedSongs = await Promise.all(
                playlist.songs.map(async (songStub) => {
                  const storedSong = await getFromDB<StoredSong>(db, SONG_STORE_NAME, songStub.id);
                  if (storedSong) {
                    return {
                      ...songStub,
                      url: URL.createObjectURL(storedSong.audioBlob),
                      coverArt: storedSong.coverArtBlob ? URL.createObjectURL(storedSong.coverArtBlob) : defaultCoverArt,
                      duration: storedSong.duration,
                    };
                  }
                  return null;
                })
              );
              return { ...playlist, songs: hydratedSongs.filter((s): s is Song => s !== null) };
            })
          );
          setPlaylists(hydratedPlaylists);
          if (hydratedPlaylists.length > 0) {
            setSelectedPlaylistId(hydratedPlaylists[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load data from storage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [defaultCoverArt]);
  
  useEffect(() => {
      // Don't save during initial load
      if (isLoading) return;

      try {
          const playlistsToStore = playlists.map(playlist => ({
              ...playlist,
              songs: playlist.songs.map(({ id, title, artist, album, lyrics }) => ({ id, title, artist, album, lyrics }))
          }));
          localStorage.setItem('music-player-playlists', JSON.stringify(playlistsToStore));
      } catch (error) {
          console.error("Failed to save playlists to localStorage:", error);
      }
  }, [playlists, isLoading]);

  // --- Playback Logic ---
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
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current?.play();
        }
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
    const playlistToUse = playlist?.songs || (queue.length > 0 ? queue : [song]);
    const newQueue = playlistToUse.map(s => ({ ...s, queueId: `${s.id}_${Date.now()}_${Math.random()}` }));
    
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
    
    if (currentSong) {
        const currentActiveQueue = isShuffled ? shuffledQueue.filter(s => s.queueId !== queueId) : newQueue;
        const newIndex = currentActiveQueue.findIndex(s => s.queueId === currentSong.queueId);
        setCurrentSongIndex(newIndex);
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
    const db = await openDB();

    for (const file of Array.from(files)) {
        const duration = await getAudioDuration(file);
        
        let coverArtBlob: Blob | null = null;
        let songData = {
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
        };

        if (window.jsmediatags) {
            await new Promise<void>((resolve) => {
                window.jsmediatags.read(file, {
                    onSuccess: (tag: any) => {
                        const { title, artist, album, picture } = tag.tags;
                        if (picture) {
                            coverArtBlob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
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
        
        const songId = Date.now() + Math.random();
        const storedSong: StoredSong = {
            id: songId,
            ...songData,
            duration,
            audioBlob: file,
            coverArtBlob,
        };
        await saveToDB(db, SONG_STORE_NAME, storedSong);
        
        newSongs.push({
            id: songId,
            ...songData,
            duration,
            url: URL.createObjectURL(file),
            coverArt: coverArtBlob ? URL.createObjectURL(coverArtBlob) : defaultCoverArt,
        });
    }
    
    db.close();

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
      const newLyrics = lyrics.trim();
      setQueue(prev => prev.map(s => (s.queueId === song.queueId ? { ...s, lyrics: newLyrics } : s)));
      setPlaylists(prev => prev.map(p => ({
        ...p,
        songs: p.songs.map(s => (s.id === song.id ? { ...s, lyrics: newLyrics } : s)),
      })));
    };

    try {
      const prompt = `Provide the lyrics for the song "${song.title}" by "${song.artist}". Only provide the lyrics. If you cannot find them, respond with "Lyrics not found."`;
      
      const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
      });

      updateSongWithLyrics(response.text);
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
    isLoading,
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
