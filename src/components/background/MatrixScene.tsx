'use client';

import React from 'react';
import CameraRig from './CameraRig';
import FogLayer from './FogLayer';
import MatrixTunnel from './MatrixTunnel';
import Particles from './Particles';
import { MatrixSettings } from './store/matrixStore';

interface MatrixSceneProps {
  settings: MatrixSettings;
}

export default function MatrixScene({ settings }: MatrixSceneProps) {
  return (
    <>
      <ambientLight intensity={0.2} color="#00ff66" />
      <directionalLight position={[0, 20, 10]} intensity={0.5} color="#ffffff" />

      {/* Volumetric Fog & ACESFilmicToneMapping */}
      <FogLayer
        density={settings.fogDensity}
        color={settings.fogColor}
        backgroundColor={settings.backgroundColor}
      />

      {/* Camera Controller with Z-flight & sway drift */}
      <CameraRig
        cameraMode={settings.cameraMode}
        speed={settings.cameraSpeed}
        drift={settings.cameraDrift}
        fov={settings.cameraFOV}
      />

      {/* 3D Concentric Matrix Tunnel Instanced Mesh */}
      <MatrixTunnel
        density={settings.density}
        rainSpeed={settings.rainSpeed}
        characterMode={settings.characterMode}
        glowIntensity={settings.glowIntensity}
      />

      {/* GPU Digital Dust Particle Field */}
      <Particles count={600} speed={settings.cameraSpeed * 0.8} />
    </>
  );
}
