import { BootConfig } from './BootConfig';
import { AssetPreloader, PreloadProgress } from '@/lib/preload/AssetPreloader';
import { MusicManager } from '@/lib/audio/MusicManager';

export type BootState =
  | 'IDLE'
  | 'TRACE'
  | 'AUTHORIZE'
  | 'DISSOLVE'
  | 'BEAM'
  | 'RING'
  | 'SHUTTER'
  | 'REVEAL'
  | 'COMPLETE';

export type BootListener = (state: BootState, progress: number, stageText: string) => void;
export type BootCompleteListener = () => void;

class BootControllerEngine {
  private state: BootState = 'IDLE';
  private progress: number = 0;
  private stageText: string = 'INITIALIZING_SYSTEM_KERNEL';
  private listeners: Set<BootListener> = new Set();
  private completeListeners: Set<BootCompleteListener> = new Set();

  private isStarted: boolean = false;
  private isCompleted: boolean = false;
  private activeTimer: any = null;

  // Timings
  public loadingDuration: number = BootConfig.timing.loadingDuration;
  public accessGrantedHoldTime: number = BootConfig.timing.accessGrantedHoldTime;
  public welcomeScreenHoldTime: number = BootConfig.timing.welcomeScreenHoldTime;
  public bootMsgOffsetX: number = 0;
  public bootMsgOffsetY: number = -40;

  constructor() {
    // Single instance initialized lazily
  }

  public getState(): BootState {
    return this.state;
  }

  public getProgress(): number {
    return this.progress;
  }

  public getStageText(): string {
    return this.stageText;
  }

  public isComplete(): boolean {
    return this.isCompleted;
  }

