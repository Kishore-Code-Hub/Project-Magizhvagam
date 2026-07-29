'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { MusicManager } from '@/lib/audio/MusicManager';
import { MUSIC_PATH } from '@/lib/audio/constants';

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  enabled: boolean;
  trackTitle: string;
  trackUrl: string;
  isAvailable: boolean;
  toggleMute: () => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  setVolume: (val: number) => void;
  refreshAudioSettings: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType>({
  isPlaying: false,
  isMuted: false,
  volume: 0.25,
  enabled: true,
  trackTitle: 'Cyber Ambient Operations',
  trackUrl: MUSIC_PATH,
  isAvailable: true,
  toggleMute: () => {},
  togglePlay: () => {},
  play: () => {},
  pause: () => {},
  setVolume: () => {},
  refreshAudioSettings: async () => {},
});

export const useAudio = () => useContext(AudioContext);

interface AudioProviderProps {
  children: React.ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [musicState, setMusicState] = useState(() => MusicManager.getState());

  useEffect(() => {
    // Single source of truth initialization
    MusicManager.init();

    const unsubscribe = MusicManager.subscribe(() => {
      setMusicState(MusicManager.getState());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleMute = useCallback(() => {
    MusicManager.toggleMute();
  }, []);

  const togglePlay = useCallback(() => {
    if (musicState.isPlaying) {
      MusicManager.pause();
    } else {
      MusicManager.play();
    }
  }, [musicState.isPlaying]);

  const play = useCallback(() => {
    MusicManager.play();
  }, []);

  const pause = useCallback(() => {
    MusicManager.pause();
  }, []);

  const setVolume = useCallback((val: number) => {
    // Convert 0-100 scale to 0-1 scale
    const target = val > 1 ? val / 100 : val;
    MusicManager.init();
  }, []);

  const refreshAudioSettings = useCallback(async () => {
    MusicManager.init();
  }, []);

  return (
    <AudioContext.Provider
      value={{
        isPlaying: musicState.isPlaying,
        isMuted: musicState.isMuted,
        volume: musicState.volume,
        enabled: true,
        trackTitle: 'Cyber Ambient Operations',
        trackUrl: MUSIC_PATH,
        isAvailable: true,
        toggleMute,
        togglePlay,
        play,
        pause,
        setVolume,
        refreshAudioSettings,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
