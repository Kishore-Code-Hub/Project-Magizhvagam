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
  opacity: number;            // 0.0 to 1.0 (Default 0.85)
  columnSpacing: number;      // Distance between stream columns in px (Default 32)
  density: number;            // Column density multiplier or count (Default 45)
  fontSize: number;           // Font size in px (Default 16)
  rainSpeed: number;          // Fall speed multiplier (Default 1.2)
  glowStrength: number;       // Shadow blur intensity in px (Default 6)
  trailLength: number;        // Number of trailing characters (Default 22)
  characterBrightness: number;// Brightness scale 0.5 to 1.5 (Default 1.0)
  randomSeed: number;         // Seed factor for generation (Default 42)
  backgroundDarkness: number; // Trail fade opacity 0.05 to 0.5 (Default 0.18)
  bloomStrength: number;      // Glow scale (Default 0.6)
  bloomThreshold: number;
  glowIntensity: number;
  fogDensity: number;
  fogColor: string;
  backgroundColor: string;    // Default #020202
  cameraFOV: number;
  cameraSpeed: number;
  cameraDepth: number;
  characterScale: number;
  characterSpacing: number;
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
    opacity: 0.9,
    columnSpacing: 32,
    density: 50,
    fontSize: 16,
    rainSpeed: 1.2,
    glowStrength: 8,
    trailLength: 24,
    characterBrightness: 1.1,
    backgroundDarkness: 0.18,
    bloomStrength: 0.6,
  },
  'Classic Matrix': {
    cameraMode: 'Cinematic',
    characterMode: 'katakana',
    opacity: 0.85,
    columnSpacing: 28,
    density: 60,
    fontSize: 18,
    rainSpeed: 1.4,
    glowStrength: 10,
    trailLength: 26,
    characterBrightness: 1.0,
    backgroundDarkness: 0.22,
    bloomStrength: 0.7,
  },
  'Cyber Tunnel': {
    cameraMode: 'Aggressive',
    characterMode: 'cyber',
    opacity: 0.95,
    columnSpacing: 24,
    density: 70,
    fontSize: 15,
    rainSpeed: 2.0,
    glowStrength: 12,
    trailLength: 30,
    characterBrightness: 1.2,
    backgroundDarkness: 0.15,
    bloomStrength: 0.85,
  },
  'Dark Web': {
    cameraMode: 'Fly Through',
    characterMode: 'hex',
    opacity: 0.7,
    columnSpacing: 40,
    density: 35,
    fontSize: 14,
    rainSpeed: 0.9,
    glowStrength: 4,
    trailLength: 18,
    characterBrightness: 0.8,
    backgroundDarkness: 0.25,
    bloomStrength: 0.4,
  },
  'Neon Hacker': {
    cameraMode: 'Cinematic',
    characterMode: 'mixed',
    opacity: 0.9,
    columnSpacing: 30,
    density: 55,
    fontSize: 17,
    rainSpeed: 1.6,
    glowStrength: 14,
    trailLength: 25,
    characterBrightness: 1.3,
    backgroundDarkness: 0.16,
    bloomStrength: 0.9,
  },
  Minimal: {
    cameraMode: 'Static',
    characterMode: 'binary',
    opacity: 0.5,
    columnSpacing: 48,
    density: 25,
    fontSize: 15,
    rainSpeed: 0.7,
    glowStrength: 3,
    trailLength: 14,
    characterBrightness: 0.7,
    backgroundDarkness: 0.3,
    bloomStrength: 0.3,
  },
};

export const DEFAULT_SETTINGS: MatrixSettings = {
  enabled: true,
  preset: 'Ultra Cinematic',
  cameraMode: 'Fly Through',
  performanceLevel: 'auto',
  characterMode: 'binary',
  opacity: 0.85,
  columnSpacing: 32,
  density: 45,
  fontSize: 16,
  rainSpeed: 1.2,
  glowStrength: 6,
  trailLength: 22,
  characterBrightness: 1.0,
  randomSeed: 42,
  backgroundDarkness: 0.18,
  bloomStrength: 0.6,
  bloomThreshold: 0.4,
  glowIntensity: 0.8,
  fogDensity: 0.0015,
  fogColor: '#001a08',
  backgroundColor: '#020202',
  cameraFOV: 60,
  cameraSpeed: 1.5,
  cameraDepth: 2500,
  characterScale: 1.0,
  characterSpacing: 1.2,
  cameraDrift: true,
  autoPerformance: true,
};
