'use client';

import React from 'react';
import MatrixRain3D from './MatrixRain';
import { CharacterMode } from './store/matrixStore';

interface MatrixTunnelProps {
  density?: number;
  rainSpeed?: number;
  characterMode?: CharacterMode;
  glowIntensity?: number;
}

export default function MatrixTunnel({
  density = 6000,
  rainSpeed = 1.2,
  characterMode = 'binary',
  glowIntensity = 0.8,
}: MatrixTunnelProps) {
  return (
    <group>
      <MatrixRain3D
        density={density}
        speed={rainSpeed}
        characterMode={characterMode}
        glowIntensity={glowIntensity}
      />
    </group>
  );
}
