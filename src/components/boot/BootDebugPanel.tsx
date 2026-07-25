'use client';

import React, { useState, useEffect } from 'react';
import { useBoot } from '@/hooks/useBoot';
import { Terminal, RefreshCw, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface BootDebugPanelProps {
  gates?: {
    themeLoaded?: boolean;
    cmsLoaded?: boolean;
    tier1ImagesDecoded?: boolean;
    fontsLoaded?: boolean;
    hydrationComplete?: boolean;
    routeReady?: boolean;
    criticalImagesResolved?: boolean;
    animationFinished?: boolean;
  };
}

export function BootDebugPanel({ gates }: BootDebugPanelProps) {
  const {
    progress,
    stage,
    isComplete,
    isPreloaded,
    cmsPayload,
    loadingDuration,
    retriggerBoot,
  } = useBoot();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const checklist = [
    { label: 'Theme Tokens', ok: gates?.themeLoaded ?? true },
    { label: 'CMS Payload', ok: gates?.cmsLoaded ?? (cmsPayload !== null) },
    { label: 'Fonts & System CSS', ok: gates?.fontsLoaded ?? isPreloaded },
    { label: 'Hero Artwork', ok: gates?.tier1ImagesDecoded ?? isPreloaded },
    { label: 'About Artwork', ok: gates?.criticalImagesResolved ?? isPreloaded },
    { label: 'Hydration State', ok: gates?.hydrationComplete ?? true },
    { label: 'Route Ready', ok: gates?.routeReady ?? true },
    { label: 'Animation Sequence', ok: gates?.animationFinished ?? isComplete },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-[9999] w-[320px] p-4 rounded-xl bg-black/95 border border-emerald-500/50 shadow-[0_0_30px_rgba(0,255,102,0.3)] backdrop-blur-xl text-left font-mono text-xs text-emerald-400 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2 mb-3">
        <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px]">
          <Terminal className="w-4 h-4 text-emerald-400" /> BOOT TELEMETRY HUD
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2 text-[11px]">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
          Readiness Gate Checklist ({loadingDuration}s target)
        </div>

        <div className="space-y-1 bg-black/50 p-2.5 rounded border border-emerald-500/20">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-gray-300">{item.label}</span>
              {item.ok ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  ✓
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px]">
                  PENDING
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-1">
          <span className="text-gray-400">Preloader Stage:</span>
          <span className="text-cyan-400 font-bold text-[10px] truncate max-w-[150px]">
            {stage} ({progress}%)
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Boot State:</span>
          <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {isComplete ? 'COMPLETE (PORTFOLIO ACTIVE)' : 'BOOTING OVERLAY'}
          </span>
        </div>

        <button
          onClick={retriggerBoot}
          className="w-full mt-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition-all text-[11px]"
        >
          <RefreshCw className="w-3 h-3" /> Retrigger Full Boot Sequence
        </button>
      </div>
    </div>
  );
}

export default BootDebugPanel;
