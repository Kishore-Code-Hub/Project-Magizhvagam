'use client';

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraMode } from './store/matrixStore';

interface CameraRigProps {
  cameraMode?: CameraMode;
  speed?: number;
  drift?: boolean;
  fov?: number;
}

export default function CameraRig({
  cameraMode = 'Fly Through',
  speed = 1.5,
  drift = true,
  fov = 60,
}: CameraRigProps) {
  const { camera } = useThree();
  const targetZ = useRef(0);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;

    if (cameraMode === 'Fly Through' || cameraMode === 'Cinematic') {
      targetZ.current -= speed * 15 * (delta * 60);

      // Seamless Z position recycling loop
      if (targetZ.current < -2000) {
        targetZ.current = 0;
      }

      camera.position.z = targetZ.current;

      // Subtle noise-driven sway & breathing motion
      if (drift) {
        camera.position.x = Math.sin(time * 0.5) * 1.5;
        camera.position.y = Math.cos(time * 0.3) * 1.0;
        camera.rotation.z = Math.sin(time * 0.2) * 0.015;
      }
    } else if (cameraMode === 'Aggressive') {
      targetZ.current -= speed * 35 * (delta * 60);
      if (targetZ.current < -2000) targetZ.current = 0;
      camera.position.z = targetZ.current;
      camera.position.x = Math.sin(time * 1.2) * 3.0;
      camera.position.y = Math.cos(time * 0.8) * 2.0;
    } else if (cameraMode === 'Orbit') {
      const radius = 25;
      camera.position.x = Math.sin(time * 0.4) * radius;
      camera.position.z = Math.cos(time * 0.4) * radius;
      camera.lookAt(0, 0, -100);
    } else {
      // Static mode
      camera.position.set(0, 0, 0);
      camera.rotation.set(0, 0, 0);
    }
  });

  return null;
}
