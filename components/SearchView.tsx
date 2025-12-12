import React from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { PlayIcon, SearchIcon } from './Icons';

const SearchView: React.FC = () => {
    const { searchQuery, setSearchQuery, searchResults, playSong, currentSong, isPlaying } = usePlayer();

    const formatDuration = (seconds: number) => {
        if (isNaN(seconds) || seconds === 0) return '-:--';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-800 to-neutral-900 text-white p-8">
            <div className="relative mb-8">
                <input
                    type="text"
                    placeholder="Search for songs, artists, or albums"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-700/80 rounded-full py-3 pl-12 pr-4 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <SearchIcon color="#aaa" />
                </div>
            </div>

            <div>
                {searchResults.length > 0 ? (
                    <table className="w-full text-left">
                        <tbody>
                            {searchResults.map((song, index) => {
                                const isActive = currentSong?.id === song.id;
                                return (
                                    <tr 
                                        key={song.id} 
                                        className="group hover:bg-neutral-800/50 rounded-md"
                                        onDoubleClick={() => playSong(song)}
                                    >
                                        <td className="p-3 text-neutral-400 relative w-12 text-center">
                                            <span className={`group-hover:hidden ${isActive && isPlaying ? 'hidden' : ''}`}>{index + 1}</span>
                                            <button onClick={() => playSong(song)} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover:block ${isActive && isPlaying ? 'block' : ''}`}>
                                                <PlayIcon color={isActive ? '#10B981' : 'white'} />
                                            </button>
                                        </td>
                                        <td className="p-3 flex items-center gap-3">
                                            <img src={song.coverArt} alt={song.title} className="w-10 h-10 rounded object-cover"/>
                                            <div>
                                                <p className={`font-medium ${isActive ? 'text-emerald-400' : 'text-white'}`}>{song.title}</p>
                                                <p className="text-sm text-neutral-400">{song.artist}</p>
                                            </div>
                                        </td>
                                        <td className="p-3 text-neutral-400">{song.album}</td>
                                        <td className="p-3 text-neutral-400">{formatDuration(song.duration)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                ) : (
                    searchQuery && <p className="text-center text-neutral-400">No results found for "{searchQuery}".</p>
                )}
            </div>
        </main>
    );
};

export default SearchView;
