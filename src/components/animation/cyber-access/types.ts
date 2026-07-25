export type CyberAccessState =
  | 'IDLE'
  | 'TRACE'         // Phase 1: SOC terminal trace & IP scramble digit morph
  | 'AUTHORIZE'     // Phase 2: Pulse [ GRANT ACCESS ] button active & trigger freeze
  | 'DISSOLVE'      // Phase 3: Text disintegration into floating digital dust particles
  | 'BEAM'          // Phase 4: High-speed multi-layer laser trace + center shockwave
  | 'RING'          // Phase 5: Mechanical 360° vault unlock rotation + sparks & ticks
  | 'RELEASE'       // Phase 6: Horizontal energy line expansion across screen width
  | 'SHUTTER'       // Phase 7: Split vertical shutter doors + 80ms lens flash + "WELCOME, KISHORE" HUD
  | 'REVEAL'        // Phase 8: Revealed active portfolio + top-right ACCESS GRANTED ✓ HUD toast
  | 'COMPLETE';     // Unmount overlay

export interface CyberAccessMetrics {
  fps: number;
  avgFps: number;
  frameCount: number;
  elapsedTimeMs: number;
  phaseTimeMs: number;
  rafId: number | null;
  activeTimersCount: number;
  audioNodesCount: number;
  canvasCount: number;
  particleCount: number;
  beamProgressPct: number;
  ringProgressPct: number;
  shutterProgressPct: number;
  memoryMb?: number;
  windowDimensions: { width: number; height: number };
}

export interface CyberAccessConfig {
  reducedMotion: boolean;
  isMobile: boolean;
  debugMode: boolean;
  timingMode: 'NORMAL' | 'DEBUG';
}

export interface CyberBootConsoleAPI {
  start: () => void;
  restart: () => void;
  skip: () => void;
  debug: () => void;
  reset: () => void;
  state: () => CyberAccessState;
  stats: () => CyberAccessMetrics;
}

declare global {
  interface Window {
    __CYBER_BOOT_RUNNING__?: boolean;
    CyberBoot?: CyberBootConsoleAPI;
  }
}

