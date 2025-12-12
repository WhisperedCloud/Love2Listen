import React, { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { CloseIcon, PlusIcon } from './Icons';
import { Song } from '../types';

const ModalWrapper: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-neutral-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <CloseIcon />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

const CreatePlaylistModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [name, setName] = useState('');
  const { createPlaylist } = usePlayer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createPlaylist(name.trim());
      onClose();
    }
  };

  return (
    <ModalWrapper title="Create Playlist" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Playlist name"
          className="w-full bg-neutral-700 rounded-md p-3 mb-4 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="bg-transparent text-white font-bold py-2 px-4 rounded-full hover:bg-neutral-700">
            Cancel
          </button>
          <button type="submit" className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-full hover:bg-emerald-500 disabled:bg-neutral-600" disabled={!name.trim()}>
            Create
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

const UploadModal: React.FC<{ onClose: () => void, targetPlaylistId?: number }> = ({ onClose, targetPlaylistId }) => {
  const { playlists, addFilesToPlaylist, openModal } = usePlayer();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(targetPlaylistId || playlists[0]?.id || null);
  const [files, setFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (files && selectedPlaylistId !== null) {
      await addFilesToPlaylist(files, selectedPlaylistId);
      onClose();
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <ModalWrapper title="Upload Songs" onClose={onClose}>
      <div className="flex items-center gap-4 mb-4">
        <label htmlFor="playlist-select" className="text-neutral-300">Playlist:</label>
        <select
          id="playlist-select"
          value={selectedPlaylistId ?? ''}
          onChange={(e) => setSelectedPlaylistId(Number(e.target.value))}
          className="flex-1 bg-neutral-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={() => openModal('createPlaylist')} className="text-neutral-400 hover:text-white" title="Create new playlist"><PlusIcon /></button>
      </div>
      <button
        onClick={triggerFileSelect}
        className="w-full border-2 border-dashed border-neutral-600 rounded-md p-6 text-center text-neutral-400 hover:border-emerald-500 hover:text-white transition-colors"
      >
        {files ? `${files.length} file(s) selected` : 'Click to select songs'}
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => setFiles(e.target.files)}
        multiple
        accept="audio/*"
        className="hidden"
      />
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onClose} className="bg-transparent text-white font-bold py-2 px-4 rounded-full hover:bg-neutral-700">
          Cancel
        </button>
        <button onClick={handleUpload} className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-full hover:bg-emerald-500 disabled:bg-neutral-600" disabled={!files || selectedPlaylistId === null}>
          Upload
        </button>
      </div>
    </ModalWrapper>
  );
};

const AddToPlaylistModal: React.FC<{ onClose: () => void, song: Song }> = ({ onClose, song }) => {
    const { playlists, addSongToExistingPlaylist, openModal } = usePlayer();

    const handleSelectPlaylist = (playlistId: number) => {
        addSongToExistingPlaylist(song, playlistId);
        onClose();
    };

    return (
        <ModalWrapper title="Add to Playlist" onClose={onClose}>
            <button onClick={() => openModal('createPlaylist')} className="w-full flex items-center gap-2 p-3 rounded hover:bg-neutral-700 mb-2">
                <div className="w-10 h-10 bg-neutral-700 flex items-center justify-center rounded"><PlusIcon /></div>
                New Playlist
            </button>
            <div className="max-h-60 overflow-y-auto">
                {playlists.map(p => (
                    <div key={p.id} onClick={() => handleSelectPlaylist(p.id)} className="flex items-center gap-3 p-2 rounded hover:bg-neutral-700 cursor-pointer">
                        <img src={p.coverArt} alt={p.name} className="w-10 h-10 rounded object-cover" />
                        <span>{p.name}</span>
                    </div>
                ))}
            </div>
        </ModalWrapper>
    );
};

const ModalManager: React.FC = () => {
  const { activeModal, closeModal, modalTarget } = usePlayer();

  if (!activeModal) return null;

  switch (activeModal) {
    case 'createPlaylist':
      return <CreatePlaylistModal onClose={closeModal} />;
    case 'upload':
      return <UploadModal onClose={closeModal} targetPlaylistId={typeof modalTarget === 'number' ? modalTarget : undefined} />;
    case 'addToPlaylist':
        if (modalTarget && typeof modalTarget === 'object' && 'id' in modalTarget) {
            return <AddToPlaylistModal onClose={closeModal} song={modalTarget as Song} />;
        }
        return null;
    default:
      return null;
  }
};

export default ModalManager;
