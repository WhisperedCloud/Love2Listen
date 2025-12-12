
import React, { useState, useRef } from 'react';
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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volProgress = volume * 100;

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
    <footer className="h-20 lg:h-24 bg-neutral-900 border-t border-neutral-800 p-2 flex lg:grid lg:grid-cols-3 justify-between items-center text-white">
      {/* Song Info */}
      <div className="flex items-center gap-3 lg:gap-4 w-1/3 lg:w-auto overflow-hidden">
        <img src={currentSong.coverArt} alt={currentSong.title} className="w-10 h-10 lg:w-16 lg:h-16 rounded flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-sm lg:text-base truncate">{currentSong.title}</p>
          <p className="text-xs lg:text-sm text-neutral-400 truncate">{currentSong.artist}</p>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-[50%] lg:max-w-none">
        <div className="flex items-center gap-2 lg:gap-4">
          <button onClick={toggleShuffle} className="hidden lg:block text-neutral-400 hover:text-white transition-colors">
            <ShuffleIcon color={isShuffled ? '#10B981' : 'currentColor'} />
          </button>
          <button onClick={playPrevious} className="text-neutral-400 hover:text-white transition-colors">
            <PreviousIcon />
          </button>
          <button onClick={togglePlayPause} className="bg-white text-black rounded-full p-1 lg:p-2 w-8 h-8 flex items-center justify-center hover:scale-105 transition-transform">
            {isPlaying ? <PauseIcon /> : <PlayIcon color='black' />}
          </button>
          <button onClick={playNext} className="text-neutral-400 hover:text-white transition-colors">
            <NextIcon />
          </button>
          <button onClick={toggleRepeat} className="hidden lg:block text-neutral-400 hover:text-white transition-colors">
            <RepeatIcon mode={repeatMode} />
          </button>
        </div>
        <div className="flex items-center gap-2 w-full max-w-lg mt-1 lg:mt-2 group text-[10px] lg:text-xs">
          <span className="text-neutral-400 w-8 text-right hidden lg:inline">{formatTime(currentTime)}</span>
          <div className="relative w-full h-1 bg-neutral-600 rounded-lg">
            <div className="absolute top-0 left-0 h-full bg-white rounded-lg group-hover:bg-emerald-500" style={{ width: `${progress}%` }}></div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="absolute top-0 left-0 w-full h-full bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 transition-opacity"
            />
          </div>
          <span className="text-neutral-400 w-8 hidden lg:inline">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Other Controls */}
      <div className="flex items-center justify-end gap-2 lg:gap-4 relative w-1/3 lg:w-auto">
        <button onClick={toggleLyricsView} className="text-neutral-400 hover:text-white transition-colors">
          <LyricsIcon color={isLyricsVisible ? '#10B981' : 'currentColor'} />
        </button>
        <button onClick={() => setIsQueueVisible(!isQueueVisible)} className="hidden lg:block text-neutral-400 hover:text-white transition-colors">
          <QueueIcon />
        </button>
        <div className="hidden lg:flex items-center gap-2 w-32 group">
          <button onClick={() => setVolume(volume > 0 ? 0 : 0.75)} className="text-neutral-400 hover:text-white transition-colors">
            {volume === 0 ? <VolumeMuteIcon /> : <VolumeIcon />}
          </button>
          <div className="relative w-full h-1 bg-neutral-600 rounded-lg">
            <div className="absolute top-0 left-0 h-full bg-white rounded-lg group-hover:bg-emerald-500" style={{ width: `${volProgress}%` }}></div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="absolute top-0 left-0 w-full h-full bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 transition-opacity"
            />
          </div>
        </div>
        {isQueueVisible && <QueueView onClose={() => setIsQueueVisible(false)} />}
      </div>
    </footer>
  );
};

export default Player;
