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

function getCharList(mode: string): string[] {
  switch (mode) {
    case 'katakana':
      return ['ｱ', 'ｲ', 'ｳ', 'ｴ', 'ｵ', 'ｶ', 'ｷ', 'ｸ', 'ｹ', 'ｺ', 'ｻ', 'ｼ', 'ｽ', 'ｾ', 'ｿ', '0', '1'];
    case 'hex':
      return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    case 'cyber':
      return ['0', '1', '⚡', '⚙', '⌘', '⌥', '⎇', '⌬', '⏣', '∅'];
    case 'mixed':
      return ['0', '1', 'X', 'Y', 'Z', '7', '9', 'A', 'F', 'ｱ', 'ｼ', '⌬'];
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
  const activeDensity = density && density > 0 ? density : 45;
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
      speed: (2.5 + Math.random() * 3.5) * baseSpeed,
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
  const dprRef = useRef<number>(1);
  const isTabActiveRef = useRef<boolean>(true);
  const isInitializedRef = useRef<boolean>(false);
  const frameNumberRef = useRef<number>(0);
  const wasVisibleRef = useRef<boolean | null>(null);

  const { settings } = useMatrixSettings();
  const settingsRef = useRef(settings);

  // Synchronize settings changes into settingsRef and update stream density/parameters live without restarting loop
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
        settings.density || 45,
        charList
      );
    }
  }, [settings]);

  // Handle visibility transitions based on route / enabled state
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isEnabled = settings.enabled ?? true;
  const isVisible = !isAdminPage && isEnabled;

  useEffect(() => {
    wasVisibleRef.current = isVisible;
  }, [isVisible]);

  // Effect A: Initialize engine EXACTLY ONCE on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[MatrixEngine] Canvas reference missing on initialization');
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true }) || canvas.getContext('2d');
    if (!ctx) {
      console.error('[MatrixEngine] Failed to initialize Canvas 2D context.');
      return;
    }
    ctxRef.current = ctx;

    const handleVisibilityChange = () => {
      isTabActiveRef.current = !document.hidden;
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
      dprRef.current = dpr;

      activeCanvas.width = Math.floor(width * dpr);
      activeCanvas.height = Math.floor(height * dpr);
      activeCanvas.style.width = `${width}px`;
      activeCanvas.style.height = `${height}px`;

      activeCtx.setTransform(1, 0, 0, 1, 0, 0);
      activeCtx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
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
        currentSettings.density || 45,
        charList
      );
    };

    updateDimensionsAndStreams();

    const handleResize = () => {
      updateDimensionsAndStreams();
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      if (!isTabActiveRef.current) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const activeCtx = ctxRef.current;
      if (!activeCtx) return;

      frameNumberRef.current++;

      const currentSettings = settingsRef.current;
      const width = widthRef.current;
      const height = heightRef.current;
      const backgroundDarkness = Math.min(0.5, Math.max(0.05, currentSettings.backgroundDarkness || 0.18));
      const baseFontSize = currentSettings.fontSize || 16;
      const baseSpeed = currentSettings.rainSpeed || 1.2;
      const baseTrailLength = currentSettings.trailLength || 22;
      const glowStrength = currentSettings.glowStrength ?? 6;
      const brightnessScale = currentSettings.characterBrightness ?? 1.0;
      const charList = getCharList(currentSettings.characterMode);

      activeCtx.globalAlpha = 1.0;
      activeCtx.globalCompositeOperation = 'source-over';

      // Matte dark background trail fade with configurable darkness
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
            activeCtx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, 0.95 * brightnessScale)})`;
            if (glowStrength > 0) {
              activeCtx.shadowColor = '#00FF66';
              activeCtx.shadowBlur = glowStrength;
            } else {
              activeCtx.shadowBlur = 0;
            }
          } else {
            const tailFade = 1 - i / stream.length;
            const alpha = Math.max(0.08, tailFade * 0.85 * brightnessScale);
            activeCtx.fillStyle = `rgba(0, 255, 102, ${alpha})`;
            activeCtx.shadowBlur = 0;
          }

          if (Math.random() < 0.015) {
            stream.chars[i] = charList[Math.floor(Math.random() * charList.length)];
          }

          activeCtx.fillText(stream.chars[i], stream.x, charY);
        }

        activeCtx.shadowBlur = 0;
        stream.y += stream.speed;

        if (stream.y - stream.length * (stream.fontSize * 1.1) > height) {
          stream.y = Math.random() * -200 - 30;
          stream.speed = (2.5 + Math.random() * 3.5) * baseSpeed;
          stream.length = Math.floor(baseTrailLength * (0.75 + Math.random() * 0.5));
          stream.chars = Array.from({ length: stream.length }, () => getRandomChar(charList));
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    const initialFrameId = requestAnimationFrame(render);
    animationFrameRef.current = initialFrameId;

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isInitializedRef.current = false;
    };
  }, []);

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





