'use client';

import React, { useEffect, useRef } from 'react';

const CYBER_TERMS_FULL = [
  'AES-256', 'RSA', 'SHA256', 'JWT', 'OAuth', 'TCP', 'UDP', 'HTTPS',
  'FastAPI', 'Prisma', 'Docker', 'Linux', 'Wireshark', 'Burp', 'Nmap', 'Hydra',
  'Nikto', 'OWASP', 'CVE', 'Kubernetes', 'Cloudflare', 'SSH', 'TLS', 'Zero Trust',
  'Firewall', 'Packet', 'SOC', 'IDS', 'IPS', 'XSS', 'SQLi', 'CSRF', 'MITM',
  'Hash', 'Encryption', 'Authorization', 'Authentication', 'OpenSSH', 'GitHub',
  'Python', 'C++', 'AI', 'TensorFlow', 'CNN', 'OpenCV', 'Machine Learning'
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

    const fontSize = config?.fontSize || 12;
    const colCount = Math.floor(canvas.width / 44);
    
    const dropsLayer1 = Array(colCount).fill(0).map(() => Math.random() * -100);
    const dropsLayer2 = Array(colCount).fill(0).map(() => Math.random() * -100);
    const dropsLayer3 = Array(colCount).fill(0).map(() => Math.random() * -100);

    const speeds1 = Array(colCount).fill(0).map(() => (0.1 + Math.random() * 0.12) * speed);
    const speeds2 = Array(colCount).fill(0).map(() => (0.18 + Math.random() * 0.2) * speed);
    const speeds3 = Array(colCount).fill(0).map(() => (0.25 + Math.random() * 0.3) * speed);

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < colCount; i++) {
        const x = i * 44;

        // LAYER 1: Very Slow Huge Blurred Symbols (2% Opacity + Glow)
        ctx.fillStyle = `rgba(0, 255, 102, 0.02)`;
        ctx.font = `${fontSize * 1.5}px monospace`;
        ctx.shadowColor = 'rgba(0, 255, 102, 0.3)';
        ctx.shadowBlur = 8;
        const char1 = CYBER_TERMS_FULL[Math.floor(Math.random() * CYBER_TERMS_FULL.length)];
        ctx.fillText(char1, x, dropsLayer1[i]);
        ctx.shadowBlur = 0;
        dropsLayer1[i] += speeds1[i] * fontSize;
        if (dropsLayer1[i] > canvas.height && Math.random() > 0.985) {
          dropsLayer1[i] = 0;
        }

        // LAYER 2: Classic Matrix Rain 0/1 (4% Opacity)
        ctx.fillStyle = `rgba(0, 255, 102, ${opacity * 0.8})`;
        ctx.font = `${fontSize}px monospace`;
        const char2 = Math.random() > 0.5 ? '1' : '0';
        ctx.fillText(char2, x, dropsLayer2[i]);
        dropsLayer2[i] += speeds2[i] * fontSize;
        if (dropsLayer2[i] > canvas.height && Math.random() > 0.985) {
          dropsLayer2[i] = 0;
        }

        // LAYER 3: 45+ Cybersecurity Terms Rain (5% Opacity)
        ctx.fillStyle = `rgba(0, 255, 102, ${opacity})`;
        ctx.font = `${fontSize * 0.95}px monospace`;
        const char3 = CYBER_TERMS_FULL[Math.floor(Math.random() * CYBER_TERMS_FULL.length)];
        ctx.fillText(char3, x, dropsLayer3[i]);
        dropsLayer3[i] += speeds3[i] * fontSize;
        if (dropsLayer3[i] > canvas.height && Math.random() > 0.985) {
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
