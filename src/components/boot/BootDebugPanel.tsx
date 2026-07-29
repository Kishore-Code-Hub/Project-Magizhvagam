'use client';

import React, { useState, useEffect } from 'react';
import { BootController } from '@/lib/boot/BootController';
import { Terminal, RefreshCw, X } from 'lucide-react';

export function BootDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [bootState, setBootState] = useState<string>(() => BootController.getState());
  const [progress, setProgress] = useState<number>(() => BootController.getProgress());
  const [stageText, setStageText] = useState<string>(() => BootController.getStageText());

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

  useEffect(() => {
    const unsub = BootController.subscribe((s, p, st) => {
      setBootState(s);
      setProgress(p);
      setStageText(st);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const isComplete = bootState === 'COMPLETE';

  const retriggerBoot = () => {
    BootController.reset();
    BootController.start();
  };

  return (
    <div className="fixed bottom-5 right-5 z-[999999] w-[320px] p-4 rounded-xl bg-black/95 border border-emerald-500/50 shadow-[0_0_30px_rgba(0,255,102,0.3)] backdrop-blur-xl text-left font-mono text-xs text-emerald-400 select-none animate-in fade-in zoom-in-95 duration-200">
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
        <div className="flex justify-between pt-1">
          <span className="text-gray-400">Preloader Stage:</span>
          <span className="text-cyan-400 font-bold text-[10px] truncate max-w-[150px]">
            {stageText} ({progress}%)
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Boot State:</span>
          <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {isComplete ? 'COMPLETE' : bootState}
          </span>
        </div>

        <button
          onClick={retriggerBoot}
          className="w-full mt-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition-all text-[11px] cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Re-trigger Boot Sequence
        </button>
      </div>
    </div>
  );
}

export default BootDebugPanel;
