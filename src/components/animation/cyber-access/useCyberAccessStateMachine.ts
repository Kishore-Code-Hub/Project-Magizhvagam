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

  // FSM Step Transitions (Phase 1: TRACE -> AUTHORIZE -> COMPLETE)
  useEffect(() => {
    if (state === 'IDLE' || state === 'COMPLETE') return;

    if (timerRef.current) clearTimeout(timerRef.current);

    switch (state) {
      case 'TRACE':
        // Auto-advance to AUTHORIZE after 2000ms if user doesn't click
        timerRef.current = setTimeout(() => {
          console.log('[Phase 1 FSM] TRACE timeout reached -> AUTHORIZE');
          setState('AUTHORIZE');
        }, 2000);
        break;

      case 'AUTHORIZE':
        // Pause 1000ms before finishing Phase 1
        timerRef.current = setTimeout(() => {
          console.log('[Phase 1 FSM] AUTHORIZE completed -> markComplete');
          markComplete();
        }, 1000);
        break;

      default:
        break;
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, markComplete]);

  return {
    state,
    isMobile,
    triggerAuthorize,
    skipSequence,
  };
}
