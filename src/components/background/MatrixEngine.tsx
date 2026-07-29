'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useMatrixSettings } from './hooks/useMatrixSettings';

interface RainStream {
  laneIndex: number;
  x: number;
  y: number;
  speed: number;
  length: number;
  fontSize: number;
  chars: string[];
}

function getCharList(mode: string, customText?: string): string[] {
  switch (mode) {
    case 'katakana':
      return ['ｱ', 'ｲ', 'ｳ', 'ｴ', 'ｵ', 'ｶ', 'ｷ', 'ｸ', 'ｹ', 'ｺ', 'ｻ', 'ｼ', 'ｽ', 'ｾ', 'ｿ', '0', '1'];
    case 'hex':
      return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    case 'cyber':
      return ['0', '1', '⚡', '⚙', '⌘', '⌥', '⎇', '⌬', '⏣', '∅'];
    case 'ascii':
      return ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '[', ']', ':', ';', '<', '>', '?', '/'];
    case 'keywords':
      return ['CYBER', 'SECURITY', 'ROOT', 'SHELL', 'KERNEL', 'PACKET', 'SOC', 'CIPHER', 'FIREWALL', 'BREACH'];
    case 'languages':
      return ['PYTHON', 'TYPESCRIPT', 'RUST', 'GOLANG', 'C++', 'JAVASCRIPT', 'SQL', 'BASH'];
    case 'networking':
      return ['TCP', 'UDP', 'HTTP', 'DNS', 'SSH', 'SSL', 'TLS', 'IP', 'MAC', 'VLAN'];
    case 'linux':
      return ['sudo', 'grep', 'chmod', 'chown', 'nmap', 'systemctl', 'docker', 'kubectl'];
    case 'sql':
      return ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'INDEX', 'WHERE', 'HAVING'];
    case 'custom':
      if (customText && customText.trim().length > 0) {
        return customText.trim().split(/\s+/);
      }
      return ['KENTUCKY', 'PYTHON', 'FASTAPI', 'SOC', 'AI', 'LINUX', 'CYBERSECURITY'];
    case 'mixed':
      return ['0', '1', 'X', 'Y', 'Z', '7', '9', 'A', 'F', 'ｱ', 'ｼ', '⌬', 'CYBER', 'ROOT', 'PYTHON'];
    case 'binary':
    default:
      return ['0', '1'];
  }
}

function getRandomChar(charList: string[]): string {
  return charList[Math.floor(Math.random() * charList.length)];
}

function generateStreams(
  w: number,
  h: number,
  columnSpacing: number,
  baseFontSize: number,
  baseSpeed: number,
  baseTrailLength: number,
  density: number,
  charList: string[]
): RainStream[] {
  const activeWidth = w || 1920;
  const activeHeight = h || 1080;
  const totalLanes = Math.max(10, Math.floor(activeWidth / columnSpacing));
  const activeDensity = density && density > 0 ? density : 40;
  const targetCount = Math.max(5, Math.floor((totalLanes * activeDensity) / 100));

  const availableLanes = Array.from({ length: totalLanes }, (_, i) => i);
  for (let i = availableLanes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableLanes[i], availableLanes[j]] = [availableLanes[j], availableLanes[i]];
  }

  const selected = availableLanes.slice(0, targetCount);

  return selected.map((laneIdx) => {
    const length = Math.floor(baseTrailLength * (0.75 + Math.random() * 0.5));
    const chars = Array.from({ length }, () => getRandomChar(charList));
    const laneX = laneIdx * columnSpacing + (columnSpacing - baseFontSize) / 2;

    return {
      laneIndex: laneIdx,
      x: laneX,
      y: Math.random() * activeHeight,
      speed: (2.0 + Math.random() * 3.0) * baseSpeed,
      length,
      fontSize: baseFontSize,
      chars,
    };
  });
}

