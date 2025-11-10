
import React, { useEffect, useState } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { CloseIcon } from './Icons';

const LyricsView: React.FC = () => {
  const { currentSong, toggleLyricsView, fetchLyrics } = usePlayer();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentSong && !currentSong.lyrics) {
      setIsLoading(true);
      setError(null);
      fetchLyrics(currentSong)
        .catch(() => setError("Couldn't find lyrics for this song."))
        .finally(() => setIsLoading(false));
    } else if (!currentSong) {
        setIsLoading(false);
        setError(null);
    }
  }, [currentSong, fetchLyrics]);

  const lyricsText = currentSong?.lyrics?.split('\n').map((line, index) => (
    <p key={index} className="mb-2">{line || '\u00A0'}</p> // Use non-breaking space for empty lines
  ));

  const content = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="mt-4 text-neutral-300">Finding lyrics...</p>
        </div>
      );
    }
    if (error) {
        return <p className="text-center text-neutral-400">{error}</p>;
    }
    if (currentSong?.lyrics && currentSong.lyrics !== "Lyrics not found.") {
      return <div className="text-2xl md:text-3xl font-semibold leading-relaxed text-neutral-300 text-center">{lyricsText}</div>;
    }
    return <p className="text-center text-neutral-400">No lyrics available for this song.</p>;
  };

  return (
    <main className="flex-1 overflow-y-auto bg-neutral-900 text-white relative">
        <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-md"
            style={{ backgroundImage: `url(${currentSong?.coverArt})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-900 via-neutral-900/50"></div>

        <div className="relative z-10 p-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8 flex-shrink-0">
                <div className="flex items-center gap-4">
                    {currentSong && <img src={currentSong.coverArt} alt={currentSong.title} className="w-16 h-16 rounded"/>}
                    <div>
                        <p className="text-2xl font-bold">{currentSong?.title || "No song playing"}</p>
                        <p className="text-md text-neutral-300">{currentSong?.artist}</p>
                    </div>
                </div>
                <button onClick={toggleLyricsView} className="text-neutral-400 hover:text-white bg-black/50 rounded-full p-2">
                    <CloseIcon />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
                {content()}
            </div>
        </div>
    </main>
  );
};

export default LyricsView;
