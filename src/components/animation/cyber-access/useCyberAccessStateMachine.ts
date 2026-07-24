'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CyberAccessState } from './types';

const MAX_SAFETY_TIMEOUT_MS = 10000;

export function useCyberAccessStateMachine(onComplete?: () => void) {
  const [state, setState] = useState<CyberAccessState>('TRACE');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to mark complete
  const markComplete = useCallback(() => {
    console.log('[useCyberAccessStateMachine] markComplete() triggered -> Writing sessionStorage.soc_session_booted = true');
    if (typeof window !== 'undefined') {
      try {
        // Line where soc_session_booted is WRITTEN:
        sessionStorage.setItem('soc_session_booted', 'true');
      } catch (err) {
        console.warn('[useCyberAccessStateMachine] Failed to set sessionStorage:', err);
      }
    }
    setState('COMPLETE');
    onComplete?.();
  }, [onComplete]);

  // Handle immediate skip
  const skipSequence = useCallback(() => {
    console.log('[useCyberAccessStateMachine] skipSequence() invoked by user');
    if (timerRef.current) clearTimeout(timerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    markComplete();
  }, [markComplete]);

  // Log every state transition for verification
  useEffect(() => {
    console.log(`[useCyberAccessStateMachine] FSM State Changed: ${state}`);
  }, [state]);

  // Initial setup check
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobileDevice = window.innerWidth < 768;
    setIsMobile(isMobileDevice);

    const urlParams = new URLSearchParams(window.location.search);
    const forceBootParam = urlParams.get('boot') === 'true';
    
    // Line where soc_session_booted is READ:
    const bootedInSession = sessionStorage.getItem('soc_session_booted') === 'true';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setReducedMotion(prefersReducedMotion);

    console.log('[useCyberAccessStateMachine] Mount Audit:', {
      fsmState: state,
      'sessionStorage.soc_session_booted': bootedInSession,
      prefersReducedMotion: prefersReducedMotion,
      forceBootParam: forceBootParam,
      isMobile: isMobileDevice,
    });

    // Check early exit conditions if forceBootParam is not set
    // TEMPORARILY DISABLED FOR PHASE 2 LIFECYCLE AUDIT:
    console.log('[useCyberAccessStateMachine] Phase 2 Audit: Session persistence & reduced motion early returns are TEMPORARILY DISABLED');
    /*
    if (!forceBootParam) {
      if (bootedInSession) {
        console.log('[useCyberAccessStateMachine] EARLY RETURN CONDITION: sessionStorage.soc_session_booted is true. Skipping boot sequence.');
        markComplete();
        return;
      }
      if (prefersReducedMotion) {
        console.log('[useCyberAccessStateMachine] EARLY RETURN CONDITION: prefersReducedMotion is true. Skipping boot sequence.');
        markComplete();
        return;
      }
    }
    */

    // Safety fallback timer
    safetyTimerRef.current = setTimeout(() => {
      console.log('[useCyberAccessStateMachine] MAX_SAFETY_TIMEOUT_MS reached (10s), triggering markComplete()');
      markComplete();
    }, MAX_SAFETY_TIMEOUT_MS);

    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [markComplete]);

  // Trigger authorization (user click or auto-advance)
  const triggerAuthorize = useCallback(() => {
    console.log('[useCyberAccessStateMachine] triggerAuthorize called');
    setState((curr) => {
      if (curr === 'TRACE' || curr === 'AUTHORIZE') {
        return 'AUTHORIZE';
      }
      return curr;
    });
  }, []);

  // FSM transitions driven deterministically by state updates
  useEffect(() => {
    if (state === 'IDLE' || state === 'COMPLETE') return;

    if (timerRef.current) clearTimeout(timerRef.current);

    switch (state) {
      case 'TRACE':
        timerRef.current = setTimeout(() => {
          setState('AUTHORIZE');
        }, 1200);
        break;

      case 'AUTHORIZE':
        timerRef.current = setTimeout(() => {
          setState('DISSOLVE');
        }, 200);
        break;

      case 'DISSOLVE':
        timerRef.current = setTimeout(() => {
          setState('BEAM');
        }, 250);
        break;

      case 'BEAM':
        timerRef.current = setTimeout(() => {
          setState('RING');
        }, 400);
        break;

      case 'RING':
        timerRef.current = setTimeout(() => {
          setState('RELEASE');
        }, 500);
        break;

      case 'RELEASE':
        timerRef.current = setTimeout(() => {
          setState('SHUTTER');
        }, 300);
        break;

      case 'SHUTTER':
        timerRef.current = setTimeout(() => {
          setState('REVEAL');
        }, 600);
        break;

      case 'REVEAL':
        timerRef.current = setTimeout(() => {
          markComplete();
        }, 800);
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
    reducedMotion,
    triggerAuthorize,
    skipSequence,
  };
}

