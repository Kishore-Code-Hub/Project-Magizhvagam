'use client';

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import MatrixScene from './MatrixScene';
import { useMatrixSettings } from './hooks/useMatrixSettings';

export default function MatrixEngine() {
  const { settings, isLoaded } = useMatrixSettings();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(media.matches);
    }
  }, []);

  if (!mounted || !isLoaded || !settings.enabled || reducedMotion) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#020202]" />
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020202]">
      <Canvas
        camera={{ position: [0, 0, 0], fov: settings.cameraFOV, near: 0.1, far: settings.cameraDepth }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        className="w-full h-full"
      >
        <MatrixScene settings={settings} />
      </Canvas>
    </div>
  );
}
