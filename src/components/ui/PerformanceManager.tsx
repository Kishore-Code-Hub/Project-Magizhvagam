'use client';

import React, { useEffect, useState } from 'react';
import { useTheme, PerformanceLevel } from '@/components/theme/ThemeProvider';
import { Cpu } from 'lucide-react';

export default function PerformanceManager() {
  const { performanceLevel, setPerformanceLevel } = useTheme();
  const [fps, setFps] = useState(60);
  const [showWidget, setShowWidget] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastTime));
        setFps(currentFps);

        // Auto-scale performance level if frame rate drops below 30
        if (performanceLevel === 'auto' && currentFps < 30) {
          setPerformanceLevel('low');
        }

        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, [performanceLevel, setPerformanceLevel]);

  return (
    <div className="fixed bottom-4 right-4 z-40 font-mono text-[10px]">
      {showWidget ? (
        <div className="glass-panel p-2.5 rounded-xl border-accent/40 bg-[#050505]/90 backdrop-blur-xl space-y-2 text-gray-300 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between gap-3 text-accent font-bold border-b border-accent/20 pb-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-accent" /> GPU SOC MATRIX
            </span>
            <span>{fps} FPS</span>
          </div>

          <div className="flex items-center gap-1 pt-1">
            {(['auto', 'high', 'medium', 'low'] as PerformanceLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setPerformanceLevel(lvl)}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                  performanceLevel === lvl
                    ? 'bg-accent text-[#050505]'
                    : 'bg-accent/10 text-gray-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowWidget(false)}
            className="w-full text-center text-[8px] text-gray-500 hover:text-accent pt-0.5"
          >
            [ HIDE SYSTEM HUD ]
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowWidget(true)}
          className="px-2.5 py-1.5 rounded-lg glass-panel border-accent/30 text-accent/80 hover:text-accent bg-[#050505]/80 backdrop-blur-md flex items-center gap-1.5 shadow-md hover:border-accent transition-all"
        >
          <Cpu className="w-3 h-3 text-accent" />
          <span>SOC GPU: {fps} FPS</span>
        </button>
      )}
    </div>
  );
}
