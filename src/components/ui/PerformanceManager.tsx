'use client';

import { useEffect } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function PerformanceManager() {
  const { performanceLevel, setPerformanceLevel } = useTheme();

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastTime));

        // Auto-detect & scale performance level if FPS drops below 35
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

  // Visible FPS HUD badge hidden per requirements. Adaptive performance engine runs silently in background.
  return null;
}

