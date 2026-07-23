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

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const baseFontSize = config?.fontSize || 16;
    const colWidth = 22;
    const colCount = Math.floor(canvas.width / colWidth);

    // Create column objects with independent speeds, delays, lengths, and brightnesses
    const columns = Array.from({ length: colCount }, (_, i) => ({
      x: i * colWidth,
      y: Math.random() * -100,
      speed: (0.18 + Math.random() * 0.3) * (config?.speed || 1),
      length: Math.floor(14 + Math.random() * 22),
      delay: Math.random() * 40,
      brightness: 0.35 + Math.random() * 0.25, // 35% to 60% opacity for high visibility
    }));

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.16)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${baseFontSize}px monospace`;

      columns.forEach((col, colIdx) => {
        if (col.delay > 0) {
          col.delay--;
          return;
        }

        // Draw character tail with opacity fade and head character glow
        for (let j = 0; j < col.length; j++) {
          const charY = col.y - j * baseFontSize;
          if (charY < 0 || charY > canvas.height) continue;

          const isHead = j === 0;
          const char = (colIdx + j) % 2 === 0 ? '1' : '0';

          if (isHead) {
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#00FF66';
            ctx.shadowBlur = 8;
          } else {
            const tailFade = 1 - j / col.length;
            ctx.fillStyle = `rgba(0, 255, 102, ${col.brightness * tailFade})`;
            ctx.shadowBlur = 0;
          }

          ctx.fillText(char, col.x, charY);
        }

        ctx.shadowBlur = 0;
        col.y += col.speed * baseFontSize;

        // Reset column when it leaves screen
        if (col.y - col.length * baseFontSize > canvas.height) {
          col.y = 0;
          col.speed = (0.18 + Math.random() * 0.3) * (config?.speed || 1);
          col.length = Math.floor(14 + Math.random() * 22);
          col.brightness = 0.35 + Math.random() * 0.25;
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
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
