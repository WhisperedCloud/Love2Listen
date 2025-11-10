import React, { useState, useRef } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { PlusIcon, MusicNoteIcon, PlaylistIcon } from './Icons';
import { Playlist } from '../types';

const CreatePlaylistModal = ({ onClose, onCreate }: { onClose: () => void, onCreate: (playlist: Playlist) => void }) => {
    const { createPlaylist } = usePlayer();
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            const newPlaylist = createPlaylist(name.trim());
            onCreate(newPlaylist);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-neutral-800 p-6 rounded-lg w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4">New Playlist</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="playlist-name" className="block text-sm font-medium text-neutral-300">Name</label>
                        <input
                            type="text"
                            id="playlist-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full bg-neutral-700 border border-neutral-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="My Awesome Mix"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-neutral-600 hover:bg-neutral-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-md text-white bg-emerald-600 hover:bg-emerald-500">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const UploadSongsModal = ({ onClose }: { onClose: () => void }) => {
    const { playlists, addFilesToPlaylist, createPlaylist } = usePlayer();
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(playlists.length > 0 ? playlists[0].id : null);
    const [files, setFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!files || files.length === 0 || selectedPlaylistId === null) {
            alert('Please select one or more audio files and a playlist.');
            return;
        }
        
        setIsUploading(true);
        try {
            await addFilesToPlaylist(files, selectedPlaylistId);
        } catch (error) {
            console.error("Failed to upload songs:", error);
            alert("An error occurred during upload. Please check the console.");
        } finally {
            setIsUploading(false);
            onClose();
        }
    };

    const handlePlaylistCreated = (newPlaylist: Playlist) => {
        setSelectedPlaylistId(newPlaylist.id);
        setIsCreateModalOpen(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-neutral-800 p-6 rounded-lg w-full max-w-md">
                    <h2 className="text-xl font-bold mb-4">Upload Songs</h2>
                    <form onSubmit={handleSubmit}>
                         <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="playlist" className="block text-sm font-medium text-neutral-300">Playlist</label>
                                <button type="button" onClick={() => setIsCreateModalOpen(true)} className="text-sm text-emerald-400 hover:text-emerald-300 font-medium">New</button>
                            </div>
                            <select id="playlist" value={selectedPlaylistId ?? ''} onChange={e => setSelectedPlaylistId(Number(e.target.value))} required className="block w-full bg-neutral-700 border border-neutral-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500">
                               {playlists.length === 0 ? <option disabled>Create a playlist first</option> : playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                         <div className="mb-4">
                            <label className="block text-sm font-medium text-neutral-300">Audio Files</label>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-1 w-full bg-neutral-700 border border-neutral-600 rounded-md py-2 px-3 text-left truncate">
                               {files ? `${files.length} file(s) selected` : 'Select files...'}
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={e => e.target.files && setFiles(e.target.files)} 
                                accept="audio/*" 
                                className="hidden"
                                multiple
                            />
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-neutral-600 hover:bg-neutral-500">Cancel</button>
                            <button type="submit" disabled={isUploading || playlists.length === 0} className="px-4 py-2 rounded-md text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed">
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {isCreateModalOpen && <CreatePlaylistModal onClose={() => setIsCreateModalOpen(false)} onCreate={handlePlaylistCreated} />}
        </>
    );
};


const Sidebar: React.FC = () => {
    const { playlists, selectedPlaylistId, setSelectedPlaylistId } = usePlayer();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    return (
        <aside className="w-64 bg-black text-neutral-300 flex flex-col p-2">
            <div className="bg-neutral-900 rounded-lg p-2 mb-2">
                 {/* Can be used for navigation like Home, Search, etc. */}
            </div>
            <div className="bg-neutral-900 rounded-lg flex-1 flex flex-col">
                <div className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <PlaylistIcon />
                        <h2 className="font-bold">Your Library</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsCreateModalOpen(true)} className="text-neutral-400 hover:text-white" title="Create playlist"><PlusIcon /></button>
                        <button onClick={() => setIsUploadModalOpen(true)} className="text-neutral-400 hover:text-white" title="Add song"><MusicNoteIcon /></button>
                    </div>
                </div>
                <div className="overflow-y-auto px-2">
                    {playlists.map(playlist => (
                        <div
                            key={playlist.id}
                            onClick={() => setSelectedPlaylistId(playlist.id)}
                            className={`flex items-center gap-4 p-2 rounded cursor-pointer hover:bg-neutral-800 ${selectedPlaylistId === playlist.id ? 'bg-neutral-800' : ''}`}
                        >
                            <img src={playlist.coverArt} alt={playlist.name} className="w-12 h-12 rounded" />
                            <div>
                                <p className="font-semibold text-white">{playlist.name}</p>
                                <p className="text-sm">Playlist</p>
                            </div>
                        </div>
                    ))}
                     {playlists.length === 0 && (
                        <p className="p-4 text-center text-neutral-500 text-sm">Create a playlist to get started.</p>
                    )}
                </div>
            </div>
            {isUploadModalOpen && <UploadSongsModal onClose={() => setIsUploadModalOpen(false)} />}
            {isCreateModalOpen && <CreatePlaylistModal onClose={() => setIsCreateModalOpen(false)} onCreate={() => setIsCreateModalOpen(false)} />}
        </aside>
    );
};

export default Sidebar;