import { MUSIC_PATH } from './constants';

export interface MusicManagerState {
  musicPath: string;
  audioSrc: string;
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
  autoplayBlocked: boolean;
}

class MusicManagerEngine {
  private audio: HTMLAudioElement | null = null;
  private isPlayingState: boolean = false;
  private isMutedState: boolean = false;
  private volumeState: number = 0.25; // Default 25% target volume
  private autoplayBlockedState: boolean = false;
  private listeners: Set<() => void> = new Set();
  private fadeAnimId: number | null = null;
  private gestureListenerAttached: boolean = false;
  private cleanupGestureListeners: (() => void) | null = null;

  constructor() {
    // Lazily initialized single audio engine
  }

  /**
   * Pre-buffers the audio file during boot without initiating playback
   */
  public init() {
    if (typeof window === 'undefined') return;

    if (!this.audio) {
      console.log('[MusicManager] Step 4: MusicManager.init() -> Instantiating HTMLAudioElement');
      const audio = new Audio();
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = this.isMutedState ? 0 : this.volumeState;
      audio.muted = this.isMutedState;

      const versionedSrc = `${MUSIC_PATH}?v=webmusic_v1`;
      audio.src = versionedSrc;

      audio.addEventListener('play', () => {
        this.isPlayingState = true;
        this.autoplayBlockedState = false;
        this.notifyListeners();
      });

      audio.addEventListener('pause', () => {
        this.isPlayingState = false;
        this.notifyListeners();
      });

      audio.addEventListener('error', (e) => {
        console.warn('[MusicManager] Audio playback error:', e);
        this.isPlayingState = false;
        this.notifyListeners();
      });

      this.audio = audio;
    }
  }

  /**
   * Smooth Cinematic Audio Fade-In Playback
   */
  public fadeInPlay(durationMs: number = 1500): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    this.init();

    const audio = this.audio;
    if (!audio) return Promise.resolve();

    if (this.isPlayingState && audio.volume > 0) {
      return Promise.resolve(); // Already playing smoothly
    }

    if (this.fadeAnimId) {
      cancelAnimationFrame(this.fadeAnimId);
      this.fadeAnimId = null;
    }

    const hasUserActivation = typeof navigator !== 'undefined' && (navigator as any).userActivation
      ? (navigator as any).userActivation.hasBeenActive
      : 'unknown';

    console.log(`[MusicManager] Step 5: MusicManager.fadeInPlay() invoked. UserActivation.hasBeenActive: ${hasUserActivation}`);

    const targetVol = this.isMutedState ? 0 : this.volumeState;
    audio.volume = 0; // Start at 0 for smooth fade-in

    console.log('[MusicManager] Step 6: Invoking audio.play() promise');

    return audio
      .play()
      .then(() => {
        console.log('✅ [MusicManager] Step 7: audio.play() RESOLVED successfully! Audio playback active.');
        this.isPlayingState = true;
        this.autoplayBlockedState = false;
        if (this.cleanupGestureListeners) {
          this.cleanupGestureListeners();
        }
        this.notifyListeners();

        // Perform smooth volume ramp from 0 to targetVol over durationMs
        const startTime = performance.now();

        const step = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / durationMs);

          if (this.audio && !this.isMutedState) {
            this.audio.volume = targetVol * progress;
          }

          if (progress < 1) {
            this.fadeAnimId = requestAnimationFrame(step);
          } else {
            if (this.audio && !this.isMutedState) {
              this.audio.volume = targetVol;
            }
            this.fadeAnimId = null;
          }
        };

        this.fadeAnimId = requestAnimationFrame(step);
      })
      .catch((err: Error) => {
        console.log(`ℹ️ [MusicManager] Step 7: audio.play() REJECTED by browser policy: ${err.name} - ${err.message}. Arming silent gesture fallback.`);
        this.autoplayBlockedState = true;
        this.isPlayingState = false;
        this.notifyListeners();
        this.setupAutoplayGestureListener(durationMs);
        return Promise.resolve();
      });
  }

  private setupAutoplayGestureListener(durationMs: number) {
    if (typeof window === 'undefined' || this.gestureListenerAttached) return;
    this.gestureListenerAttached = true;

    const handleFirstGesture = (e: Event) => {
      console.log(`[MusicManager] Trusted User Gesture Detected: ${e.type}. Starting audio playback.`);
      this.fadeInPlay(durationMs);
      cleanup();
    };

    const cleanup = () => {
      this.gestureListenerAttached = false;
      this.cleanupGestureListeners = null;
      window.removeEventListener('click', handleFirstGesture, true);
      window.removeEventListener('touchstart', handleFirstGesture, true);
      window.removeEventListener('keydown', handleFirstGesture, true);
      window.removeEventListener('pointerdown', handleFirstGesture, true);
      window.removeEventListener('scroll', handleFirstGesture, true);
    };

    this.cleanupGestureListeners = cleanup;

    window.addEventListener('click', handleFirstGesture, { capture: true, once: true });
    window.addEventListener('touchstart', handleFirstGesture, { capture: true, once: true });
    window.addEventListener('keydown', handleFirstGesture, { capture: true, once: true });
    window.addEventListener('pointerdown', handleFirstGesture, { capture: true, once: true });
    window.addEventListener('scroll', handleFirstGesture, { capture: true, once: true });
  }

  public play(): Promise<void> {
    return this.fadeInPlay(1000);
  }

  public pause() {
    if (this.fadeAnimId) {
      cancelAnimationFrame(this.fadeAnimId);
      this.fadeAnimId = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.isPlayingState = false;
      this.notifyListeners();
    }
  }

  public setMute(muted: boolean) {
    this.isMutedState = muted;
    if (this.audio) {
      this.audio.muted = muted;
      this.audio.volume = muted ? 0 : this.volumeState;
    }
    this.notifyListeners();
  }

  public toggleMute() {
    this.setMute(!this.isMutedState);
  }

  public getState(): MusicManagerState {
    return {
      musicPath: MUSIC_PATH,
      audioSrc: this.audio?.src || MUSIC_PATH,
      volume: this.volumeState,
      isMuted: this.isMutedState,
      isPlaying: this.isPlayingState,
      autoplayBlocked: this.autoplayBlockedState,
    };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
}

export const MusicManager = new MusicManagerEngine();
