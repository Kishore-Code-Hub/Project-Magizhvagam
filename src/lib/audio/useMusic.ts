'use client';

import { useState, useEffect, useCallback } from 'react';
import { MusicManager, MusicManagerState } from './MusicManager';

export function useMusic() {
  const [musicState, setMusicState] = useState<MusicManagerState>(() => MusicManager.getState());

  useEffect(() => {
    // Initial sync
    setMusicState(MusicManager.getState());

    // Subscribe to MusicManager updates
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

  const play = useCallback(() => {
    MusicManager.play();
  }, []);

  const pause = useCallback(() => {
    MusicManager.pause();
  }, []);

  return {
    musicPath: musicState.musicPath,
    audioSrc: musicState.audioSrc,
    volume: musicState.volume,
    isMuted: musicState.isMuted,
    isPlaying: musicState.isPlaying,
    autoplayBlocked: musicState.autoplayBlocked,
    toggleMute,
    play,
    pause,
  };
}
