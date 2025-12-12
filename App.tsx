import React from 'react';
import Sidebar, { MobileNav } from './components/Sidebar';
import MainView from './components/MainView';
import Player from './components/Player';
import LyricsView from './components/LyricsView';
import { PlayerProvider, usePlayer } from './hooks/usePlayer';
import HomeView from './components/HomeView';
import SearchView from './components/SearchView';
import ModalManager from './components/ModalManager';

const AppContent: React.FC = () => {
  const { isLyricsVisible, currentView } = usePlayer();

  const renderMainView = () => {
    if (isLyricsVisible) return <LyricsView />;
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'search':
        return <SearchView />;
      case 'playlist':
        return <MainView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="h-screen flex flex-col font-sans">
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row mb-0 md:mb-0">
        <Sidebar />
        {renderMainView()}
      </div>
      <Player />
      <MobileNav />
      <ModalManager />
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