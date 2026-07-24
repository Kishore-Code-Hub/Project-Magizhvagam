export type CyberAccessState =
  | 'IDLE'
  | 'TRACE'         // Phase 1: Authentic SOC terminal trace & IP scramble digit morph (650ms)
  | 'AUTHORIZE'     // Phase 2: Pulse [ GRANT ACCESS ] button active & trigger freeze (150ms)
  | 'DISSOLVE'      // Phase 3: Text disintegration into 400+ floating digital dust particles (120ms)
  | 'BEAM'          // Phase 4: High-speed 2px white-hot laser trace + center shockwave (220ms)
  | 'RING'          // Phase 5: Precision segmented arc 360° vault unlock rotation + sparks (350ms)
  | 'RELEASE'       // Phase 6: Horizontal energy line spanning screen width + 100ms hold (180ms)
  | 'SHUTTER'       // Phase 7: Split vertical shutter doors + 80ms AAA bloom, camera shake (420ms)
  | 'REVEAL'        // Phase 8: Exposed active portfolio + top-right ACCESS GRANTED ✓ HUD toast (500ms)
  | 'COMPLETE';     // Unmount overlay

export interface CyberAccessConfig {
  reducedMotion: boolean;
  isMobile: boolean;
}
