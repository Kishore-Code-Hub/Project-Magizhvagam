'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function InnerGlowingCore() {
  const coreRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (coreRef.current) {
      const time = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(time * 3) * 0.15;
      coreRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={coreRef}>
      <octahedronGeometry args={[0.6, 2]} />
      <meshStandardMaterial
        color="#a855f7"
        emissive="#8b5cf6"
        emissiveIntensity={3}
        wireframe={false}
      />
      <pointLight color="#a855f7" intensity={10} distance={7} />
      <pointLight color="#3b82f6" intensity={7} distance={9} />
    </mesh>
  );
}

function QuantumCubeMesh({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.45;
      groupRef.current.rotation.x += delta * 0.2;

      // Mouse parallax tilt
      const targetX = mouse.current.y * 0.4;
      const targetY = mouse.current.x * 0.4;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.06);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.06);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.8;
      ringRef.current.rotation.x += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer Glass Shield Shell */}
      <mesh>
        <dodecahedronGeometry args={[1.4, 0]} />
        <MeshTransmissionMaterial
          backside
          samples={6}
          resolution={256}
          transmission={0.94}
          roughness={0.12}
          clearcoat={0.9}
          thickness={0.5}
          ior={1.45}
          chromaticAberration={0.1}
          color="#8b5cf6"
          attenuationDistance={0.6}
          attenuationColor="#3b82f6"
        />
      </mesh>

      {/* Cyber Wireframe Grid Lines */}
      <mesh>
        <dodecahedronGeometry args={[1.43, 0]} />
        <meshBasicMaterial color="#3b82f6" wireframe opacity={0.4} transparent />
      </mesh>

      {/* Outer Holographic Orbital Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[2.0, 0.02, 16, 100]} />
        <meshBasicMaterial color="#a855f7" wireframe opacity={0.6} transparent />
      </mesh>

      {/* Inner Glowing Quantum Energy Core */}
      <InnerGlowingCore />
    </group>
  );
}

export default function QuantumCyberShield() {
  const [mounted, setMounted] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
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
      <div className="w-full h-[420px] md:h-[520px] flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-purple-600/10 animate-pulse border border-purple-500/20" />
      </div>
    );
  }

  if (!hasWebGL) {
    return (
      <div className="w-full h-[420px] md:h-[520px] flex items-center justify-center relative">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="w-48 h-48 glass-panel border border-purple-500/40 flex items-center justify-center transform rotate-45">
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
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 rounded-full bg-purple-600/25 blur-[100px] animate-pulse" />
        <div className="w-64 h-64 rounded-full bg-blue-500/20 blur-[80px]" />
      </div>

      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2.5} color="#ffffff" />
        <directionalLight position={[-5, -5, -5]} intensity={1.8} color="#8b5cf6" />

        <Float speed={2.2} rotationIntensity={0.6} floatIntensity={0.9}>
          <QuantumCubeMesh mouse={mouse} />
          <Sparkles count={50} scale={4.5} size={2.5} speed={0.4} color="#a855f7" opacity={0.7} />
        </Float>
      </Canvas>
    </div>
  );
}
