/**
 * BootConfig.ts
 * Single source of truth for boot sequence configuration, timings, assets, and skip parameters.
 */
export const BootConfig = {
  // Timing parameters (seconds)
  timing: {
    loadingDuration: 1.8,
    accessGrantedHoldTime: 0.5,
    welcomeScreenHoldTime: 0.6,
    shutterRevealDuration: 0.45,
    titleTypingSpeedMs: 20,
    lineTypingSpeedMs: 12,
    linePauseMs: 80,
  },

  // Skip Interaction Settings
  skip: {
    allowSkip: true,
    // Allowed keyboard keys for skip action
    allowedKeys: ['Enter', ' ', 'Spacebar'],
    // Allowed pointer interactions
    allowedPointer: true,
  },

  // Critical Assets Manifest (Preloaded before boot completes)
  criticalAssets: {
    heroImage: '/Hero-section-banner.webp',
    profileImage: '/hero-hacker.png',
    musicPath: '/uploads/music/webmusic.mp3',
    fonts: ['--font-sans', '--font-mono'],
  },

  // Replay Policy
  replayOnRefresh: true,
};
