'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CyberAccessState } from './types';
import { AssetPreloader, PreloadProgress } from '@/lib/AssetPreloader';

export function useCyberAccessStateMachine(onComplete?: () => void) {
  // Start directly in TRACE state so TerminalPhase renders on 1st frame
  const [state, setState] = useState<CyberAccessState>('TRACE');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [stageText, setStageText] = useState<string>('INITIALIZING_SYSTEM_KERNEL');
  const [loadingDuration, setLoadingDuration] = useState<number>(5.0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isAssetReadyRef = useRef<boolean>(false);
  const isTimerReadyRef = useRef<boolean>(false);

  // Helper to mark complete
  const markComplete = useCallback(() => {
    console.log('[Phase 1 FSM] markComplete triggered');
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('soc_session_booted', 'true');
      } catch {
        // ignore
      }
    }
    setState('COMPLETE');
    onComplete?.();
  }, [onComplete]);

  // Handle immediate skip
  const skipSequence = useCallback(() => {
    console.log('[Phase 1 FSM] skipSequence invoked');
    if (timerRef.current) clearTimeout(timerRef.current);
    markComplete();
  }, [markComplete]);

  // Trigger authorization button
  const triggerAuthorize = useCallback(() => {
    console.log('[Phase 1 FSM] triggerAuthorize invoked');
    setState('AUTHORIZE');
  }, []);

  // Fetch loading duration from appearance settings
  useEffect(() => {
    fetch('/api/appearance')
      .then((res) => res.json())
      .then((data) => {
        if (data?.loadingDuration) {
          setLoadingDuration(data.loadingDuration);
        }
      })
      .catch(() => null);
  }, []);

  // Initial setup & URL check
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check prefers-reduced-motion media query for accessibility
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      console.log('[Phase 1 FSM] prefers-reduced-motion active -> skipping sequence');
      markComplete();
      return;
    }

    setIsMobile(window.innerWidth < 768);

    const urlParams = new URLSearchParams(window.location.search);
    const forceBoot = urlParams.has('boot') || urlParams.get('boot') === 'true' || urlParams.has('debug');

    if (forceBoot) {
      sessionStorage.removeItem('soc_session_booted');
    }

    const bootedInSession = sessionStorage.getItem('soc_session_booted') === 'true';

    console.log('[Phase 1 FSM] Initialized:', { bootedInSession, forceBoot });

    if (!forceBoot && bootedInSession) {
      console.log('[Phase 1 FSM] Skipping: soc_session_booted is true');
      markComplete();
    }
  }, [markComplete]);

  // Start AssetPreloader pipeline & enforce minimum boot duration
  useEffect(() => {
    if (state === 'IDLE' || state === 'COMPLETE') return;

    // 1. Trigger AssetPreloader
    AssetPreloader.preloadAll((p: PreloadProgress) => {
      setProgress(p.percent);
      setStageText(p.stage);
      if (p.percent >= 100) {
        isAssetReadyRef.current = true;
        checkCanAdvance();
      }
    });

    // 2. Minimum boot timer
    const traceMs = Math.max(1000, Math.round(loadingDuration * 1000) - 800);
    timerRef.current = setTimeout(() => {
      isTimerReadyRef.current = true;
      checkCanAdvance();
    }, traceMs);

    function checkCanAdvance() {
      if (isAssetReadyRef.current && isTimerReadyRef.current) {
        console.log('[Phase 1 FSM] Both AssetPreloader and timer ready -> AUTHORIZE');
        setState('AUTHORIZE');
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, loadingDuration]);

  // Handle AUTHORIZE state transition
  useEffect(() => {
    if (state === 'AUTHORIZE') {
      const authTimer = setTimeout(() => {
        markComplete();
      }, 800);
      return () => clearTimeout(authTimer);
    }
  }, [state, markComplete]);

  return {
    state,
    isMobile,
    progress,
    stageText,
    triggerAuthorize,
    skipSequence,
  };
}
