'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CyberAccessState } from './types';
import { AssetPreloader, PreloadProgress } from '@/lib/preload/AssetPreloader';
import { BootStorage } from '@/lib/boot/BootStorage';

export function useCyberAccessStateMachine(onComplete?: () => void) {
  const [state, setState] = useState<CyberAccessState>('TRACE');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [stageText, setStageText] = useState<string>('INITIALIZING_SYSTEM_KERNEL');
  const [loadingDuration, setLoadingDuration] = useState<number>(5.0);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [phaseTimer, setPhaseTimer] = useState<number>(2.2);
  const [remainingTime, setRemainingTime] = useState<number>(5.0);
  const [isAssetsReady, setIsAssetsReady] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isAssetReadyRef = useRef<boolean>(false);
  const isTimerReadyRef = useRef<boolean>(false);

  const markComplete = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Phase 1 FSM] markComplete triggered');
    }
    BootStorage.setBooted();
    setState('COMPLETE');
    onComplete?.();
  }, [onComplete]);

  const skipSequence = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Phase 1 FSM] skipSequence invoked');
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    markComplete();
  }, [markComplete]);

  const triggerAuthorize = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Phase 1 FSM] triggerAuthorize invoked');
    }
    setState('AUTHORIZE');
  }, []);

  const [accessGrantedHoldTime, setAccessGrantedHoldTime] = useState<number>(2.0);
  const [welcomeScreenHoldTime, setWelcomeScreenHoldTime] = useState<number>(2.0);

  // Check prefers-reduced-motion: set visual flag ONLY, do NOT skip sequence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log('[Phase 1 FSM] prefers-reduced-motion active -> Disabling heavy visual effects');
        setReducedMotion(true);
      }
    }
  }, []);

  // Fetch appearance settings for loadingDuration and returning visitor skip policy
  useEffect(() => {
    if (typeof window === 'undefined') return;

    startTimeRef.current = Date.now();

    const urlParams = new URLSearchParams(window.location.search);
    const forceBoot = urlParams.has('boot') || urlParams.get('boot') === 'true' || urlParams.has('debug');

    if (forceBoot) {
      BootStorage.clearBoot();
    }

    fetch('/api/appearance')
      .then((res) => res.json())
      .then((data) => {
        const duration = parseFloat(data?.loadingDuration) || 5.0;
        setLoadingDuration(duration);

        const holdTime = parseFloat(data?.accessGrantedHoldTime) || 2.0;
        setAccessGrantedHoldTime(holdTime);

        const welcomeHoldTime = parseFloat(data?.welcomeScreenHoldTime) || 2.0;
        setWelcomeScreenHoldTime(welcomeHoldTime);

        const skipReturning = Boolean(data?.skipLoaderForReturning);
        const bootedInSession = BootStorage.isBooted();

        console.log('[Phase 1 FSM] Initialized:', { bootedInSession, forceBoot, skipReturning, duration, holdTime, welcomeHoldTime });

        // ONLY skip if returning visitor skip policy is explicitly enabled in admin config
        if (!forceBoot && bootedInSession && skipReturning) {
          console.log('[Phase 1 FSM] Skipping: soc_session_booted is true and skipLoaderForReturning is enabled');
          markComplete();
        }
      })
      .catch(() => {
        const bootedInSession = BootStorage.isBooted();
        if (!forceBoot && bootedInSession) {
          markComplete();
        }
      });
  }, [markComplete]);

  // Telemetry tick interval (local high-frequency state)
  useEffect(() => {
    if (state === 'COMPLETE') return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);
      setRemainingTime(Math.max(0, loadingDuration - elapsed));
    }, 100);

    return () => clearInterval(interval);
  }, [state, loadingDuration]);

  // Scale phase timing proportionally according to loadingDuration (1s - 15s)
  const getPhaseDuration = useCallback(
    (ratio: number, minSec = 0.3): number => {
      return Math.max(minSec * 1000, Math.round(loadingDuration * 1000 * ratio));
    },
    [loadingDuration]
  );

  // Drive 6-phase cinematic sequence scaled to loadingDuration
  useEffect(() => {
    if (state === 'IDLE' || state === 'COMPLETE') return;

    // Phase 1: TRACE (45% of loadingDuration, min 1.5s gate)
    if (state === 'TRACE') {
      const traceDuration = getPhaseDuration(0.45, 1.5);
      setPhaseTimer(traceDuration / 1000);

      const traceTimer = setTimeout(() => {
        isTimerReadyRef.current = true;
        checkCanAdvance();
      }, traceDuration);

      AssetPreloader.preloadTier1((p: PreloadProgress) => {
        setProgress(p.percent);
        setStageText(p.stage);
        if (p.cmsPayload?.loadingDuration) {
          setLoadingDuration(p.cmsPayload.loadingDuration);
        }
        if (p.percent >= 100) {
          isAssetReadyRef.current = true;
          setIsAssetsReady(true);
          checkCanAdvance();
        }
      }).catch(() => {
        isAssetReadyRef.current = true;
        setIsAssetsReady(true);
        checkCanAdvance();
      });

      function checkCanAdvance() {
        if (isAssetReadyRef.current && isTimerReadyRef.current) {
          console.log('[Phase 1 FSM] Assets 100% and TRACE complete -> AUTHORIZE');
          setState('AUTHORIZE');
        }
      }

      return () => clearTimeout(traceTimer);
    }

    // Phase 2: AUTHORIZE (15% of loadingDuration)
    if (state === 'AUTHORIZE') {
      const dur = getPhaseDuration(0.15, 0.4);
      setPhaseTimer(dur / 1000);
      const timer = setTimeout(() => {
        console.log('[Phase 1 FSM] AUTHORIZE complete -> DISSOLVE');
        setState('DISSOLVE');
      }, dur);
      return () => clearTimeout(timer);
    }

    // Phase 3, 4, 5: Access Granted Hold sequence scaled by accessGrantedHoldTime
    const holdStepMs = Math.max(200, Math.round((accessGrantedHoldTime * 1000) / 3));

    // Phase 3: DISSOLVE
    if (state === 'DISSOLVE') {
      setPhaseTimer(holdStepMs / 1000);
      const timer = setTimeout(() => {
        console.log('[Phase 1 FSM] DISSOLVE complete -> BEAM');
        setState('BEAM');
      }, holdStepMs);
      return () => clearTimeout(timer);
    }

    // Phase 4: BEAM
    if (state === 'BEAM') {
      setPhaseTimer(holdStepMs / 1000);
      const timer = setTimeout(() => {
        console.log('[Phase 1 FSM] BEAM complete -> RING');
        setState('RING');
      }, holdStepMs);
      return () => clearTimeout(timer);
    }

    // Phase 5: RING
    if (state === 'RING') {
      setPhaseTimer(holdStepMs / 1000);
      const timer = setTimeout(() => {
        console.log('[Phase 1 FSM] RING complete -> SHUTTER');
        setState('SHUTTER');
      }, holdStepMs);
      return () => clearTimeout(timer);
    }

    // Phase 6: SHUTTER (Holds Welcome Screen for configured welcomeScreenHoldTime)
    if (state === 'SHUTTER') {
      const welcomeHoldMs = Math.max(500, Math.round(welcomeScreenHoldTime * 1000));
      setPhaseTimer(welcomeHoldMs / 1000);
      const timer = setTimeout(() => {
        console.log(`[Phase 1 FSM] Welcome Screen Held for ${welcomeScreenHoldTime}s -> REVEAL (Slide Open)`);
        setState('REVEAL');
      }, welcomeHoldMs);
      return () => clearTimeout(timer);
    }

    // Phase 7: REVEAL (450ms shutter slide-open animation) -> COMPLETE
    if (state === 'REVEAL') {
      const revealDurMs = 450;
      setPhaseTimer(0.45);
      const timer = setTimeout(() => {
        console.log('[Phase 1 FSM] Shutter Reveal complete -> COMPLETE');
        markComplete();
      }, revealDurMs);
      return () => clearTimeout(timer);
    }
  }, [state, getPhaseDuration, markComplete, welcomeScreenHoldTime]);

  return {
    state,
    isMobile,
    progress,
    stageText,
    elapsedTime,
    phaseTimer,
    remainingTime,
    loadingDuration,
    reducedMotion,
    isAssetsReady,
    triggerAuthorize,
    skipSequence,
  };
}
