
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
    return null;
  }

  return (
    <footer className="fixed bottom-[72px] lg:bottom-0 left-0 right-0 h-16 lg:h-24 bg-neutral-900 border-t border-neutral-800 z-50">
      {/* Mobile Component */}
      <div className="lg:hidden flex flex-col h-full relative">
        {/* Progress Bar (Top Edge) */}
        <div className="absolute -top-[1px] left-0 right-0 h-[2px] bg-neutral-800 pointer-events-none">
          <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="flex items-center justify-between h-full px-3">
          {/* Mobile Song Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
            <div className={`relative w-10 h-10 flex-shrink-0 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
              <img src={currentSong.coverArt} alt={currentSong.title} className="w-full h-full rounded-full object-cover border border-neutral-700" />
              <div className="absolute inset-0 rounded-full border border-white/10"></div>
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="font-bold text-sm text-white truncate">{currentSong.title}</p>
              <p className="text-xs text-neutral-400 truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={toggleLyricsView} className={`text-neutral-400 ${isLyricsVisible ? 'text-emerald-500' : ''}`}>
              <LyricsIcon size={20} />
            </button>
            <button onClick={togglePlayPause} className="text-white bg-white/10 rounded-full p-2 hover:scale-105 active:scale-95 transition-all">
              {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
            </button>
            <button onClick={playNext} className="text-neutral-300">
              <NextIcon size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Component */}
      <div className="hidden lg:flex lg:grid lg:grid-cols-3 justify-between items-center h-full px-8">
        {/* Desktop Song Info */}
        <div className="flex items-center gap-4 w-auto overflow-hidden max-w-[30%] group cursor-default">
          <div className={`relative transition-transform duration-500 group-hover:scale-105 ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
            <img src={currentSong.coverArt} alt={currentSong.title} className="w-16 h-16 rounded-full flex-shrink-0 object-cover border-2 border-neutral-800 shadow-lg" />
            <div className="absolute inset-0 rounded-full border border-white/10"></div>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-base truncate group-hover:text-emerald-400 transition-colors duration-300">{currentSong.title}</p>
            <p className="text-sm text-neutral-400 truncate">{currentSong.artist}</p>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-2xl px-8">
          <div className="flex items-center gap-6 mb-1">
            <button onClick={toggleShuffle} className={`transition-all hover:scale-110 active:scale-95 p-2 rounded-full hover:bg-white/5 ${isShuffled ? 'text-emerald-500' : 'text-neutral-400 hover:text-white'}`} title="Shuffle">
              <ShuffleIcon size={20} />
            </button>
            <button onClick={playPrevious} className="text-neutral-400 hover:text-white transition-all hover:scale-110 active:scale-95 p-2 rounded-full hover:bg-white/5" title="Previous">
              <PreviousIcon size={24} />
            </button>
            <button onClick={togglePlayPause} className="bg-white text-black rounded-full p-3 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-white/20 mx-2">
              {isPlaying ? <PauseIcon size={28} /> : <PlayIcon color='black' size={28} />}
            </button>
            <button onClick={playNext} className="text-neutral-400 hover:text-white transition-all hover:scale-110 active:scale-95 p-2 rounded-full hover:bg-white/5" title="Next">
              <NextIcon size={24} />
            </button>
            <button onClick={toggleRepeat} className={`transition-all hover:scale-110 active:scale-95 p-2 rounded-full hover:bg-white/5 ${repeatMode !== 'none' ? 'text-emerald-500' : 'text-neutral-400 hover:text-white'}`} title="Repeat">
              <RepeatIcon mode={repeatMode} />
            </button>
          </div>

          <div className="flex items-center gap-3 w-full group text-xs font-medium text-neutral-400">
            <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
            <div className="relative flex-1 h-1.5 bg-neutral-800 rounded-full group-hover:h-2 transition-all duration-300">
              <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${progress}%` }}></div>
              <div className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ left: `${progress}%` }}></div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute top-0 left-0 w-full h-full bg-transparent appearance-none cursor-pointer z-10"
              />
            </div>
            <span className="w-10 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Desktop Volume & Extras */}
        <div className="flex items-center justify-end gap-4 w-auto min-w-[120px]">
          <button onClick={toggleLyricsView} className={`transition-colors p-2 rounded-full hover:bg-white/10 ${isLyricsVisible ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'}`} title="Lyrics">
            <LyricsIcon size={20} />
          </button>
          <button onClick={() => setIsQueueVisible(!isQueueVisible)} className={`transition-colors p-2 rounded-full hover:bg-white/10 ${isQueueVisible ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'}`} title="Queue">
            <QueueIcon size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-2 w-32 group ml-2">
            <button onClick={() => setVolume(volume > 0 ? 0 : 0.75)} className="text-neutral-400 hover:text-white transition-colors p-1" title={volume === 0 ? "Unmute" : "Mute"}>
              {volume === 0 ? <VolumeMuteIcon size={20} /> : <VolumeIcon size={20} />}
            </button>
            <div className="relative w-full h-1 bg-neutral-600 rounded-lg overflow-hidden group-hover:h-1.5 transition-all">
              <div className="absolute top-0 left-0 h-full bg-white rounded-lg group-hover:bg-emerald-500 transition-colors" style={{ width: `${volProgress}%` }}></div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="absolute top-0 left-0 w-full h-full bg-transparent appearance-none cursor-pointer text-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0"
              />
            </div>
          </div>
          {isQueueVisible && <QueueView onClose={() => setIsQueueVisible(false)} />}
        </div>
      </div>
    </footer>
  );
};

export default Player;
