'use client';

import React, { useEffect, useState } from 'react';
import { useTheme, PerformanceLevel } from '@/components/theme/ThemeProvider';
import { Cpu, ShieldCheck, Zap } from 'lucide-react';

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

        // Auto-detect & scale performance level if FPS drops below 30
        if (performanceLevel === 'auto' && currentFps < 35) {
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
    <div className="fixed bottom-4 right-4 z-40 font-mono text-[10px] select-none">
      {showWidget ? (
        <div className="glass-panel p-3 rounded-2xl border-accent/40 bg-[#040705]/95 backdrop-blur-xl space-y-2.5 text-gray-300 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between gap-4 text-accent font-bold border-b border-accent/20 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-accent" /> SOC GPU MATRIX
            </span>
            <span className="text-emerald-400 font-extrabold">{fps} FPS</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 pt-1">
            {(['auto', 'high', 'medium', 'low'] as PerformanceLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setPerformanceLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                  performanceLevel === lvl
                    ? 'bg-accent text-[#050505] shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]'
                    : 'bg-accent/10 text-gray-400 hover:text-white hover:bg-accent/20'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowWidget(false)}
            className="w-full text-center text-[8.5px] text-gray-500 hover:text-accent pt-1"
          >
            [ CLOSE GPU MONITOR ]
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowWidget(true)}
          className="px-3 py-1.5 rounded-xl glass-panel border-accent/40 text-accent/90 hover:text-accent bg-[#040705]/90 backdrop-blur-md flex items-center gap-1.5 shadow-lg hover:border-accent transition-all font-bold"
        >
          <Zap className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span>GPU SOC: {fps} FPS</span>
        </button>
      )}
    </div>
  );
}
