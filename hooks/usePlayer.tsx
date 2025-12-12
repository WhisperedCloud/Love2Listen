

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

type View = 'home' | 'search' | 'playlist';
type ModalType = 'createPlaylist' | 'upload' | 'addToPlaylist';

// --- Player Context ---
interface PlayerContextType {
  playlists: Playlist[];
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
  isLoading: boolean;
  currentView: View;
  setCurrentView: (view: View) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Song[];
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
  activeModal: ModalType | null;
  modalTarget: Song | number | null;
  openModal: (modal: ModalType, target?: Song | number) => void;
  closeModal: () => void;
  addSongToExistingPlaylist: (song: Song, playlistId: number) => Promise<void>;
  saveQueueAsPlaylist: () => void;
  addSongToQueue: (song: Song) => void;
  deletePlaylist: (playlistId: number) => void;
  startPlaylistPlayback: (playlist: Playlist, shuffle: boolean) => void;
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
    } else {
      const s = size / 2;
      ctx.drawImage(images[0], 0, 0, s, s);
      if (images[1]) ctx.drawImage(images[1], s, 0, s, s);
      if (images[2]) ctx.drawImage(images[2], 0, s, s, s);
      if (images[3]) ctx.drawImage(images[3], s, s, s, s);
    }
  } catch (error) {
    console.error("Error creating collage:", error);
    return generateDefaultCover();
  }

  return canvas.toDataURL('image/png');
};

interface ITunesMetadata {
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
}

const fetchMetadataFromITunes = async (query: string): Promise<ITunesMetadata | null> => {
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
    const data = await response.json();

    if (data.resultCount > 0) {
      const result = data.results[0];
      return {
        artistName: result.artistName,
        collectionName: result.collectionName,
        artworkUrl100: result.artworkUrl100.replace('100x100', '600x600'), // Get higher resolution
      };
    }
  } catch (error) {
    console.warn("Failed to fetch metadata from iTunes:", error);
  }
  return null;
};

const normalizeArtistName = (artist: string): string => {
  if (!artist) return 'Unknown Artist';
  // Remove content in parentheses first (e.g., "(feat. ...)")
  let mainArtist = artist.split('(')[0];
  // Then split by common collaboration words and take the first part
  mainArtist = mainArtist.split(/ feat\.| ft\. | & | with |,| x /i)[0].trim();
  return mainArtist || 'Unknown Artist';
};


