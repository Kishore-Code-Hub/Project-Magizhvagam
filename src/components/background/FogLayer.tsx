'use client';

import React from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface FogLayerProps {
  density?: number;
  color?: string;
  backgroundColor?: string;
}

export default function FogLayer({
  density = 0.0015,
  color = '#001a08',
  backgroundColor = '#020202',
}: FogLayerProps) {
  const { scene, gl } = useThree();

  React.useEffect(() => {
    scene.fog = new THREE.FogExp2(color, density);
    scene.background = new THREE.Color(backgroundColor);
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;

    return () => {
      scene.fog = null;
    };
  }, [scene, gl, density, color, backgroundColor]);

  return null;
}
