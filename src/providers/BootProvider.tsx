'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BootContext } from '@/contexts/BootContext';
import { AssetPreloader } from '@/lib/preload/AssetPreloader';
import { CMSInitialPayload } from '@/lib/preload/ThemeLoader';
import FallbackBoundary from '@/components/animation/cyber-access/FallbackBoundary';
import CyberAccessSequence from '@/components/animation/cyber-access/CyberAccessSequence';
import { BootDebugPanel } from '@/components/boot/BootDebugPanel';
import { DevDebugHud } from '@/components/debug/DevDebugHud';
import { BootStorage } from '@/lib/boot/BootStorage';

export function BootProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<string>('INITIALIZING_SYSTEM_KERNEL');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isPreloaded, setIsPreloaded] = useState<boolean>(false);
  const [cmsPayload, setCmsPayload] = useState<CMSInitialPayload | null>(null);
  const [loadingDuration, setLoadingDuration] = useState<number>(5.0);

  // 8 Readiness Gates
  const gatesRef = useRef({
    themeLoaded: false,
    cmsLoaded: false,
    tier1ImagesDecoded: false,
    fontsLoaded: false,
    hydrationComplete: false,
    routeReady: false,
    criticalImagesResolved: false,
    animationFinished: false,
  });

  const [gateStatus, setGateStatus] = useState(gatesRef.current);

  const updateGate = useCallback((key: keyof typeof gatesRef.current, val: boolean) => {
    gatesRef.current[key] = val;
    setGateStatus({ ...gatesRef.current });
  }, []);

  const finishBoot = useCallback(() => {
    console.log('[Boot Engine] finishBoot invoked');
    console.log('[Boot Engine] Boot Complete Reason:', {
      '✓ Theme': gatesRef.current.themeLoaded,
      '✓ CMS': gatesRef.current.cmsLoaded,
      '✓ Images': gatesRef.current.tier1ImagesDecoded,
      '✓ Fonts': gatesRef.current.fontsLoaded,
      '✓ Hydration': gatesRef.current.hydrationComplete,
      '✓ Route': gatesRef.current.routeReady,
      '✓ CriticalMedia': gatesRef.current.criticalImagesResolved,
      '✓ Animation': gatesRef.current.animationFinished,
    });

    BootStorage.setBooted();
    setIsComplete(true);
    if (typeof document !== 'undefined') {
      document.body.classList.remove('booting');
      document.body.classList.add('booted');
    }
  }, []);

  const skipBoot = useCallback(() => {
    console.log('[Boot Engine] Manual Skip Requested');
    finishBoot();
  }, [finishBoot]);

  const retriggerBoot = useCallback(() => {
    console.log('[Boot Engine] Retrigger Boot Requested');
    BootStorage.clearBoot();
    setIsComplete(false);
    setIsPreloaded(false);
  }, []);

  // 15-Second Boot Watchdog Safety Net
  useEffect(() => {
    if (isComplete) return;

    const watchdog = setTimeout(() => {
      console.warn('[Boot Engine Watchdog] 15-second timeout reached! Unstucking application...');
      updateGate('themeLoaded', true);
      updateGate('cmsLoaded', true);
      updateGate('tier1ImagesDecoded', true);
      updateGate('fontsLoaded', true);
      updateGate('hydrationComplete', true);
      updateGate('routeReady', true);
      updateGate('criticalImagesResolved', true);
      updateGate('animationFinished', true);
      finishBoot();
    }, 15000);

    return () => clearTimeout(watchdog);
  }, [isComplete, finishBoot, updateGate]);

  // Main Boot Preload Initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (document.readyState === 'complete') {
      updateGate('hydrationComplete', true);
    } else {
      const handleLoad = () => updateGate('hydrationComplete', true);
      window.addEventListener('load', handleLoad);
    }

    updateGate('routeReady', true);

    const urlParams = new URLSearchParams(window.location.search);
    const forceBoot = urlParams.has('boot') || urlParams.get('boot') === 'true' || urlParams.has('debug');

    if (forceBoot) {
      BootStorage.clearBoot();
    }

    fetch('/api/appearance')
      .then((res) => res.json())
      .then((data) => {
        if (data?.loadingDuration) setLoadingDuration(data.loadingDuration);
        updateGate('themeLoaded', true);

        const skipReturning = Boolean(data?.skipLoaderForReturning);
        if (!forceBoot && BootStorage.isBooted() && skipReturning) {
          finishBoot();
        }
      })
      .catch(() => updateGate('themeLoaded', true));

    // Preload Tier 1 Critical Assets
    AssetPreloader.preloadTier1((p) => {
      setProgress(p.percent);
      setStage(p.stage);
      if (p.cmsPayload) {
        setCmsPayload(p.cmsPayload);
        updateGate('cmsLoaded', true);
        if (p.cmsPayload.loadingDuration) {
          setLoadingDuration(p.cmsPayload.loadingDuration);
        }
      }
    })
      .then((payload) => {
        setIsPreloaded(true);
        updateGate('tier1ImagesDecoded', true);
        updateGate('fontsLoaded', true);
        updateGate('criticalImagesResolved', true);
      })
      .catch((err) => {
        console.warn('[Boot Engine] Asset preloader error fallback:', err);
        setIsPreloaded(true);
        updateGate('tier1ImagesDecoded', true);
        updateGate('fontsLoaded', true);
        updateGate('criticalImagesResolved', true);
      });
  }, [finishBoot, updateGate]);

  const handleAnimationComplete = useCallback(() => {
    updateGate('animationFinished', true);
    finishBoot();
  }, [finishBoot, updateGate]);

  return (
    <BootContext.Provider
      value={{
        progress,
        stage,
        isComplete,
        isPreloaded,
        cmsPayload,
        loadingDuration,
        skipBoot,
        retriggerBoot,
      }}
    >
      <FallbackBoundary onFallback={skipBoot}>
        {!isComplete && (
          <CyberAccessSequence onComplete={handleAnimationComplete} />
        )}
        <div style={{ visibility: isComplete ? 'visible' : 'hidden' }}>
          {children}
        </div>
        <BootDebugPanel gates={gateStatus} />
        <DevDebugHud />
      </FallbackBoundary>
    </BootContext.Provider>
  );
}
