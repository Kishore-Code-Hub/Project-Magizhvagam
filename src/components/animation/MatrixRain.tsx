'use client';

import React, { useEffect, useRef } from 'react';

interface MatrixConfigProps {
  opacity?: number;
  speed?: number;
  density?: number;
  fontSize?: number;
  enabled?: boolean;
}

export default function MatrixRain({ config }: { config?: MatrixConfigProps }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = config?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isTabActive = true;

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Responsive font base sizes: Mobile (14-18px), Tablet (16-22px), Desktop (18-28px)
    const getBaseFontSize = () => {
      const width = window.innerWidth;
      if (width < 640) return 15;
      if (width < 1024) return 18;
      return 22;
    };

    const baseFontSize = config?.fontSize || getBaseFontSize();

    // 3D perspective projection columns (Z-depth 0.2 [far] to 1.5 [near])
    const count = Math.floor((canvas.width / 24) * (config?.density || 1.2));

    interface RainColumn {
      x: number;
      y: number;
      z: number;
      speed: number;
      length: number;
      chars: string[];
    }

    const createColumn = (randomY = false): RainColumn => {
      const length = Math.floor(14 + Math.random() * 20);
      const chars = Array.from({ length }, (_, idx) => (idx % 2 === 0 ? '1' : '0'));
      return {
        x: (Math.random() - 0.5) * canvas.width * 1.4 + canvas.width / 2,
        y: randomY ? Math.random() * canvas.height : Math.random() * -300 - 50,
        z: 0.3 + Math.random() * 1.2, // 3D depth scale factor
        speed: (2 + Math.random() * 3.5) * (config?.speed || 1),
        length,
        chars,
      };
    };

    const columns: RainColumn[] = Array.from({ length: count }, () => createColumn(true));

    const draw = () => {
      if (!isTabActive) {
        animId = requestAnimationFrame(draw);
        return;
      }

      // Pure dark matte black fade trail
      ctx.fillStyle = 'rgba(5, 5, 5, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      columns.forEach((col) => {
        // Continuous camera forward movement (scale up Z-depth gradually)
        col.z += 0.0015;
        if (col.z > 1.6) {
          col.z = 0.3; // Seamless recycling to distance
        }

        const fontSize = Math.floor(baseFontSize * col.z);
        ctx.font = `bold ${fontSize}px monospace`;

        // Calculate opacity based on Z depth layer
        // Front (z > 1.1): 0.80 - 1.0, Middle (0.6 - 1.1): 0.45 - 0.65, Back (z < 0.6): 0.20 - 0.40
        const depthAlpha =
          col.z > 1.1 ? 0.85 + (col.z - 1.1) * 0.3 : col.z > 0.6 ? 0.45 + (col.z - 0.6) * 0.7 : 0.2 + (col.z - 0.3) * 0.7;

        for (let i = 0; i < col.length; i++) {
          const charY = col.y - i * fontSize;
          if (charY < -50 || charY > canvas.height + 50) continue;

          const isHead = i === 0;

          if (isHead) {
            // Bright white leading head character with green glow
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, depthAlpha * 1.2)})`;
            ctx.shadowColor = '#00FF66';
            ctx.shadowBlur = Math.min(12, Math.floor(10 * col.z));
          } else {
            // Neon green tail characters with distance fade
            const tailFade = 1 - i / col.length;
            ctx.fillStyle = `rgba(0, 255, 102, ${Math.max(0.1, depthAlpha * tailFade)})`;
            ctx.shadowBlur = 0;
          }

          // Occasionally flip a binary digit randomly for dynamic movie intro feel
          if (Math.random() < 0.02) {
            col.chars[i] = Math.random() > 0.5 ? '1' : '0';
          }

          ctx.fillText(col.chars[i], col.x, charY);
        }

        ctx.shadowBlur = 0;
        col.y += col.speed * col.z;

        // Reset stream when it moves completely off the bottom
        if (col.y - col.length * fontSize > canvas.height) {
          col.y = Math.random() * -150;
          col.x = (Math.random() - 0.5) * canvas.width * 1.4 + canvas.width / 2;
          col.speed = (2 + Math.random() * 3.5) * (config?.speed || 1);
          col.z = 0.3 + Math.random() * 1.2;
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [enabled, config]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-100"
    />
  );
}

