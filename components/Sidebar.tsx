import React from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { PlusIcon, PlaylistIcon, HomeIcon, SearchIcon } from './Icons';

const Sidebar: React.FC = () => {
    const {
        playlists,
        selectedPlaylistId,
        setSelectedPlaylistId,
        currentView,
        setCurrentView,
        openModal
    } = usePlayer();

    return (
        <aside className="w-64 bg-black text-neutral-300 hidden md:flex flex-col p-2 h-full">
            <div className="bg-neutral-900 rounded-lg p-2 mb-2">
                <nav className="flex flex-col gap-1">
                    <button onClick={() => setCurrentView('home')} className={`flex items-center gap-4 p-2 rounded font-bold transition-colors ${currentView === 'home' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}>
                        <HomeIcon />
                        <span>Home</span>
                    </button>
                    <button onClick={() => setCurrentView('search')} className={`flex items-center gap-4 p-2 rounded font-bold transition-colors ${currentView === 'search' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}>
                        <SearchIcon />
                        <span>Search</span>
                    </button>
                </nav>
            </div>
            <div className="bg-neutral-900 rounded-lg flex-1 flex flex-col">
                <div className="p-4 flex justify-between items-center">
                    <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 cursor-pointer">
                        <PlaylistIcon />
                        <h2 className="font-bold text-neutral-400 hover:text-white">Your Library</h2>
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => openModal('createPlaylist')} className="text-neutral-400 hover:text-white" title="Create playlist"><PlusIcon /></button>
                    </div>
                </div>
                <div className="px-4 mb-2">
                    <button onClick={() => openModal('upload')} className="w-full bg-emerald-600 text-white font-bold py-2 px-4 rounded-full hover:bg-emerald-500 text-sm">Upload Songs</button>
                </div>
                <div className="overflow-y-auto px-2">
                    {playlists.map(playlist => (
                        <div
                            key={playlist.id}
                            onClick={() => setSelectedPlaylistId(playlist.id)}
                            className={`flex items-center gap-4 p-2 rounded cursor-pointer transition-colors ${selectedPlaylistId === playlist.id && currentView === 'playlist' ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'}`}
                        >
                            <img src={playlist.coverArt} alt={playlist.name} className="w-12 h-12 rounded" />
                            <div>
                                <p className="font-semibold text-white truncate">{playlist.name}</p>
                                <p className="text-sm">Playlist</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export const MobileNav: React.FC = () => {
    const { currentView, setCurrentView } = usePlayer();

    return (
        <nav className="md:hidden flex justify-around items-center bg-black p-4 text-neutral-400 border-t border-neutral-800">
            <button
                onClick={() => setCurrentView('home')}
                className={`flex flex-col items-center gap-1 ${currentView === 'home' || currentView === 'playlist' ? 'text-white' : ''}`}
            >
                <HomeIcon />
                <span className="text-xs">Home</span>
            </button>
            <button
                onClick={() => setCurrentView('search')}
                className={`flex flex-col items-center gap-1 ${currentView === 'search' ? 'text-white' : ''}`}
            >
                <SearchIcon />
                <span className="text-xs">Search</span>
            </button>
            <button
                onClick={() => setCurrentView('home')} // Library usually goes to home/library in this simple app
                className={`flex flex-col items-center gap-1 ${currentView === 'playlist' ? 'text-white' : ''}`}
            >
                <PlaylistIcon />
                <span className="text-xs">Library</span>
            </button>
        </nav>
    );
};

export default Sidebar;