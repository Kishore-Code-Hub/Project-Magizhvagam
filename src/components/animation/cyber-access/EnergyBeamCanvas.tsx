'use client';

import React, { useEffect, useRef } from 'react';
import { CyberAccessState } from './types';

interface EnergyBeamCanvasProps {
  state: CyberAccessState;
  isMobile: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export default function EnergyBeamCanvas({ state, isMobile }: EnergyBeamCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);
    const centerY = height / 2;
    const centerX = width / 2;
    const ringRadius = isMobile ? 45 : 65;

    let animFrameId: number;
    let startTime = performance.now();
    let shockwaveRadius = 0;
    let ringAngle = 0;

    const sparks: Spark[] = [];
    const sparkCount = isMobile ? 18 : 35;

    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.2;
      const speed = Math.random() * 4 + 2;
      sparks.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        alpha: 1.0,
      });
    }

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, width, height);

      if (state === 'BEAM') {
        // Laser trace from x=0 to x=centerX over ~180ms
        const progress = Math.min(1, elapsed / 180);
        const currentX = centerX * progress;

        ctx.save();
        // Core laser beam
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(currentX, centerY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Neon outer aura
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(currentX, centerY);
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.6)';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.restore();

        // Shockwave impact when reaching center
        if (progress >= 0.85) {
          shockwaveRadius += 3.5;
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 240, 255, ${Math.max(0, 1 - shockwaveRadius / 60)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      } else if (state === 'RING') {
        // Complete full beam to center
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(centerX - ringRadius, centerY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();

        // Accelerating 360° ring orbit over 350ms
        const ringProgress = Math.min(1, elapsed / 300);
        ringAngle = ringProgress * Math.PI * 2;

        // Draw segmented precision arcs
        ctx.save();
        ctx.translate(centerX, centerY);

        // Segment 1 (Main rotating beam arc)
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, ringAngle);
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 14;
        ctx.stroke();

        // White glowing leading orbital node
        const nodeX = Math.cos(ringAngle) * ringRadius;
        const nodeY = Math.sin(ringAngle) * ringRadius;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fill();

        // Static precision segmented outer tick marks
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          const innerR = ringRadius + 6;
          const outerR = ringRadius + 12;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
          ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.restore();

        // Electrical sparks scattering outward
        if (ringProgress > 0.4) {
          ctx.save();
          for (let i = 0; i < sparks.length; i++) {
            const s = sparks[i];
            s.x += s.vx;
            s.y += s.vy;
            s.alpha -= 0.03;
            if (s.alpha <= 0) continue;

            ctx.globalAlpha = Math.max(0, s.alpha);
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 6;
            ctx.fillRect(s.x, s.y, s.size, s.size);
          }
          ctx.restore();
        }
      } else if (state === 'RELEASE' || state === 'SHUTTER') {
        // Continuous horizontal laser beam across entire viewport width
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);

        if (state === 'SHUTTER') {
          // White-hot seam flash
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 24;
        } else {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 16;
        }

        ctx.stroke();

        // Secondary cyan/green flare line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.5)';
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.restore();
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [state, isMobile]);

  if (state !== 'BEAM' && state !== 'RING' && state !== 'RELEASE' && state !== 'SHUTTER') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}
