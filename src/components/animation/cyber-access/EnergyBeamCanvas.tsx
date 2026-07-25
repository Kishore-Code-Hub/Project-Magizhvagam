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
    const ringRadius = isMobile ? 55 : 85;

    let animFrameId: number;
    let startTime = performance.now();
    let shockwaveRadius = 0;

    const sparks: Spark[] = [];
    const sparkCount = isMobile ? 25 : 55;

    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.3;
      const speed = Math.random() * 6 + 3;
      sparks.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1,
        alpha: 1.0,
      });
    }

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, width, height);

      if (state === 'BEAM') {
        // High-speed laser trace to center over ~400ms
        const progress = Math.min(1, elapsed / 380);
        const currentX = centerX * progress;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; // Additive light blending

        // Layer 4: 200px Radial bloom halo
        const radialBloom = ctx.createRadialGradient(currentX, centerY, 0, currentX, centerY, 200);
        radialBloom.addColorStop(0, 'rgba(0, 255, 102, 0.35)');
        radialBloom.addColorStop(0.5, 'rgba(0, 240, 255, 0.15)');
        radialBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialBloom;
        ctx.beginPath();
        ctx.arc(currentX, centerY, 200, 0, Math.PI * 2);
        ctx.fill();

        // Layer 3: 50px Outer neon aura
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(currentX, centerY);
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.6)';
        ctx.lineWidth = 50;
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 40;
        ctx.stroke();

        // Layer 2: 12px Inner cyan glow
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(currentX, centerY);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 12;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 20;
        ctx.stroke();

        // Layer 1: 4px White-hot core
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(currentX, centerY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.stroke();

        ctx.restore();

        // Impact shockwave at center node
        if (progress >= 0.85) {
          shockwaveRadius += 6;
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 240, 255, ${Math.max(0, 1 - shockwaveRadius / 120)})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 20;
          ctx.stroke();
          ctx.restore();
        }
      } else if (state === 'RING') {
        // Continuous beam to ring edge
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(centerX - ringRadius, centerY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 25;
        ctx.stroke();
        ctx.restore();

        // Mechanical Vault Ring Unlock Sequence: Accelerate -> Overshoot -> Snap Back
        const rawProgress = Math.min(1, elapsed / 550);
        let ringAngle = rawProgress * Math.PI * 2;

        // Mechanical overshoot & snap-back physics curve
        if (rawProgress > 0.75) {
          const overshoot = Math.sin((rawProgress - 0.75) * Math.PI * 4) * 0.15;
          ringAngle += overshoot;
        }

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.globalCompositeOperation = 'lighter';

        // Outer segmented HUD tick marks (36 ticks)
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 18) {
          const innerR = ringRadius + 8;
          const outerR = ringRadius + 16;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
          ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Segment 1: Rotating green laser vault arc
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, ringAngle);
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 20;
        ctx.stroke();

        // White glowing leading node
        const nodeX = Math.cos(ringAngle) * ringRadius;
        const nodeY = Math.sin(ringAngle) * ringRadius;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.fill();

        ctx.restore();

        // Electrical sparks scattering outward upon lock completion
        if (rawProgress > 0.4) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < sparks.length; i++) {
            const s = sparks[i];
            s.x += s.vx;
            s.y += s.vy;
            s.alpha -= 0.025;
            if (s.alpha <= 0) continue;

            ctx.globalAlpha = Math.max(0, s.alpha);
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;
            ctx.fillRect(s.x, s.y, s.size, s.size);
          }
          ctx.restore();
        }
      } else if (state === 'RELEASE' || state === 'SHUTTER') {
        // Continuous horizontal energy beam spanning entire viewport width
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);

        if (state === 'SHUTTER') {
          // Intense white seam flash
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 6;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 35;
        } else {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 25;
        }
        ctx.stroke();

        // Secondary cyan aura flare line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.7)';
        ctx.lineWidth = 16;
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
