'use client';

import React, { useEffect, useRef } from 'react';

const CYBER_TERMS = [
  'TCP', 'UDP', 'HTTPS', 'SSH', 'TLS', 'JWT', 'RSA', 'AES-256', 'SHA-256',
  'Burp Suite', 'Wireshark', 'Nmap', 'Docker', 'FastAPI', 'Python', 'Linux', 'SQL',
  'Firewall', 'IDS', 'IPS', 'Recon', 'Enumeration', 'Payload', 'Port 22', 'Port 80',
  'Port 443', '192.168.1.1', 'localhost', 'CVE', 'OWASP', 'SYN', 'ACK', 'Exploit',
  'Root', 'Hash', 'Kali', 'Packet', 'Session', 'Token', 'AI', 'Neural Network'
];

interface MatrixConfigProps {
  opacity?: number;
  speed?: number;
  density?: number;
  fontSize?: number;
  enabled?: boolean;
}

export default function MatrixRain({ config }: { config?: MatrixConfigProps }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const opacity = config?.opacity ?? 0.04;
  const speed = config?.speed ?? 0.35;
  const enabled = config?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Layer setup: Layer 1 (Huge blurred), Layer 2 (Binary), Layer 3 (Terms)
    const fontSize = config?.fontSize || 12;
    const colCount = Math.floor(canvas.width / 42);
    
    const dropsLayer1 = Array(colCount).fill(0).map(() => Math.random() * -100);
    const dropsLayer2 = Array(colCount).fill(0).map(() => Math.random() * -100);
    const dropsLayer3 = Array(colCount).fill(0).map(() => Math.random() * -100);

    const speeds1 = Array(colCount).fill(0).map(() => (0.1 + Math.random() * 0.15) * speed);
    const speeds2 = Array(colCount).fill(0).map(() => (0.2 + Math.random() * 0.25) * speed);
    const speeds3 = Array(colCount).fill(0).map(() => (0.3 + Math.random() * 0.35) * speed);

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < colCount; i++) {
        const x = i * 42;

        // LAYER 1: Background Huge Blurred Symbols (1% Opacity)
        ctx.fillStyle = `rgba(0, 255, 102, ${opacity * 0.25})`;
        ctx.font = `${fontSize * 1.6}px monospace`;
        const char1 = CYBER_TERMS[Math.floor(Math.random() * CYBER_TERMS.length)];
        ctx.fillText(char1, x, dropsLayer1[i]);
        dropsLayer1[i] += speeds1[i] * fontSize;
        if (dropsLayer1[i] > canvas.height && Math.random() > 0.98) {
          dropsLayer1[i] = 0;
        }

        // LAYER 2: Middleground Binary Streams (3% Opacity)
        ctx.fillStyle = `rgba(0, 255, 102, ${opacity * 0.6})`;
        ctx.font = `${fontSize}px monospace`;
        const char2 = Math.random() > 0.5 ? '1' : '0';
        ctx.fillText(char2, x, dropsLayer2[i]);
        dropsLayer2[i] += speeds2[i] * fontSize;
        if (dropsLayer2[i] > canvas.height && Math.random() > 0.98) {
          dropsLayer2[i] = 0;
        }

        // LAYER 3: Foreground Real Cyber Terms (5% Opacity)
        ctx.fillStyle = `rgba(0, 255, 102, ${opacity})`;
        ctx.font = `${fontSize * 0.95}px monospace`;
        const char3 = CYBER_TERMS[Math.floor(Math.random() * CYBER_TERMS.length)];
        ctx.fillText(char3, x, dropsLayer3[i]);
        dropsLayer3[i] += speeds3[i] * fontSize;
        if (dropsLayer3[i] > canvas.height && Math.random() > 0.98) {
          dropsLayer3[i] = 0;
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, [opacity, speed, enabled, config]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
}
