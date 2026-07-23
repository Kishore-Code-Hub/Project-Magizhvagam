'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createMatrixAtlasTexture, MatrixShader } from './Shaders/BinaryShader';
import { CharacterMode } from './store/matrixStore';

interface MatrixRainProps {
  density?: number;
  speed?: number;
  characterMode?: CharacterMode;
  glowIntensity?: number;
  bloomThreshold?: number;
}

export default function MatrixRain3D({
  density = 6000,
  speed = 1.2,
  characterMode = 'binary',
  glowIntensity = 0.8,
  bloomThreshold = 0.4,
}: MatrixRainProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate dynamic atlas texture when characterMode changes
  const atlasTexture = useMemo(() => {
    return createMatrixAtlasTexture(characterMode);
  }, [characterMode]);

  // Compute instance transformation matrices and custom buffer attributes
  const { dummy, instanceData } = useMemo(() => {
    const dummyObj = new THREE.Object3D();
    const data: {
      x: number;
      y: number;
      z: number;
      speed: number;
      opacity: number;
      charIndex: number;
      isHead: boolean;
      length: number;
    }[] = [];

    const columns = Math.floor(Math.sqrt(density));
    const spacing = 1.8;

    for (let i = 0; i < density; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);

      // Concentric depth arrangement (spread across Z -2200 to +100)
      const radius = 10 + Math.random() * 45;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = (Math.random() - 0.5) * 80;
      const z = -Math.random() * 2200;

      const isHead = Math.random() < 0.08;
      const opacity = z < -1400 ? 0.25 : z < -600 ? 0.55 : 0.95;

      data.push({
        x,
        y,
        z,
        speed: (0.8 + Math.random() * 1.5) * speed,
        opacity,
        charIndex: Math.floor(Math.random() * 16),
        isHead,
        length: Math.floor(12 + Math.random() * 18),
      });
    }

    return { dummy: dummyObj, instanceData: data };
  }, [density, speed]);

  const { charIndices, opacities, isHeads } = useMemo(() => {
    const indices = new Float32Array(density);
    const opac = new Float32Array(density);
    const heads = new Float32Array(density);

    for (let i = 0; i < density; i++) {
      indices[i] = instanceData[i].charIndex;
      opac[i] = instanceData[i].opacity;
      heads[i] = instanceData[i].isHead ? 1.0 : 0.0;
    }

    return { charIndices: indices, opacities: opac, isHeads: heads };
  }, [density, instanceData]);

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    for (let i = 0; i < density; i++) {
      const item = instanceData[i];
      dummy.position.set(item.x, item.y, item.z);
      dummy.scale.set(1.2, 1.2, 1.2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [density, instanceData, dummy]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    for (let i = 0; i < density; i++) {
      const item = instanceData[i];
      item.y -= item.speed * (delta * 60);

      // Continuous recycling when exiting bottom
      if (item.y < -50) {
        item.y = 50 + Math.random() * 20;
        item.z = -Math.random() * 2200;
        item.charIndex = Math.floor(Math.random() * 16);
      }

      dummy.position.set(item.x, item.y, item.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  const shaderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAtlas: { value: atlasTexture },
      uGlowIntensity: { value: glowIntensity },
      uBloomThreshold: { value: bloomThreshold },
      uColor: { value: new THREE.Color('#00ff66') },
      uHeadColor: { value: new THREE.Color('#ffffff') },
    }),
    [atlasTexture, glowIntensity, bloomThreshold]
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, density]}
      frustumCulled={false}
    >
      <planeGeometry args={[1.2, 1.2]}>
        <instancedBufferAttribute
          attach="attributes-aCharIndex"
          args={[charIndices, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aOpacity"
          args={[opacities, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aIsHead"
          args={[isHeads, 1]}
        />
      </planeGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={MatrixShader.vertexShader}
        fragmentShader={MatrixShader.fragmentShader}
        uniforms={shaderUniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
