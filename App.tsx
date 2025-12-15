import React from 'react';
import Sidebar, { MobileNav } from './components/Sidebar';
import MainView from './components/MainView';
import Player from './components/Player';
import LyricsView from './components/LyricsView';
import { PlayerProvider, usePlayer } from './hooks/usePlayer';
import HomeView from './components/HomeView';
import SearchView from './components/SearchView';
import ModalManager from './components/ModalManager';

import SplashPage from './components/SplashPage';

const AppContent: React.FC = () => {
  const { isLyricsVisible, currentView } = usePlayer();
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashPage />;
  }

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
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row mb-0 lg:mb-0">
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