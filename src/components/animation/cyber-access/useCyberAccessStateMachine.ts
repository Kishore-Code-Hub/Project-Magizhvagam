'use client';

import { useState, useEffect, useCallback } from 'react';
import { BootController, BootState } from '@/lib/boot/BootController';

export function useCyberAccessStateMachine(onComplete?: () => void, onReveal?: () => void) {
  const [state, setState] = useState<BootState>(() => BootController.getState());
  const [progress, setProgress] = useState<number>(() => BootController.getProgress());
  const [stageText, setStageText] = useState<string>(() => BootController.getStageText());
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotion(true);
    }

    // Start BootController engine if not already started
    BootController.start();

    // Subscribe to state updates
    const unsubscribe = BootController.subscribe((newState, newProgress, newStageText) => {
      setState(newState);
      setProgress(newProgress);
      setStageText(newStageText);

      if (newState === 'SHUTTER' || newState === 'REVEAL') {
        onReveal?.();
      }
      if (newState === 'COMPLETE') {
        onComplete?.();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onComplete, onReveal]);

  const triggerAuthorize = useCallback(() => {
    BootController.triggerAuthorize();
  }, []);

  const skipSequence = useCallback(() => {
    BootController.skip();
  }, []);

  return {
    state,
    progress,
    stageText,
    reducedMotion,
    triggerAuthorize,
    skipSequence,
  };
}
