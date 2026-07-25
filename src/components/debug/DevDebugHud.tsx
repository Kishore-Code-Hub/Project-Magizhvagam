'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBoot } from '@/hooks/useBoot';
import { BootStorage } from '@/lib/boot/BootStorage';
import { Bug, X, Activity, Cpu, Shield, Eye } from 'lucide-react';

export function DevDebugHud() {
  const { isComplete, isPreloaded, loadingDuration } = useBoot();
  const [isOpen, setIsOpen] = useState(false);
  const [fps, setFps] = useState<number>(60);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [sessionState, setSessionState] = useState<boolean>(false);
  const [route, setRoute] = useState<string>('/');

  const frameCount = useRef<number>(0);
  const lastTime = useRef<number>(performance.now());

  // Listen for Ctrl+Shift+D keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update real-time state metrics when open
  useEffect(() => {
    if (!isOpen) return;

    setSessionState(BootStorage.isBooted());
    setRoute(window.location.pathname + window.location.search);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotion(true);
    }

    let animId: number;
    const calcFps = () => {
      frameCount.current++;
      const now = performance.now();
      if (now - lastTime.current >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / (now - lastTime.current)));
        frameCount.current = 0;
        lastTime.current = now;
      }
      animId = requestAnimationFrame(calcFps);
    };

    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-5 left-5 z-[9999] w-[340px] p-4 rounded-xl bg-black/95 border border-cyan-500/50 shadow-[0_0_30px_rgba(0,240,255,0.3)] backdrop-blur-xl text-left font-mono text-xs text-cyan-400 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-3">
        <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px]">
          <Bug className="w-4 h-4 text-cyan-400" /> DEV DEBUG HUD (CTRL+SHIFT+D)
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2 text-[11px]">
        <div className="flex justify-between">
          <span className="text-gray-400">FPS / Render Speed:</span>
          <span className={fps >= 50 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {fps} FPS
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Current Route:</span>
          <span className="text-white font-bold truncate max-w-[170px]">{route}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Boot State:</span>
          <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {isComplete ? 'PORTFOLIO ACTIVE' : 'BOOT OVERLAY RUNNING'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Preload Status:</span>
          <span className={isPreloaded ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {isPreloaded ? 'DECODED (100%)' : 'PRELOADING'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Loader Duration:</span>
          <span className="text-purple-400 font-bold">{loadingDuration}s (Admin Slider)</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Session Storage State:</span>
          <span className={sessionState ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
            {sessionState ? 'soc_session_booted = true' : 'CLEARED / FRESH'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Reduced Motion:</span>
          <span className={reducedMotion ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
            {reducedMotion ? 'ACTIVE (VISUALS DOWNSCALED)' : 'STANDARD MOTION'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default DevDebugHud;
