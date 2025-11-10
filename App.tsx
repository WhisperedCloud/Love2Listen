
import React from 'react';
// Fix: Corrected import paths to be relative.
import Sidebar from './components/Sidebar';
import MainView from './components/MainView';
import Player from './components/Player';
import LyricsView from './components/LyricsView';
import { PlayerProvider, usePlayer } from './hooks/usePlayer';

const AppContent: React.FC = () => {
  const { isLyricsVisible } = usePlayer();
  return (
    <div className="h-screen flex flex-col font-sans">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {isLyricsVisible ? <LyricsView /> : <MainView />}
      </div>
      <Player />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
};

export default App;
