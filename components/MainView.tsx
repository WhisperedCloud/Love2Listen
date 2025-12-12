

import React, { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { PlayIcon, MusicNoteIcon, EditIcon, PlusIcon, QueueIcon, ThreeDotsIcon, PauseIcon, SoundBarsIcon, ShuffleIcon, TrashIcon } from './Icons';
import { Song } from '../types';
import HomeView from './HomeView';

const SongOptionsMenu: React.FC<{ song: Song, closeMenu: () => void }> = ({ song, closeMenu }) => {
  const { openModal, addSongToQueue } = usePlayer();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAddToPlaylist = () => {
    openModal('addToPlaylist', song);
    closeMenu();
  };

  const handleAddToQueue = () => {
    addSongToQueue(song);
    closeMenu();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeMenu]);


  return (
    <div ref={menuRef} className="absolute right-0 top-full mt-1 w-48 bg-neutral-800 rounded-md shadow-lg z-10 text-sm">
      <button onClick={handleAddToQueue} className="w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2">
        <QueueIcon size={16} /> Add to queue
      </button>
      <button onClick={handleAddToPlaylist} className="w-full text-left px-4 py-2 hover:bg-neutral-700 flex items-center gap-2">
        <PlusIcon size={16} /> Add to playlist
      </button>
    </div>
  );
};

const MainView: React.FC = () => {
  const {
    playlists,
    selectedPlaylistId,
    playSong,
    currentSong,
    isPlaying,
    updatePlaylistCover,
    isLoading,
    openModal,
    togglePlayPause,
    startPlaylistPlayback,
    deletePlaylist,
  } = usePlayer();

  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedPlaylist) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updatePlaylistCover(selectedPlaylist.id, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '-:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-neutral-900 text-white p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <h2 className="text-2xl font-bold mt-4">Loading your library...</h2>
      </main>
    );
  }

  if (!selectedPlaylist) {
    return <HomeView />;
  }

  const handlePlayPause = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      playSong(song, selectedPlaylist);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-800/60 to-neutral-900 text-white">
      <div className="p-4 md:p-8">
        <div className="flex flex-col lg:flex-row items-center lg:items-end gap-6 mb-8 text-center lg:text-left">
          <div className="relative group flex-shrink-0" onClick={triggerFileSelect}>
            <img src={selectedPlaylist.coverArt} alt={selectedPlaylist.name} className="w-48 h-48 rounded shadow-2xl object-cover" />
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <EditIcon size={48} />
              <p className="font-bold text-lg mt-2">Choose photo</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCoverArtChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm">Playlist</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{selectedPlaylist.name}</h1>
            <p className="text-neutral-300 mt-2">{selectedPlaylist.songs.length} songs</p>
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-start gap-6 mb-8">
          <button
            onClick={() => startPlaylistPlayback(selectedPlaylist, false)}
            className="bg-emerald-500 rounded-full p-4 hover:bg-emerald-400 transition-transform hover:scale-105 disabled:bg-neutral-600"
            disabled={selectedPlaylist.songs.length === 0}
          >
            <PlayIcon size={28} color="black" />
          </button>
          <button
            onClick={() => startPlaylistPlayback(selectedPlaylist, true)}
            className="text-neutral-300 hover:text-white transition-colors disabled:text-neutral-600"
            title="Shuffle play"
            disabled={selectedPlaylist.songs.length === 0}
          >
            <ShuffleIcon size={32} />
          </button>
          <button
            onClick={() => deletePlaylist(selectedPlaylist.id)}
            className="text-neutral-400 hover:text-white transition-colors"
            title="Delete playlist"
          >
            <TrashIcon size={28} />
          </button>
        </div>

        <div>
          {selectedPlaylist.songs.length > 0 ? (
            <table className="w-full text-left table-fixed">
              <thead className="text-neutral-400 border-b border-neutral-700">
                <tr>
                  <th className="p-2 w-10 font-normal text-center">#</th>
                  <th className="p-2 font-normal">Title</th>
                  <th className="p-2 font-normal hidden lg:table-cell">Album</th>
                  <th className="p-2 font-normal w-16 hidden sm:table-cell">Duration</th>
                  <th className="p-2 font-normal w-10"></th>
                </tr>
              </thead>
              <tbody>
                {selectedPlaylist.songs.map((song, index) => {
                  const isActive = currentSong?.id === song.id;
                  return (
                    <tr
                      key={song.id}
                      className="group hover:bg-neutral-800/50 rounded-md transition-colors"
                      onDoubleClick={() => handlePlayPause(song)}
                    >
                      <td className="p-3 text-neutral-400 text-center relative w-10">
                        {isActive && isPlaying ? (
                          <SoundBarsIcon />
                        ) : (
                          <>
                            <span className="group-hover:hidden">{index + 1}</span>
                            <button onClick={() => handlePlayPause(song)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover:block">
                              {isActive && !isPlaying ? <PlayIcon size={20} /> : <PlayIcon size={20} />}
                            </button>
                          </>
                        )}
                      </td>
                      <td className="p-3 flex items-center gap-3 overflow-hidden">
                        <img src={song.coverArt} alt={song.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        <div className="truncate min-w-0">
                          <p className={`font-medium truncate ${isActive ? 'text-emerald-400' : 'text-white'}`}>{song.title}</p>
                          <p className="text-sm text-neutral-400 truncate">{song.artist}</p>
                        </div>
                      </td>
                      <td className="p-3 text-neutral-400 truncate hidden lg:table-cell">{song.album}</td>
                      <td className="p-3 text-neutral-400 hidden sm:table-cell">{formatDuration(song.duration)}</td>
                      <td className="p-3 text-neutral-400 relative">
                        <button onClick={() => setActiveMenu(activeMenu === song.id ? null : song.id)} className="opacity-0 group-hover:opacity-100">
                          <ThreeDotsIcon />
                        </button>
                        {activeMenu === song.id && <SongOptionsMenu song={song} closeMenu={() => setActiveMenu(null)} />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center p-16 border-2 border-dashed border-neutral-700 rounded-lg">
              <MusicNoteIcon size={48} color="#555" />
              <h3 className="text-xl font-bold mt-4">This playlist is empty</h3>
              <p className="text-neutral-400 mt-2">Let's add some songs to it.</p>
              <button onClick={() => openModal('upload', selectedPlaylist.id)} className="mt-6 bg-white text-black font-bold py-2 px-6 rounded-full hover:bg-neutral-200 transition-transform hover:scale-105">
                Upload Songs
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default MainView;