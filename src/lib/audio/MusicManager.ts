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
  private volumeState: number = 0.25; // Default 25% volume
  private autoplayBlockedState: boolean = false;
  private listeners: Set<() => void> = new Set();
  private isInitialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      Promise.resolve().then(() => this.init());
    }
  }

  public init() {
    if (typeof window === 'undefined') return;

    if (!this.audio) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = this.volumeState;
      audio.muted = this.isMutedState;

      // Append version query parameter to ensure clean cache busting from old cached audio
      const versionedSrc = `${MUSIC_PATH}?v=webmusic_v1`;
      audio.src = versionedSrc;

      audio.addEventListener('play', () => {
        this.isPlayingState = true;
        this.autoplayBlockedState = false;
        this.logDebug('PLAY');
        this.notifyListeners();
      });

      audio.addEventListener('pause', () => {
        this.isPlayingState = false;
        this.logDebug('PAUSE');
        this.notifyListeners();
      });

      audio.addEventListener('error', (e) => {
        console.warn('[MusicManager] Audio element playback error:', e, 'src:', audio.src);
        this.isPlayingState = false;
        this.notifyListeners();
      });

      this.audio = audio;
    }

    if (!this.isInitialized) {
      this.isInitialized = true;
      this.play();
    }
  }

  public play(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    const audio = this.audio;
    if (!audio) return Promise.resolve();

    audio.volume = this.isMutedState ? 0 : this.volumeState;

    return audio
      .play()
      .then(() => {
        this.isPlayingState = true;
        this.autoplayBlockedState = false;
        this.logDebug('PLAY_SUCCESS');
        this.notifyListeners();
      })
      .catch((err) => {
        this.autoplayBlockedState = true;
        this.isPlayingState = false;
        this.logDebug('PLAY_BLOCKED');
        this.setupAutoplayGestureListener();
        this.notifyListeners();
        return Promise.reject(err);
      });
  }

  private setupAutoplayGestureListener() {
    if (typeof window === 'undefined') return;

    const handleFirstGesture = () => {
      if (this.audio) {
        this.audio.play().then(() => {
          this.autoplayBlockedState = false;
          this.logDebug('AUTOPLAY_UNLOCKED');
          this.notifyListeners();
        }).catch(() => {});
      }
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('scroll', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    window.addEventListener('scroll', handleFirstGesture, { once: true });
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlayingState = false;
      this.logDebug('PAUSED');
      this.notifyListeners();
    }
  }

  public setMute(muted: boolean) {
    this.isMutedState = muted;
    if (this.audio) {
      this.audio.muted = muted;
      this.audio.volume = muted ? 0 : this.volumeState;
    }
    this.logDebug('SET_MUTE');
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

  public logDebug(actionTag: string = 'STATE_CHECK') {
    const state = this.getState();
    console.log(`🎵 [MusicManager DEBUG:${actionTag}]`, {
      'Loaded Music Path': state.musicPath,
      'Current Audio Src': state.audioSrc,
      'Current Volume': `${Math.round(state.volume * 100)}%`,
      'Current Muted State': state.isMuted,
      'Current Playback State': state.isPlaying ? 'PLAYING' : 'PAUSED',
    });
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
