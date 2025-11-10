import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { PlayIcon, MusicNoteIcon, EditIcon } from './Icons';

const MainView: React.FC = () => {
  const {
    playlists,
    selectedPlaylistId,
    playSong,
    currentSong,
    isPlaying,
    artistBio,
    isBioLoading,
    bioError,
    fetchArtistBio,
    updatePlaylistCover,
    isLoading,
  } = usePlayer();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  useEffect(() => {
    if (currentSong?.artist) {
        fetchArtistBio(currentSong.artist);
    }
  }, [currentSong?.artist, fetchArtistBio]);
  
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
    return (
      <main className="flex-1 overflow-y-auto bg-neutral-900 text-white p-8 flex flex-col items-center justify-center text-center">
         <MusicNoteIcon size={64} color="#555" />
        <h2 className="text-2xl font-bold mt-4">Welcome to Your Music Player</h2>
        <p className="text-neutral-400 mt-2">Create a playlist or upload songs from the sidebar to begin.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-800 to-neutral-900 text-white">
      <div className="p-8">
        <div className="flex items-end gap-6 mb-8">
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
            <h1 className="text-5xl font-extrabold tracking-tight">{selectedPlaylist.name}</h1>
            <p className="text-neutral-300 mt-2">{selectedPlaylist.songs.length} songs</p>
          </div>
        </div>

        {/* Artist Biography Section */}
        {currentSong && (
          <div className="mb-8 p-6 bg-neutral-800/50 rounded-lg">
            <h2 className="text-xl font-bold mb-4">About {currentSong.artist}</h2>
            {isBioLoading && <p className="text-neutral-400">Loading biography...</p>}
            {bioError && <p className="text-neutral-400">{bioError}</p>}
            {artistBio && <p className="text-neutral-300 leading-relaxed">{artistBio}</p>}
          </div>
        )}

        {/* Song List */}
        <div>
          {selectedPlaylist.songs.length > 0 ? (
            <table className="w-full text-left">
              <thead className="text-neutral-400 border-b border-neutral-700">
                <tr>
                  <th className="p-2 w-8 font-normal">#</th>
                  <th className="p-2 font-normal">Title</th>
                  <th className="p-2 font-normal">Album</th>
                  <th className="p-2 font-normal">Duration</th>
                </tr>
              </thead>
              <tbody>
                {selectedPlaylist.songs.map((song, index) => {
                    const isActive = currentSong?.id === song.id;
                    return (
                        <tr 
                            key={song.id} 
                            className="group hover:bg-neutral-800/50 rounded-md"
                            onDoubleClick={() => playSong(song, selectedPlaylist)}
                        >
                            <td className="p-3 text-neutral-400 relative">
                                <span className={`group-hover:hidden ${isActive && isPlaying ? 'hidden' : ''}`}>{index + 1}</span>
                                <button onClick={() => playSong(song, selectedPlaylist)} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover:block ${isActive && isPlaying ? 'block' : ''}`}>
                                    {isActive && isPlaying ? <PlayIcon color="#10B981" /> : <PlayIcon />}
                                </button>
                            </td>
                            <td className="p-3 flex items-center gap-3">
                                <img src={song.coverArt} alt={song.title} className="w-10 h-10 rounded object-cover"/>
                                <div>
                                    <p className={`font-medium ${isActive ? 'text-emerald-400' : 'text-white'}`}>{song.title}</p>
                                    <p className="text-sm text-neutral-400">{song.artist}</p>
                                </div>
                            </td>
                            <td className="p-3 text-neutral-400">{song.album}</td>
                            <td className="p-3 text-neutral-400">{formatDuration(song.duration)}</td>
                        </tr>
                    )
                })}
              </tbody>
            </table>
          ) : (
            <p className="p-4 text-neutral-400">This playlist is empty. Add some songs from the sidebar!</p>
          )}
        </div>
      </div>
    </main>
  );
};

export default MainView;