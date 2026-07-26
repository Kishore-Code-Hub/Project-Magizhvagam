'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Music } from 'lucide-react';

const STATIC_AUDIO_URL = '/uploads/music/webmusic.mp3';

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0 to 100
  enabled: boolean;
  trackTitle: string;
  autoplayBlocked: boolean;
  isAvailable: boolean;
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (val: number) => void;
}

const AudioContext = createContext<AudioContextType>({
  isPlaying: false,
  isMuted: false,
  volume: 50,
  enabled: true,
  trackTitle: 'Cyber Ambient Soundtrack',
  autoplayBlocked: false,
  isAvailable: true,
  togglePlay: () => {},
  toggleMute: () => {},
  setVolume: () => {},
});

export const useAudio = () => useContext(AudioContext);

interface AudioProviderProps {
  children: React.ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [volume, setVolumeState] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // 1. Fetch saved preferences on mount (API & localStorage)
  useEffect(() => {
    fetch('/api/admin/audio')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (typeof data.enabled === 'boolean') setEnabled(data.enabled);

          if (typeof window !== 'undefined') {
            try {
              const saved = localStorage.getItem('portfolio_audio_state');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (typeof parsed.volume === 'number') setVolumeState(parsed.volume);
                if (typeof parsed.isMuted === 'boolean') setIsMuted(parsed.isMuted);
              } else {
                if (typeof data.volume === 'number') setVolumeState(data.volume);
                if (typeof data.defaultMute === 'boolean') setIsMuted(data.defaultMute);
              }
            } catch {
              if (typeof data.volume === 'number') setVolumeState(data.volume);
              if (typeof data.defaultMute === 'boolean') setIsMuted(data.defaultMute);
            }
          }
        }
      })
      .catch(() => {
        // Silent catch for network/offline resilience
      });
  }, []);

  // 2. Single HTML5 Audio Instance Initialization (MOUNT ONLY)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      const audio = new Audio(STATIC_AUDIO_URL);
      audio.preload = 'auto';
      audio.loop = true;
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    audio.loop = true;
    audio.preload = 'auto';

    // Silent error handler if webmusic.mp3 is missing or unplayable
    const handleError = () => {
      setIsAvailable(false);
      setIsPlaying(false);
    };

    // Backup seamless infinite loop handler if browser native loop stalls
    const handleEnded = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // 3. Sync Volume & Mute properties WITHOUT reloading track or changing .src
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = isMuted;
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'portfolio_audio_state',
          JSON.stringify({ volume, isMuted, isPlaying })
        );
      } catch {}
    }
  }, [volume, isMuted, isPlaying]);

  // 4. Playback attempt runner
  const attemptPlay = useCallback(() => {
    if (!audioRef.current || !enabled || !isAvailable) return;

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      })
      .catch(() => {
        setAutoplayBlocked(true);
        setIsPlaying(false);
      });
  }, [enabled, isAvailable]);

  // Initial playback attempt when enabled and available
  useEffect(() => {
    if (enabled && isAvailable) {
      attemptPlay();
    }
  }, [enabled, isAvailable, attemptPlay]);

  // 5. Global user interaction listener to unlock autoplay on first click/touch/keydown
  useEffect(() => {
    if (!autoplayBlocked || !enabled || !isAvailable) return;

    const handleFirstInteraction = () => {
      attemptPlay();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [autoplayBlocked, enabled, isAvailable, attemptPlay]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !isAvailable) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, [isPlaying, isAvailable]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const setVolume = useCallback((val: number) => {
    setVolumeState(Math.min(Math.max(val, 0), 100));
  }, []);

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        isMuted,
        volume,
        enabled,
        trackTitle: 'Cyber Ambient Soundtrack (webmusic.mp3)',
        autoplayBlocked,
        isAvailable,
        togglePlay,
        toggleMute,
        setVolume,
      }}
    >
      {children}

      {/* Floating Enable Audio Banner if autoplay was blocked by browser */}
      {enabled && isAvailable && autoplayBlocked && !isPlaying && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#00ff66]/15 hover:bg-[#00ff66]/30 border border-[#00ff66]/50 text-[#00ff66] text-xs font-mono font-bold tracking-wider uppercase backdrop-blur-xl shadow-[0_0_25px_rgba(0,255,102,0.3)] transition-all cursor-pointer active:scale-95"
          >
            <Music className="w-4 h-4 animate-pulse text-cyan-400" />
            <span>ENABLE CYBER SOUNDTRACK</span>
          </button>
        </div>
      )}
    </AudioContext.Provider>
  );
}
