'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CyberAccessState } from './types';

export function useCyberAccessStateMachine(onComplete?: () => void) {
  // Start directly in TRACE state so TerminalPhase renders on 1st frame
  const [state, setState] = useState<CyberAccessState>('TRACE');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Log state changes
  useEffect(() => {
    console.log(`[Phase 1 FSM] Current State: ${state}`);
  }, [state]);

  const [loadingDuration, setLoadingDuration] = useState<number>(5.0);

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

  // FSM Step Transitions (TRACE -> AUTHORIZE -> COMPLETE)
  useEffect(() => {
    if (state === 'IDLE' || state === 'COMPLETE') return;

    if (timerRef.current) clearTimeout(timerRef.current);

    // Calculate trace duration in ms from configured loadingDuration (default 5s = 4200ms trace + 800ms auth)
    const traceMs = Math.max(1000, Math.round(loadingDuration * 1000) - 800);

    switch (state) {
      case 'TRACE':
        timerRef.current = setTimeout(() => {
          console.log(`[Phase 1 FSM] TRACE timeout (${traceMs}ms) reached -> AUTHORIZE`);
          setState('AUTHORIZE');
        }, traceMs);
        break;

      case 'AUTHORIZE':
        timerRef.current = setTimeout(() => {
          console.log('[Phase 1 FSM] AUTHORIZE completed -> markComplete');
          markComplete();
        }, 800);
        break;

      default:
        break;
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, markComplete, loadingDuration]);

  return {
    state,
    isMobile,
    triggerAuthorize,
    skipSequence,
  };
}
