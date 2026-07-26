'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Play, Pause, Music } from 'lucide-react';

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0 to 100
  enabled: boolean;
  trackTitle: string;
  autoplayBlocked: boolean;
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (val: number) => void;
}

const AudioContext = createContext<AudioContextType>({
  isPlaying: false,
  isMuted: false,
  volume: 50,
  enabled: true,
  trackTitle: 'Cyber Ambient',
  autoplayBlocked: false,
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
  const [trackUrl, setTrackUrl] = useState('/audio/cyber-ambient.mp3');
  const [trackTitle, setTrackTitle] = useState('Cyber Operations Ambient Soundtrack');
  const [loop, setLoop] = useState(true);
  const [volume, setVolumeState] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Fetch configured Audio CMS settings
  useEffect(() => {
    fetch('/api/admin/audio')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (typeof data.enabled === 'boolean') setEnabled(data.enabled);
          if (data.trackUrl) setTrackUrl(data.trackUrl);
          if (data.trackTitle) setTrackTitle(data.trackTitle);
          if (typeof data.loop === 'boolean') setLoop(data.loop);

          // Retrieve visitor preference from localStorage if available
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
      .catch((err) => console.error('[Audio Provider] Error fetching settings:', err));
  }, []);

  // Initialize Audio instance
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled || !trackUrl) return;

    if (!audioRef.current) {
      const audio = new Audio(trackUrl);
      audioRef.current = audio;
    } else {
      audioRef.current.src = trackUrl;
    }

    const audio = audioRef.current;
    audio.loop = loop;
    audio.volume = (volume / 100);
    audio.muted = isMuted;

    const handleEnded = () => {
      if (!loop) setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [enabled, trackUrl, loop]);

  // Sync volume & mute changes
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

  const attemptPlay = useCallback(() => {
    if (!audioRef.current || !enabled) return;

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      })
      .catch((err) => {
        console.warn('[Audio Provider] Autoplay restricted by browser policy:', err);
        setAutoplayBlocked(true);
        setIsPlaying(false);
      });
  }, [enabled]);

  // Auto-play attempt on mount if enabled
  useEffect(() => {
    if (enabled && trackUrl) {
      attemptPlay();
    }
  }, [enabled, trackUrl, attemptPlay]);

  // Global user interaction listener to resume audio if blocked
  useEffect(() => {
    if (!autoplayBlocked) return;

    const handleFirstInteraction = () => {
      attemptPlay();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [autoplayBlocked, attemptPlay]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

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
        .catch((err) => console.error('[Audio Provider] Play failed:', err));
    }
  }, [isPlaying]);

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
        trackTitle,
        autoplayBlocked,
        togglePlay,
        toggleMute,
        setVolume,
      }}
    >
      {children}

      {/* Floating Enable Audio Banner if autoplay was blocked */}
      {enabled && autoplayBlocked && !isPlaying && (
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