export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedPlaylistId, _setSelectedPlaylistId] = useState<number | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [shuffledQueue, setShuffledQueue] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isShuffled, setIsShuffled] = useState(() => localStorage.getItem('music-player-shuffle') === 'true');
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => (localStorage.getItem('music-player-repeat') as RepeatMode) || RepeatMode.NONE);
  const [isLyricsVisible, setIsLyricsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [modalTarget, setModalTarget] = useState<Song | number | null>(null);

  const [defaultCoverArt] = useState(generateDefaultCover());
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentQueue = isShuffled ? shuffledQueue : queue;
  const currentSong = currentSongIndex >= 0 ? currentQueue[currentSongIndex] : null;

  const setSelectedPlaylistId = (id: number | null) => {
    _setSelectedPlaylistId(id);
    if (id !== null) {
      setCurrentView('playlist');
    }
  };

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

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const allSongs = playlists.flatMap(p => p.songs);
    const uniqueSongs: Song[] = [...new Map<number, Song>(allSongs.map(s => [s.id, s])).values()];
    const filtered = uniqueSongs.filter(song =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.album.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered);
  }, [searchQuery, playlists]);

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
    const playlistSongs = playlist?.songs || playlists.flatMap(p => p.songs);
    const newQueue = playlistSongs.map(s => ({ ...s, queueId: `${s.id}_${Date.now()}_${Math.random()}` }));

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

  const startPlaylistPlayback = (playlist: Playlist, shuffle: boolean) => {
    if (playlist.songs.length === 0) return;

    const newQueue = playlist.songs.map(s => ({ ...s, queueId: `${s.id}_${Date.now()}_${Math.random()}` }));
    setQueue(newQueue);
    setIsShuffled(shuffle);
    localStorage.setItem('music-player-shuffle', String(shuffle));

    if (shuffle) {
      const shuffled = [...newQueue].sort(() => Math.random() - 0.5);
      setShuffledQueue(shuffled);
    } else {
      setShuffledQueue([]);
    }

    setCurrentSongIndex(0);
    setIsPlaying(true);
  };

  const addSongToQueue = (song: Song) => {
    const newSongInQueue = { ...song, queueId: `${song.id}_${Date.now()}_${Math.random()}` };
    const newQueue = [...queue, newSongInQueue];
    setQueue(newQueue);

    if (isShuffled) {
      const newShuffled = [...shuffledQueue, newSongInQueue];
      setShuffledQueue(newShuffled);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleShuffle = () => {
    const nextIsShuffled = !isShuffled;
    localStorage.setItem('music-player-shuffle', String(nextIsShuffled));
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
    const nextMode = modes[nextIndex];
    localStorage.setItem('music-player-repeat', nextMode);
    setRepeatMode(nextMode);
  };

  const toggleLyricsView = () => {
    setIsLyricsVisible(!isLyricsVisible);
  };

  const removeFromQueue = (queueId: string) => {
    setQueue(prev => prev.filter(s => s.queueId !== queueId));
    if (isShuffled) {
      setShuffledQueue(prev => prev.filter(s => s.queueId !== queueId));
    }
  };

  const createPlaylist = (name: string): Playlist => {
    const newPlaylist: Playlist = {
      id: Date.now(),
      name,
      songs: [],
      coverArt: defaultCoverArt,
    };
    setPlaylists(prev => {
      const updatedPlaylists = [...prev, newPlaylist];
      localStorage.setItem('music-player-playlists', JSON.stringify(updatedPlaylists));
      return updatedPlaylists;
    });
    setSelectedPlaylistId(newPlaylist.id);
    return newPlaylist;
  };

  const deletePlaylist = (playlistId: number) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      if (selectedPlaylistId === playlistId) {
        setSelectedPlaylistId(null);
        setCurrentView('home');
      }
    }
  };

  const saveQueueAsPlaylist = () => {
    if (currentSong === null && queue.length === 0) return;

    const songsToSave = currentSong ? [currentSong, ...queue] : [...queue];
    if (songsToSave.length === 0) return;

    const playlistName = `My Queue Playlist ${playlists.filter(p => p.name.startsWith("My Queue Playlist")).length + 1}`;

    const newPlaylist: Playlist = {
      id: Date.now(),
      name: playlistName,
      songs: songsToSave,
      coverArt: songsToSave[0]?.coverArt || defaultCoverArt,
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    setSelectedPlaylistId(newPlaylist.id);
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

  const addSongToExistingPlaylist = async (song: Song, playlistId: number) => {
    let targetPlaylist: Playlist | undefined;
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        targetPlaylist = p;
        return { ...p, songs: [...p.songs, song] };
      }
      return p;
    }));

    if (targetPlaylist) {
      const updatedSongs = [...targetPlaylist.songs, song];
      const newCoverArt = await generateCollageCover(updatedSongs);
      updatePlaylistCover(playlistId, newCoverArt);
    }
  };

  const addFilesToPlaylist = async (files: FileList, playlistId: number) => {
    const newSongs: Song[] = [];
    const db = await openDB();

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('audio/')) continue;
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
            // FIX: Correctly typed the `tag` parameter in the `jsmediatags.read` callback. The compiler was inferring the `tags` object as `unknown`, causing errors when accessing metadata properties.
            onSuccess: (tag: { tags: any }) => {
              const tags: any = tag.tags;
              if (tags) {
                if (tags.picture && tags.picture.data && tags.picture.format) {
                  const byteArray = new Uint8Array(tags.picture.data);
                  coverArtBlob = new Blob([byteArray], { type: tags.picture.format });
                }
                songData.title = tags.title || songData.title;
                songData.artist = tags.artist || songData.artist;
                songData.album = tags.album || songData.album;
              }
              resolve();
            },
            onError: (error: any) => {
              console.warn('Could not read metadata for file:', file.name, error);
              resolve();
            },
          });
        });

      }

      // If metadata is still unknown, try fetching from iTunes API
      if (songData.artist === 'Unknown Artist' || songData.album === 'Unknown Album') {
        // Remove extension and common clutter for better search results
        const cleanupQuery = songData.title
          .replace(/\(feat\..*?\)/i, '')
          .replace(/\(ft\..*?\)/i, '')
          .replace(/\(.*?mix\)/i, '')
          .trim();

        const iTunesData = await fetchMetadataFromITunes(cleanupQuery);

        if (iTunesData) {
          songData.artist = iTunesData.artistName || songData.artist;
          songData.album = iTunesData.collectionName || songData.album;

          // Fetch cover art if we don't have one from tags
          if (!coverArtBlob && iTunesData.artworkUrl100) {
            try {
              const response = await fetch(iTunesData.artworkUrl100);
              const blob = await response.blob();
              coverArtBlob = blob;
            } catch (e) {
              console.warn("Failed to download cover art from iTunes", e);
            }
          }
        }
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

    if (targetPlaylist.coverArt === defaultCoverArt || updatedSongs.length <= 4) {
      newCoverArt = await generateCollageCover(updatedSongs);
    }

    setPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, songs: updatedSongs, coverArt: newCoverArt } : p
    ));
  };

  const openModal = (modal: ModalType, target: Song | number | null = null) => {
    setActiveModal(modal);
    setModalTarget(target);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalTarget(null);
  };

  const fetchLyrics = useCallback(async (song: Song) => {
    if (!import.meta.env.VITE_API_KEY) {
      console.error("VITE_API_KEY not found.");
      song.lyrics = "API Key not configured.";
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      const cleanArtist = normalizeArtistName(song.artist);
      const albumInfo = song.album && song.album !== 'Unknown Album' ? ` from the album "${song.album}"` : '';

      const prompt = `
        Find the complete and accurate lyrics for the song titled "${song.title}" by the musical artist "${cleanArtist}"${albumInfo}.

        IMPORTANT INSTRUCTIONS:
        1. Respond ONLY with the song's lyrics.
        2. Do NOT include the song title, artist name, or any other headers in your response.
        3. Do NOT include any conversational text like "Here are the lyrics...".
        4. Do NOT include section markers like [Verse], [Chorus], [Bridge], etc.
        5. Ensure line breaks are preserved for proper formatting.
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          maxOutputTokens: 2048,
        },
      });

      let lyricsText = (response.text ?? "Lyrics not found.").trim();

      // Aggressive cleanup: remove the first line if it looks like a title
      const lines = lyricsText.split('\n');
      if (lines.length > 1) {
        const firstLineLower = lines[0].toLowerCase();
        const titleLower = song.title.toLowerCase();
        const artistLower = cleanArtist.toLowerCase();
        if (firstLineLower.includes(titleLower) || firstLineLower.includes(artistLower)) {
          lines.shift();
          lyricsText = lines.join('\n').trim();
        }
      }

      song.lyrics = lyricsText || "Lyrics not found.";

    } catch (error) {
      console.error("Error fetching lyrics:", error);
      song.lyrics = "Could not fetch lyrics.";
    }
  }, []);

  const value = {
    playlists,
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
    currentView,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    searchResults,
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
    activeModal,
    modalTarget,
    openModal,
    closeModal,
    addSongToExistingPlaylist,
    saveQueueAsPlaylist,
    addSongToQueue,
    deletePlaylist,
    startPlaylistPlayback,
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