  public subscribe(listener: BootListener): () => void {
    this.listeners.add(listener);
    listener(this.state, this.progress, this.stageText);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onComplete(listener: BootCompleteListener): () => void {
    if (this.isCompleted) {
      listener();
      return () => {};
    }
    this.completeListeners.add(listener);
    return () => {
      this.completeListeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state, this.progress, this.stageText);
      } catch (err) {
        console.error('[BootController] Listener error:', err);
      }
    }
  }

  private setState(newState: BootState, progress?: number, stageText?: string) {
    if (this.state === newState && progress === undefined && stageText === undefined) return;
    this.state = newState;
    if (progress !== undefined) this.progress = progress;
    if (stageText !== undefined) this.stageText = stageText;

    console.log(`[BootAudit] Step 2: Boot Phase Transition -> ${newState}`);
    this.notify();

    if (newState === 'COMPLETE' && !this.isCompleted) {
      this.isCompleted = true;
      console.log('[BootAudit] Step 3: BOOT_COMPLETED Event Dispatched');
      for (const completeListener of this.completeListeners) {
        try {
          completeListener();
        } catch (err) {
          console.error('[BootController] Complete listener error:', err);
        }
      }
      this.completeListeners.clear();
    }
  }

  public async start(): Promise<void> {
    if (this.isStarted || this.isCompleted) return;
    this.isStarted = true;
    console.log('[BootAudit] Step 1: Boot Start -> Initializing pre-React Boot Controller Engine');

    // Fetch optional CMS appearance timing parameters asynchronously (non-blocking)
    this.fetchCMSTiming();

    // Begin Phase 1: TRACE
    this.setState('TRACE', 10, 'INITIALIZING_SYSTEM_KERNEL');

    // Preload critical assets strictly
    let assetReady = false;
    let timerReady = false;

    const phaseDurationMs = Math.max(1200, Math.round(this.loadingDuration * 1000 * 0.45));

    this.activeTimer = setTimeout(() => {
      timerReady = true;
      if (assetReady) {
        this.advanceToAuthorize();
      }
    }, phaseDurationMs);

    AssetPreloader.preloadTier1((p: PreloadProgress) => {
      this.progress = p.percent;
      this.stageText = p.stage;
      if (p.cmsPayload?.loadingDuration) {
        this.loadingDuration = p.cmsPayload.loadingDuration;
      }
      this.notify();

      if (p.percent >= 100) {
        assetReady = true;
        if (timerReady) {
          this.advanceToAuthorize();
        }
      }
    }).catch(() => {
      assetReady = true;
      if (timerReady) {
        this.advanceToAuthorize();
      }
    });
  }

  private fetchCMSTiming() {
    if (typeof window === 'undefined') return;
    fetch('/api/appearance')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (typeof data.loadingDuration === 'number') this.loadingDuration = data.loadingDuration;
          if (typeof data.accessGrantedHoldTime === 'number') this.accessGrantedHoldTime = data.accessGrantedHoldTime;
          if (typeof data.welcomeScreenHoldTime === 'number') this.welcomeScreenHoldTime = data.welcomeScreenHoldTime;
          if (typeof data.bootMsgOffsetX === 'number') this.bootMsgOffsetX = data.bootMsgOffsetX;
          if (typeof data.bootMsgOffsetY === 'number') this.bootMsgOffsetY = data.bootMsgOffsetY;
        }
      })
      .catch(() => {});
  }

  public triggerAuthorize() {
    if (this.state !== 'TRACE') return;
    this.advanceToAuthorize();
  }

  private advanceToAuthorize() {
    if (this.activeTimer) clearTimeout(this.activeTimer);
    if (this.state !== 'TRACE') return;

    this.setState('AUTHORIZE', 85, 'SECURITY_AUTHORIZATION');

    const authDuration = Math.max(400, Math.round(this.loadingDuration * 1000 * 0.15));
    this.activeTimer = setTimeout(() => {
      this.runHoldSequence();
    }, authDuration);
  }

  private runHoldSequence() {
    const holdStepMs = Math.max(200, Math.round((this.accessGrantedHoldTime * 1000) / 3));

    this.setState('DISSOLVE', 90, 'SYSTEM_DISSOLVING');

    this.activeTimer = setTimeout(() => {
      this.setState('BEAM', 95, 'QUANTUM_BEAM_FOCUS');
      this.activeTimer = setTimeout(() => {
        this.setState('RING', 98, 'SYSTEM_RING_VERIFIED');
        this.activeTimer = setTimeout(() => {
          this.runShutterReveal();
        }, holdStepMs);
      }, holdStepMs);
    }, holdStepMs);
  }

  private runShutterReveal() {
    const welcomeMs = Math.max(400, Math.round(this.welcomeScreenHoldTime * 1000));
    this.setState('SHUTTER', 100, 'SECURITY_CLEARANCE_GRANTED');

    this.activeTimer = setTimeout(() => {
      this.setState('REVEAL', 100, 'SYSTEM_REVEAL');
      const revealMs = 450;
      this.activeTimer = setTimeout(() => {
        this.setState('COMPLETE', 100, 'SYSTEM_READY');
      }, revealMs);
    }, welcomeMs);
  }

  public skip() {
    if (this.isCompleted) return;
    console.log('[BootController] Intentional Skip triggered via user activation');
    if (this.activeTimer) clearTimeout(this.activeTimer);
    this.setState('SHUTTER', 100, 'SKIPPED');
    setTimeout(() => {
      this.setState('REVEAL', 100, 'SKIPPED');
      setTimeout(() => {
        this.setState('COMPLETE', 100, 'SYSTEM_READY');
      }, 200);
    }, 100);
  }

  public handleUserInteraction(e: { type: string; key?: string; target?: any }): boolean {
    if (!BootConfig.skip.allowSkip || this.isCompleted) return false;

    // Filter pointer interaction
    if (e.type === 'click' || e.type === 'touchstart') {
      const target = e.target as HTMLElement;
      if (target && target.closest('button')) return false;
      // Trigger audio fade-in immediately within active user gesture context
      MusicManager.fadeInPlay(1500);
      this.skip();
      return true;
    }

    // Filter keyboard interaction: restrict strictly to Enter, Space
    if (e.type === 'keydown' && e.key) {
      if (BootConfig.skip.allowedKeys.includes(e.key)) {
        // Trigger audio fade-in immediately within active user gesture context
        MusicManager.fadeInPlay(1500);
        this.skip();
        return true;
      }
    }

    return false;
  }

  public reset(): void {
    if (this.activeTimer) clearTimeout(this.activeTimer);
    this.isStarted = false;
    this.isCompleted = false;
    this.state = 'IDLE';
    this.progress = 0;
    this.stageText = 'INITIALIZING_SYSTEM_KERNEL';
    this.notify();
  }
}

export const BootController = new BootControllerEngine();
