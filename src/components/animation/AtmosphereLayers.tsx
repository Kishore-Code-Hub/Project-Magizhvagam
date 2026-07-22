'use client';

import React, { useEffect, useRef } from 'react';
import MatrixRain from '@/components/animation/MatrixRain';
import NetworkMesh from '@/components/animation/NetworkMesh';
import VolumetricFog from '@/components/animation/VolumetricFog';

export default function AtmosphereLayers() {
  const ledCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ledCanvasRef.current;
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

    // Create 20 randomly blinking status LEDs in background
    const leds = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 1,
      blinkSpeed: Math.random() * 0.05 + 0.01,
      opacity: Math.random(),
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      leds.forEach((led) => {
        led.opacity += led.blinkSpeed;
        if (led.opacity > 1 || led.opacity < 0.1) {
          led.blinkSpeed *= -1;
        }

        ctx.beginPath();
        ctx.arc(led.x, led.y, led.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 102, ${Math.abs(led.opacity) * 0.5})`;
        ctx.shadowColor = 'rgba(0, 255, 102, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Layer 1: Dark Matte Black Base */}
      <div className="absolute inset-0 bg-[#050505]" />

      {/* Layer 2: Volumetric Charcoal Fog */}
      <VolumetricFog />

      {/* Layer 3 & 4: 3-Layered Matrix Rain */}
      <MatrixRain />

      {/* Layer 5: Blinking Green Status LEDs Canvas */}
      <canvas
        ref={ledCanvasRef}
        className="absolute inset-0 pointer-events-none z-[2] opacity-60"
      />

      {/* Layer 6: Subtle Network Mesh Connections */}
      <NetworkMesh />
    </div>
  );
}
