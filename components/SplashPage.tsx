import React from 'react';
import { MusicNoteIcon } from './Icons';

const SplashPage: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-neutral-900 flex flex-col items-center justify-center z-50 animate-fade-out" style={{ animationDelay: '1.8s', animationFillMode: 'forwards' }}>
            <div className="flex flex-col items-center animate-bounce-in">
                <div className="mb-6 transform hover:scale-105 transition-transform duration-500">
                    <img src="/icon-512.png" alt="Love to Listen Logo" className="w-24 h-24 rounded-2xl shadow-2xl" />
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 tracking-tighter animate-pulse" style={{ animationDuration: '2s' }}>
                    Love to Listen
                </h1>
                <p className="text-neutral-400 mt-4 text-sm md:text-base font-medium tracking-wide">
                    Your Personal Music Sanctuary
                </p>
            </div>
            <style>{`
                @keyframes bounce-in {
                    0% { transform: scale(0.5); opacity: 0; }
                    60% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); }
                }
                .animate-bounce-in {
                    animation: bounce-in 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                }
                 @keyframes fade-out {
                    to { opacity: 0; pointer-events: none; visibility: hidden; }
                }
                .animate-fade-out {
                    animation: fade-out 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

export default SplashPage;
