import React, { useState, useEffect, useRef } from 'react';
import Experience from './components/Experience';
import HandController from './components/HandController';
import { useStore } from './store';

// UPDATED: Use direct raw.githubusercontent.com link to avoid redirect issues.
const AUDIO_URL = "https://raw.githubusercontent.com/zyyyy0307-star/christmas-music/main/bgm.mp3";

const PhotoOverlay = () => {
  const focusedPhotoUrl = useStore((state) => state.focusedPhotoUrl);
  const setFocusedPhotoId = useStore((state) => state.setFocusedPhotoId);
  const setFocusedPhotoUrl = useStore((state) => state.setFocusedPhotoUrl);
  
  const isFinalePending = useStore((state) => state.isFinalePending);
  const triggerFinale = useStore((state) => state.triggerFinale);

  if (!focusedPhotoUrl) return null;

  const handleClose = () => {
    setFocusedPhotoId(null);
    setFocusedPhotoUrl(null);
    
    // Trigger Finale ONLY when closing the photo, if pending
    if (isFinalePending) {
        triggerFinale();
    }
  };

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md transition-opacity duration-700"
      onClick={handleClose}
    >
      <div 
        className="glass-panel relative p-1 transform scale-100 transition-transform duration-500"
        style={{ 
          maxWidth: '90vw', 
          maxHeight: '85vh', 
          aspectRatio: '3/4',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full overflow-hidden border border-white/5">
          <img 
            src={focusedPhotoUrl} 
            alt="Memory" 
            className="w-full h-full object-cover block filter brightness-90"
          />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 text-center bg-gradient-to-t from-black/90 to-transparent">
            <h2 className="title-display text-xl mb-2">Memory</h2>
            <div className="w-8 h-px bg-yellow-600/50 mx-auto" />
          </div>
        </div>

        <button 
          onClick={handleClose}
          className="absolute -top-12 right-0 text-white/30 hover:text-white transition-colors p-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

const UIOverlay = ({ isMuted, toggleMute }: { isMuted: boolean, toggleMute: () => void }) => {
  const isTracking = useStore((state) => state.isTracking);
  const expansion = useStore((state) => state.expansion);
  const focusedPhotoId = useStore((state) => state.focusedPhotoId);

  if (focusedPhotoId) return null;

  const statusText = isTracking 
    ? (expansion > 0.7 ? 'HAND OPEN - REVEALED' : 'HAND DETECTED') 
    : 'SEARCHING...';

  return (
    <div className="ui-layer">
      {/* Top Bar */}
      <div className="flex justify-between items-start w-full">
        {/* Brand / Title - Top Left */}
        <div className="flex flex-col">
          <h1 className="title-display text-3xl md:text-5xl">Elena 2025</h1>
          <span className="subtitle mt-2">Christmas Tree</span>
        </div>

        {/* Right Side: Status + Audio */}
        <div className="flex flex-col items-end gap-4">
            {/* Status Indicator */}
            <div className={`status-indicator ${isTracking ? 'active' : ''}`}>
              <div className={`status-dot ${isTracking ? 'active' : ''}`} />
              <span className={`status-text ${isTracking ? 'active' : ''}`}>
                  {statusText}
              </span>
            </div>

            {/* Audio Toggle */}
            <button 
                onClick={toggleMute}
                className="pointer-events-auto p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#D4AF37]/50 transition-all text-[#D4AF37]"
                aria-label={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                        <path d="M19.07 4.93L19.07 4.93C20.9763 6.83654 22.0468 9.42111 22.0468 12.1166C22.0468 14.8122 20.9763 17.3967 19.07 19.3033" />
                        <path d="M15.54 8.46L15.54 8.46C16.509 9.42921 17.0532 10.7438 17.0532 12.1143C17.0532 13.4848 16.509 14.7994 15.54 15.7686" />
                    </svg>
                )}
            </button>
        </div>
      </div>

      {/* Footer / Credits - Bottom Center */}
      <div className="w-full flex justify-center pb-4 opacity-50">
         <p className="subtitle text-[10px]">Open Hand to Reveal &middot; Mouse Click to Select</p>
      </div>
    </div>
  );
};

const FinaleOverlay = () => {
    return (
        <div 
            // Changed transition-opacity duration from 1000 to 3000ms
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none transition-opacity duration-[3000ms] ease-in-out opacity-100"
        >
            <h1 className="golden-glow text-5xl md:text-7xl mb-4 text-center">Merry Christmas</h1>
            <h2 className="golden-glow text-3xl md:text-5xl text-center">Happy 2026</h2>
        </div>
    );
};

const App: React.FC = () => {
  const focusedPhotoId = useStore((state) => state.focusedPhotoId);
  const isFinale = useStore((state) => state.isFinale);
  // Removed hasStarted state as we are now auto-starting
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Audio
    if (!audioRef.current) {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.src = AUDIO_URL;
        audio.loop = true;
        audio.volume = 0.5;
        audioRef.current = audio;
    }

    const playAudio = () => {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(error => {
                console.log("Auto-play prevented, waiting for user interaction.");
            });
        }
    };

    // 1. Attempt immediate play on load
    playAudio();

    // 2. Add global listener as fallback for browsers blocking autoplay
    // The first time the user clicks or taps anywhere, music will start.
    const handleInteraction = () => {
        playAudio();
        // Remove listeners once triggered
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
    }
  }, []);

  const toggleMute = () => {
      if (audioRef.current) {
          const newState = !isMuted;
          audioRef.current.muted = newState;
          setIsMuted(newState);
      }
  };

  return (
    <div className="relative w-full h-screen bg-[#030303] overflow-hidden">
      
      {/* StartScreen removed for auto-start */}

      <HandController />
      
      {/* Show Standard UI if NOT in Finale */}
      {!isFinale && <UIOverlay isMuted={isMuted} toggleMute={toggleMute} />}
      
      {/* Show Finale Overlay if triggered */}
      {isFinale && <FinaleOverlay />}
      
      <PhotoOverlay />
      
      <div 
        className={`w-full h-full transition-all duration-1000 ease-in-out ${focusedPhotoId ? 'opacity-20 blur-xl scale-105' : 'opacity-100 blur-0 scale-100'}`}
      >
        <Experience />
      </div>
    </div>
  );
};

export default App;