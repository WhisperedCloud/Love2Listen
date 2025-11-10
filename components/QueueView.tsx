
import React from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { CloseIcon, TrashIcon, PlayIcon, PauseIcon } from './Icons';
import { Song } from '../types';

interface QueueViewProps {
  onClose: () => void;
}

const QueueView: React.FC<QueueViewProps> = ({ onClose }) => {
  const { queue, currentSong, isPlaying, playSong, removeFromQueue, togglePlayPause } = usePlayer();

  const handlePlayPause = (song: Song) => {
    if (currentSong?.queueId === song.queueId) {
        togglePlayPause();
    } else {
        playSong(song);
    }
  };

  return (
    <div className="absolute bottom-full right-0 mb-2 w-80 bg-neutral-800 rounded-lg shadow-lg text-white max-h-96 flex flex-col z-20">
      <div className="p-4 border-b border-neutral-700 flex justify-between items-center flex-shrink-0">
        <h3 className="font-bold">Queue</h3>
        <button onClick={onClose} className="text-neutral-400 hover:text-white">
          <CloseIcon />
        </button>
      </div>
      <div className="overflow-y-auto">
        {queue.length > 0 ? (
          <ul>
            {queue.map((song) => {
              const isActive = currentSong?.queueId === song.queueId;
              return (
                <li
                  key={song.queueId}
                  className={`group flex items-center justify-between p-3 hover:bg-neutral-700 ${isActive ? 'bg-neutral-700/50' : ''}`}
                  onDoubleClick={() => handlePlayPause(song)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <img src={song.coverArt} alt={song.title} className="w-10 h-10 rounded object-cover" />
                      <button 
                        onClick={() => handlePlayPause(song)} 
                        className={`absolute inset-0 bg-black/50 flex items-center justify-center rounded transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${isActive ? 'opacity-100' : ''}`}
                      >
                          {isActive && isPlaying ? <PauseIcon /> : <PlayIcon color={isActive ? '#10B981' : 'white'}/>}
                      </button>
                    </div>
                    <div className="truncate">
                      <p className={`font-medium truncate ${isActive ? 'text-emerald-400' : 'text-white'}`}>{song.title}</p>
                      <p className="text-sm text-neutral-400 truncate">{song.artist}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => song.queueId && removeFromQueue(song.queueId)}
                    className="text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                    aria-label="Remove from queue"
                  >
                    <TrashIcon />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-4 text-center text-neutral-400">Queue is empty.</p>
        )}
      </div>
    </div>
  );
};

export default QueueView;
