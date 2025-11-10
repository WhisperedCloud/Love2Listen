
import React, { useState } from 'react';
// Fix: Corrected import path for usePlayer hook.
import { usePlayer } from '../hooks/usePlayer';
import {
  PlayIcon,
  PauseIcon,
  NextIcon,
  PreviousIcon,
  ShuffleIcon,
  RepeatIcon,
  VolumeIcon,
  VolumeMuteIcon,
  QueueIcon,
  LyricsIcon,
} from './Icons';
import QueueView from './QueueView';
import { RepeatMode } from '../types';

const Player: React.FC = () => {
  const {
    isPlaying,
    currentSong,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    isLyricsVisible,
    togglePlayPause,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleLyricsView,
  } = usePlayer();

  const [isQueueVisible, setIsQueueVisible] = useState(false);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };
  
  if (!currentSong) {
    return (
        <div className="h-24 bg-neutral-900 border-t border-neutral-800 p-2 grid grid-cols-3 text-white">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-neutral-800 rounded"></div>
                <div>
                    <div className="h-4 w-24 bg-neutral-800 rounded mb-2"></div>
                    <div className="h-3 w-16 bg-neutral-800 rounded"></div>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-4 text-neutral-600">
                    <ShuffleIcon />
                    <PreviousIcon />
                    <div className="bg-neutral-700 rounded-full p-2 w-8 h-8 flex items-center justify-center">
                        <PlayIcon />
                    </div>
                    <NextIcon />
                    <RepeatIcon mode={RepeatMode.NONE} />
                </div>
                <div className="flex items-center gap-2 w-full max-w-lg mt-2">
                    <span className="text-xs text-neutral-600">0:00</span>
                    <div className="w-full h-1 bg-neutral-700 rounded-lg"></div>
                    <span className="text-xs text-neutral-600">0:00</span>
                </div>
            </div>
            <div className="flex items-center justify-end gap-4 text-neutral-600">
                <LyricsIcon />
                <QueueIcon />
                <div className="flex items-center gap-2 w-32">
                    <VolumeIcon />
                    <div className="w-full h-1 bg-neutral-700 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <footer className="h-24 bg-neutral-900 border-t border-neutral-800 p-2 grid grid-cols-3 text-white">
      {/* Song Info */}
      <div className="flex items-center gap-4">
        <img src={currentSong.coverArt} alt={currentSong.title} className="w-16 h-16 rounded"/>
        <div>
          <p className="font-semibold">{currentSong.title}</p>
          <p className="text-sm text-neutral-400">{currentSong.artist}</p>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center gap-4">
            <button onClick={toggleShuffle} className="text-neutral-400 hover:text-white">
                <ShuffleIcon color={isShuffled ? '#10B981' : 'currentColor'} />
            </button>
            <button onClick={playPrevious} className="text-neutral-400 hover:text-white">
                <PreviousIcon />
            </button>
            <button onClick={togglePlayPause} className="bg-white text-black rounded-full p-2 w-8 h-8 flex items-center justify-center hover:scale-105">
                {isPlaying ? <PauseIcon /> : <PlayIcon color='black' />}
            </button>
            <button onClick={playNext} className="text-neutral-400 hover:text-white">
                <NextIcon />
            </button>
            <button onClick={toggleRepeat} className="text-neutral-400 hover:text-white">
                <RepeatIcon mode={repeatMode} />
            </button>
        </div>
        <div className="flex items-center gap-2 w-full max-w-lg mt-2">
            <span className="text-xs text-neutral-400">{formatTime(currentTime)}</span>
            <input 
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none"
            />
            <span className="text-xs text-neutral-400">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Other Controls */}
      <div className="flex items-center justify-end gap-4 relative">
        <button onClick={toggleLyricsView} className="text-neutral-400 hover:text-white">
          <LyricsIcon color={isLyricsVisible ? '#10B981' : 'currentColor'}/>
        </button>
        <button onClick={() => setIsQueueVisible(!isQueueVisible)} className="text-neutral-400 hover:text-white">
            <QueueIcon />
        </button>
        <div className="flex items-center gap-2 w-32">
            <button onClick={() => setVolume(volume > 0 ? 0 : 0.75)} className="text-neutral-400 hover:text-white">
                {volume === 0 ? <VolumeMuteIcon /> : <VolumeIcon />}
            </button>
            <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none"
            />
        </div>
        {isQueueVisible && <QueueView onClose={() => setIsQueueVisible(false)} />}
      </div>
    </footer>
  );
};

export default Player;
