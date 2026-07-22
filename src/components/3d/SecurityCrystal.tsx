'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Inner Glowing Security Core
function GlowingCore() {
  const coreRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (coreRef.current) {
      const time = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(time * 2.5) * 0.12;
      coreRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={coreRef}>
      <icosahedronGeometry args={[0.55, 2]} />
      <meshBasicMaterial color="#a855f7" wireframe={false} />
      <pointLight color="#a855f7" intensity={8} distance={6} />
      <pointLight color="#3b82f6" intensity={5} distance={8} />
    </mesh>
  );
}

// Outer Low-Poly Glass Hexagonal Security Crystal
function CrystalMesh({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const crystalRef = useRef<THREE.Group>(null!);
  const outerMeshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (crystalRef.current) {
      // Gentle continuous rotation
      crystalRef.current.rotation.y += delta * 0.4;
      crystalRef.current.rotation.x += delta * 0.15;

      // Mouse parallax response
      const targetX = mouse.current.y * 0.35;
      const targetY = mouse.current.x * 0.35;
      crystalRef.current.rotation.x = THREE.MathUtils.lerp(crystalRef.current.rotation.x, targetX, 0.05);
      crystalRef.current.rotation.y = THREE.MathUtils.lerp(crystalRef.current.rotation.y, targetY, 0.05);
    }
  });

  return (
    <group ref={crystalRef}>
      {/* Outer Glass Shell */}
      <mesh ref={outerMeshRef}>
        <octahedronGeometry args={[1.5, 0]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          resolution={256}
          transmission={0.92}
          roughness={0.15}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          thickness={0.6}
          ior={1.4}
          chromaticAberration={0.08}
          anisotropy={0.1}
          distortion={0.2}
          distortionScale={0.3}
          temporalDistortion={0.2}
          color="#8b5cf6"
          attenuationDistance={0.5}
          attenuationColor="#3b82f6"
        />
      </mesh>

      {/* Wireframe Shield Lines */}
      <mesh>
        <octahedronGeometry args={[1.52, 0]} />
        <meshBasicMaterial color="#3b82f6" wireframe opacity={0.35} transparent />
      </mesh>

      {/* Glowing Energy Core Inside */}
      <GlowingCore />
    </group>
  );
}

// Main 3D Canvas Container
export default function SecurityCrystal() {
  const [mounted, setMounted] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientWidth, clientHeight } = e.currentTarget;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / clientWidth - 0.5;
    const y = (e.clientY - rect.top) / clientHeight - 0.5;
    mouse.current = { x, y };
  };

  if (!mounted) {
    return (
      <div className="w-full h-[400px] md:h-[500px] flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-purple-600/10 animate-pulse border border-purple-500/20" />
      </div>
    );
  }

  // 2D Fallback for mobile or WebGL disabled
  if (!hasWebGL) {
    return (
      <div className="w-full h-[400px] md:h-[500px] flex items-center justify-center relative">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="w-48 h-48 glass-panel border border-purple-500/30 flex items-center justify-center transform rotate-45">
            <div className="w-24 h-24 bg-purple-500/20 border border-blue-400/40 rounded-xl flex items-center justify-center transform -rotate-45">
              <div className="w-10 h-10 bg-purple-500 rounded-full shadow-[0_0_25px_#a855f7] animate-ping opacity-75" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-[420px] md:h-[520px] relative flex items-center justify-center cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
    >
      {/* Background Soft Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 rounded-full bg-purple-600/25 blur-[90px] animate-pulse" />
        <div className="w-60 h-60 rounded-full bg-blue-500/20 blur-[80px]" />
      </div>

      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
        <directionalLight position={[-5, -5, -5]} intensity={1.5} color="#8b5cf6" />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
          <CrystalMesh mouse={mouse} />
          <Sparkles count={40} scale={4} size={2} speed={0.4} color="#a855f7" opacity={0.6} />
        </Float>
      </Canvas>
    </div>
  );
}