export default function MatrixEngine() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamsRef = useRef<RainStream[]>([]);
  const widthRef = useRef<number>(0);
  const heightRef = useRef<number>(0);
  const isTabActiveRef = useRef<boolean>(true);
  const isInitializedRef = useRef<boolean>(false);
  const lastFrameTimeRef = useRef<number>(0);

  const { settings } = useMatrixSettings();
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
    if (widthRef.current > 0 && heightRef.current > 0) {
      const charList = getCharList(settings.characterMode);
      streamsRef.current = generateStreams(
        widthRef.current,
        heightRef.current,
        Math.max(16, settings.columnSpacing || 32),
        settings.fontSize || 16,
        settings.rainSpeed || 1.2,
        settings.trailLength || 22,
        settings.density || 40,
        charList
      );
    }
  }, [settings]);

  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isEnabled = settings.enabled ?? true;
  const isVisible = !isAdminPage && isEnabled;

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true }) || canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    const startAnimation = () => {
      if (animationFrameRef.current !== null) return;
      lastFrameTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    const stopAnimation = () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      isTabActiveRef.current = !document.hidden;
      if (document.hidden) {
        stopAnimation();
      } else if (isVisible) {
        startAnimation();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const getDPR = () => Math.min(window.devicePixelRatio || 1, 2);

    const updateDimensionsAndStreams = () => {
      const activeCanvas = canvasRef.current;
      const activeCtx = ctxRef.current;
      if (!activeCanvas || !activeCtx) return;

      const width = window.innerWidth || 1920;
      const height = window.innerHeight || 1080;
      const dpr = getDPR();

      widthRef.current = width;
      heightRef.current = height;

      activeCanvas.width = Math.floor(width * dpr);
      activeCanvas.height = Math.floor(height * dpr);
      activeCanvas.style.width = `${width}px`;
      activeCanvas.style.height = `${height}px`;

      activeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const currentSettings = settingsRef.current;
      const charList = getCharList(currentSettings.characterMode);
      streamsRef.current = generateStreams(
        width,
        height,
        Math.max(16, currentSettings.columnSpacing || 32),
        currentSettings.fontSize || 16,
        currentSettings.rainSpeed || 1.2,
        currentSettings.trailLength || 22,
        currentSettings.density || 40,
        charList
      );
    };

    updateDimensionsAndStreams();

    const handleResize = () => {
      updateDimensionsAndStreams();
    };
    window.addEventListener('resize', handleResize);

    const render = (now: number) => {
      if (!isTabActiveRef.current) {
        stopAnimation();
        return;
      }

      // Target ~45 FPS for fluid motion without draining GPU on high refresh screens (120Hz/144Hz)
      const elapsed = now - lastFrameTimeRef.current;
      if (elapsed < 22) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrameTimeRef.current = now;

      const activeCtx = ctxRef.current;
      if (!activeCtx) return;

      const currentSettings = settingsRef.current;
      const width = widthRef.current;
      const height = heightRef.current;
      const backgroundDarkness = Math.min(0.5, Math.max(0.05, currentSettings.backgroundDarkness || 0.18));
      const baseFontSize = currentSettings.fontSize || 16;
      const baseSpeed = currentSettings.rainSpeed || 1.2;
      const baseTrailLength = currentSettings.trailLength || 22;
      const brightnessScale = currentSettings.characterBrightness ?? 1.0;
      const charList = getCharList(currentSettings.characterMode);

      activeCtx.globalAlpha = 1.0;
      activeCtx.globalCompositeOperation = 'source-over';

      // Matte dark background trail fade
      activeCtx.fillStyle = `rgba(5, 5, 5, ${backgroundDarkness})`;
      activeCtx.fillRect(0, 0, width, height);

      // Monospace font stack
      activeCtx.font = `bold ${baseFontSize}px 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Courier New', monospace`;

      const streams = streamsRef.current;
      for (let s = 0; s < streams.length; s++) {
        const stream = streams[s];
        for (let i = 0; i < stream.length; i++) {
          const charY = stream.y - i * (stream.fontSize * 1.1);
          if (charY < -40 || charY > height + 40) continue;

          const isHead = i === 0;

          if (isHead) {
            activeCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, 0.98 * brightnessScale)})`;
          } else {
            const tailFade = 1 - i / stream.length;
            const alpha = Math.max(0.08, tailFade * 0.85 * brightnessScale);
            activeCtx.fillStyle = `rgba(0, 255, 102, ${alpha})`;
          }

          if (Math.random() < 0.015) {
            stream.chars[i] = charList[Math.floor(Math.random() * charList.length)];
          }

          activeCtx.fillText(stream.chars[i], stream.x, charY);
        }

        stream.y += stream.speed;

        if (stream.y - stream.length * (stream.fontSize * 1.1) > height) {
          stream.y = Math.random() * -200 - 30;
          stream.speed = (2.0 + Math.random() * 3.0) * baseSpeed;
          stream.length = Math.floor(baseTrailLength * (0.75 + Math.random() * 0.5));
          stream.chars = Array.from({ length: stream.length }, () => getRandomChar(charList));
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    if (isVisible) {
      startAnimation();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      stopAnimation();
      isInitializedRef.current = false;
    };
  }, [isVisible]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        opacity: isVisible ? (settings.opacity ?? 0.85) : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        transition: 'opacity 0.3s ease, visibility 0.3s ease',
      }}
    >
      <canvas
        id="matrix-canvas"
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}
