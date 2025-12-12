import React from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { CloseIcon, TrashIcon, PlayIcon, PauseIcon, SaveIcon } from './Icons';
import { Song } from '../types';

interface QueueViewProps {
  onClose: () => void;
}

const QueueView: React.FC<QueueViewProps> = ({ onClose }) => {
  const { queue, currentSong, isPlaying, playSong, removeFromQueue, togglePlayPause, saveQueueAsPlaylist, setQueue } = usePlayer();

  const handlePlayPause = (song: Song) => {
    if (currentSong?.queueId === song.queueId) {
        togglePlayPause();
    } else {
        // Find the index of the clicked song in the queue and play from there
        const songIndex = queue.findIndex(s => s.queueId === song.queueId);
        if (songIndex !== -1) {
            // A simplified play from queue logic might be needed here.
            // For now, this might reset the main playlist queue.
            playSong(song, { id: -1, name: "Queue", songs: queue, coverArt: '' });
        }
    }
  };
  
  const handleClearQueue = () => {
    setQueue([]);
  };

  const handleSaveQueue = () => {
    saveQueueAsPlaylist();
    onClose();
  };

  return (
    <div className="absolute bottom-full right-0 mb-2 w-80 bg-neutral-800 rounded-lg shadow-lg text-white max-h-96 flex flex-col z-20">
      <div className="p-4 border-b border-neutral-700 flex justify-between items-center flex-shrink-0">
        <h3 className="font-bold">Queue</h3>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
             <>
                <button onClick={handleSaveQueue} className="text-neutral-400 hover:text-white" title="Save as Playlist">
                    <SaveIcon />
                </button>
                <button onClick={handleClearQueue} className="text-neutral-400 hover:text-white" title="Clear queue">
                    <TrashIcon />
                </button>
             </>
          )}
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="overflow-y-auto">
        {currentSong && (
            <div className="p-2">
                <p className="text-sm font-bold px-2 mb-2 text-neutral-400">Now Playing</p>
                <div className="flex items-center gap-3 p-2 rounded bg-neutral-700/50">
                    <img src={currentSong.coverArt} alt={currentSong.title} className="w-10 h-10 rounded" />
                    <div>
                        <p className="font-semibold text-emerald-400">{currentSong.title}</p>
                        <p className="text-sm text-neutral-300">{currentSong.artist}</p>
                    </div>
                </div>
            </div>
        )}
        {queue.length > 0 && (
            <div className="p-2">
                <p className="text-sm font-bold px-2 mb-2 text-neutral-400">Next Up</p>
                <ul>
                {queue.map((song) => (
                    <li key={song.queueId} className="flex items-center justify-between p-2 rounded group hover:bg-neutral-700/50">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <img src={song.coverArt} alt={song.title} className="w-10 h-10 rounded" />
                            <div className="overflow-hidden">
                                <p className="font-semibold truncate">{song.title}</p>
                                <p className="text-sm text-neutral-400 truncate">{song.artist}</p>
                            </div>
                        </div>
                        <button onClick={() => removeFromQueue(song.queueId!)} className="ml-2 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-white">
                            <TrashIcon />
                        </button>
                    </li>
                ))}
                </ul>
            </div>
        )}
        {queue.length === 0 && !currentSong && (
            <p className="p-4 text-center text-neutral-400">The queue is empty.</p>
        )}
      </div>
    </div>
  );
};

export default QueueView;
