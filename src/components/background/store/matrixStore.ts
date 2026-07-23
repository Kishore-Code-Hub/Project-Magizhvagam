'use client';

export type CameraMode = 'Static' | 'Fly Through' | 'Orbit' | 'Cinematic' | 'Aggressive';
export type CharacterMode = 'binary' | 'katakana' | 'hex' | 'cyber' | 'ascii' | 'mixed';
export type PerformanceLevel = 'Ultra' | 'High' | 'Medium' | 'Low' | 'auto';
export type MatrixPreset = 'Classic Matrix' | 'Cyber Tunnel' | 'Dark Web' | 'Neon Hacker' | 'Minimal' | 'Ultra Cinematic';

export interface MatrixSettings {
  enabled: boolean;
  preset: MatrixPreset;
  cameraMode: CameraMode;
  performanceLevel: PerformanceLevel;
  characterMode: CharacterMode;
  density: number;          // Instance count e.g. 1800 to 8000
  rainSpeed: number;        // Stream velocity
  cameraSpeed: number;      // Forward camera Z velocity
  cameraDepth: number;      // Tunnel Z-depth max distance
  characterScale: number;
  characterSpacing: number;
  bloomStrength: number;
  bloomThreshold: number;
  glowIntensity: number;
  fogDensity: number;
  fogColor: string;
  backgroundColor: string;  // Default #020202
  cameraFOV: number;        // Default 60
  cameraDrift: boolean;
  autoPerformance: boolean;
}

export interface MatrixTelemetry {
  fps: number;
  drawCalls: number;
  instances: number;
  triangles: number;
}

export const PRESETS: Record<MatrixPreset, Partial<MatrixSettings>> = {
  'Ultra Cinematic': {
    cameraMode: 'Fly Through',
    characterMode: 'binary',
    density: 6000,
    rainSpeed: 1.2,
    cameraSpeed: 1.5,
    bloomStrength: 0.6,
    fogDensity: 0.0012,
    backgroundColor: '#020202',
    cameraDrift: true,
  },
  'Classic Matrix': {
    cameraMode: 'Cinematic',
    characterMode: 'katakana',
    density: 4500,
    rainSpeed: 1.5,
    cameraSpeed: 0.8,
    bloomStrength: 0.7,
    fogDensity: 0.0018,
    backgroundColor: '#020402',
    cameraDrift: true,
  },
  'Cyber Tunnel': {
    cameraMode: 'Aggressive',
    characterMode: 'cyber',
    density: 7500,
    rainSpeed: 2.0,
    cameraSpeed: 2.5,
    bloomStrength: 0.85,
    fogDensity: 0.001,
    backgroundColor: '#010302',
    cameraDrift: true,
  },
  'Dark Web': {
    cameraMode: 'Fly Through',
    characterMode: 'hex',
    density: 5000,
    rainSpeed: 0.9,
    cameraSpeed: 1.0,
    bloomStrength: 0.4,
    fogDensity: 0.0022,
    backgroundColor: '#010101',
    cameraDrift: false,
  },
  'Neon Hacker': {
    cameraMode: 'Cinematic',
    characterMode: 'mixed',
    density: 6500,
    rainSpeed: 1.8,
    cameraSpeed: 1.8,
    bloomStrength: 0.9,
    fogDensity: 0.0014,
    backgroundColor: '#020503',
    cameraDrift: true,
  },
  Minimal: {
    cameraMode: 'Static',
    characterMode: 'binary',
    density: 2200,
    rainSpeed: 0.7,
    cameraSpeed: 0.3,
    bloomStrength: 0.3,
    fogDensity: 0.0025,
    backgroundColor: '#050505',
    cameraDrift: false,
  },
};

export const DEFAULT_SETTINGS: MatrixSettings = {
  enabled: true,
  preset: 'Ultra Cinematic',
  cameraMode: 'Fly Through',
  performanceLevel: 'auto',
  characterMode: 'binary',
  density: 6000,
  rainSpeed: 1.2,
  cameraSpeed: 1.5,
  cameraDepth: 2500,
  characterScale: 1.0,
  characterSpacing: 1.2,
  bloomStrength: 0.6,
  bloomThreshold: 0.4,
  glowIntensity: 0.8,
  fogDensity: 0.0015,
  fogColor: '#001a08',
  backgroundColor: '#020202',
  cameraFOV: 60,
  cameraDrift: true,
  autoPerformance: true,
};
