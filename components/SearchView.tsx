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
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-900 via-neutral-900 to-black text-white p-4 lg:p-8">
            <div className="relative mb-8 max-w-4xl mx-auto">
                <input
                    type="text"
                    placeholder="What do you want to listen to?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-800 rounded-full py-4 pl-14 pr-6 text-white text-lg placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all shadow-lg hover:bg-neutral-700/80"
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                    <SearchIcon color="#fff" size={24} />
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                {searchResults.length > 0 ? (
                    <div className="flex flex-col">
                        {/* Table Header */}
                        <div className="grid grid-cols-[3rem_1fr_4rem] lg:grid-cols-[3rem_2fr_1fr_4rem] gap-4 px-4 py-2 border-b border-white/10 text-neutral-400 text-sm font-medium mb-2 uppercase tracking-wider">
                            <div className="text-center">#</div>
                            <div>Title</div>
                            <div className="hidden lg:block">Album</div>
                            <div className="text-right flex justify-end">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>

                        {/* Results List */}
                        {searchResults.map((song, index) => {
                            const isActive = currentSong?.id === song.id;
                            return (
                                <div
                                    key={song.id}
                                    className={`group grid grid-cols-[3rem_1fr_4rem] lg:grid-cols-[3rem_2fr_1fr_4rem] gap-4 px-4 py-3 rounded-lg items-center hover:bg-white/10 transition-colors cursor-pointer ${isActive ? 'bg-white/5' : ''}`}
                                    onDoubleClick={() => playSong(song)}
                                >
                                    <div className="relative flex justify-center items-center text-neutral-400 font-medium">
                                        <span className={`group-hover:hidden ${isActive && isPlaying ? 'hidden' : 'block'}`}>{index + 1}</span>
                                        <button onClick={() => playSong(song)} className={`hidden group-hover:block ${isActive && isPlaying ? 'block' : ''}`}>
                                            <PlayIcon color={isActive ? '#10B981' : 'white'} size={16} />
                                        </button>
                                        <div className={`block group-hover:hidden ${isActive && isPlaying ? 'block' : 'hidden'}`}>
                                            <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2bf4.gif" alt="playing" className="w-3 h-3" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 min-w-0">
                                        <img src={song.coverArt} alt={song.title} className="w-10 h-10 lg:w-12 lg:h-12 rounded shadow-sm object-cover flex-shrink-0" />
                                        <div className="min-w-0 pr-2">
                                            <p className={`font-medium truncate text-base ${isActive ? 'text-emerald-500' : 'text-white'}`}>{song.title}</p>
                                            <p className="text-sm text-neutral-400 truncate group-hover:text-white transition-colors">{song.artist}</p>
                                        </div>
                                    </div>

                                    <div className="hidden lg:block text-sm text-neutral-400 truncate group-hover:text-neutral-300">
                                        {song.album}
                                    </div>

                                    <div className="text-sm text-neutral-400 text-right tabular-nums">
                                        {formatDuration(song.duration)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center mt-20 text-neutral-500">
                        {searchQuery ? (
                            <>
                                <p className="text-lg">No results found for <span className="text-white font-semibold">"{searchQuery}"</span></p>
                                <p className="text-sm mt-2">Please make sure your words are spelled correctly or use less or different keywords.</p>
                            </>
                        ) : (
                            <div className="text-center">
                                <SearchIcon size={64} className="mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium text-neutral-400">Search for songs, artists, or albums</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
};

export default SearchView;
