import React from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { MusicNoteIcon } from './Icons';

const HomeView: React.FC = () => {
  const { playlists, setSelectedPlaylistId, isLoading } = usePlayer();

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-neutral-900 text-white p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <h2 className="text-2xl font-bold mt-4">Loading your library...</h2>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-800 to-neutral-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Your Library</h1>
      {playlists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {playlists.map(playlist => (
            <div
              key={playlist.id}
              className="bg-neutral-800/50 p-4 rounded-lg cursor-pointer hover:bg-neutral-700/70 transition-colors group"
              onClick={() => setSelectedPlaylistId(playlist.id)}
            >
              <img src={playlist.coverArt} alt={playlist.name} className="w-full h-auto rounded-md shadow-lg mb-4 aspect-square object-cover" />
              <p className="font-bold truncate">{playlist.name}</p>
              <p className="text-sm text-neutral-400">Playlist</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-neutral-400 h-full">
          <MusicNoteIcon size={64} />
          <h2 className="text-2xl font-bold mt-4 text-white">Your library is empty</h2>
          <p className="mt-2">Create a playlist or upload some songs to get started.</p>
        </div>
      )}
    </main>
  );
};

export default HomeView;
