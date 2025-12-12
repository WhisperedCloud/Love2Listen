import React from 'react';
import { RepeatMode } from '../types';

interface IconProps {
    color?: string;
    size?: number | string;
    className?: string;
}

export const PlayIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 24, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M8 5v14l11-7z" />
    </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 24, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

export const NextIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 24, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
);

export const PreviousIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 24, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
    </svg>
);

export const ShuffleIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 20, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="16 16 21 16 21 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line>
    </svg>
);

export const RepeatIcon: React.FC<{ mode: RepeatMode }> = ({ mode }) => {
    const color = mode !== RepeatMode.NONE ? '#10B981' : 'currentColor';
    return (
        <div className="relative">
            <svg height={20} width={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
            {mode === RepeatMode.SONG && <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">1</span>}
        </div>
    )
};

export const VolumeIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 20, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
);

export const VolumeMuteIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 20, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>
);

export const QueueIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 20, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);

export const LyricsIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 20, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 24, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 16, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 24, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export const MusicNoteIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 24, className }) => (
     <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>
    </svg>
);

export const PlaylistIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 24, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);

export const EditIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 24, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 24, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 24, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

export const ThreeDotsIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 20, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill={color} className={className}>
        <circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle><circle cx="5" cy="12" r="2"></circle>
    </svg>
);

export const SaveIcon: React.FC<IconProps> = ({ color = 'currentColor', size = 20, className }) => (
    <svg height={size} width={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
);

export const SoundBarsIcon: React.FC<IconProps> = ({ color = '#10B981', size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <rect className="animate-[grow] origin-b" x="4" y="6" width="4" height="12" style={{ animationDelay: '-0.4s' }} />
        <rect className="animate-[grow] origin-b" x="10" y="6" width="4" height="12" />
        <rect className="animate-[grow] origin-b" x="16" y="6" width="4" height="12" style={{ animationDelay: '-0.2s' }} />
        <style>{`
            @keyframes grow {
                0%, 100% { transform: scaleY(0.3); }
                50% { transform: scaleY(1); }
            }
            .animate-\\[grow\\] {
                animation: grow 1s ease-in-out infinite;
            }
        `}</style>
    </svg>
);
