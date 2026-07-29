'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Download, RefreshCw, X, ShieldAlert } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const FullscreenPWAControls: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isFullscreenSupported, setIsFullscreenSupported] = useState<boolean>(true);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState<boolean>(false);
  const [showIosPrompt, setShowIosPrompt] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    queueMicrotask(() => setPrefersReducedMotion(mediaQuery.matches));
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Check initial standalone mode, fullscreen support & status listeners
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    // Detect if launched in PWA standalone mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    queueMicrotask(() => {
      setIsStandalone(standaloneMode);
      if (standaloneMode) {
        setIsInstalled(true);
      }
    });

    const checkFullscreenSupport = () => {
      const enabled =
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled;

      setIsFullscreenSupported(Boolean(enabled));
    };

    checkFullscreenSupport();

    const handleFullscreenChange = () => {
      const currentFullscreen = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullscreen(currentFullscreen);

      if (currentFullscreen) {
        try {
          sessionStorage.setItem('fullscreen_accepted', 'true');
        } catch {
          // Fallback
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Handle Fullscreen Request (Explicit user click required by browser security)
  const toggleFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;

    try {
      const doc = document as any;
      const docEl = document.documentElement as any;

      const currentFullscreen = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!currentFullscreen) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle prevented or unsupported:', err);
    }
  }, []);

  // PWA Event Listeners & SW Registration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos && !isStandalone) {
      queueMicrotask(() => setShowIosPrompt(true));
    }

    // Register Service Worker strictly in production
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setSwUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('Service worker registration error:', err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  // Trigger PWA Installation
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const animProps = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.85, y: 8 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.85, y: 8 } };

  return (
    <>
      {/* Floating Cyber Controls Container (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-[9990] flex items-center gap-3 pointer-events-auto">
        {/* Service Worker Update Toast */}
        <AnimatePresence>
          {swUpdateAvailable && (
            <motion.div
              key="pwa-sw-update-toast"
              {...animProps}
              className="flex items-center gap-3 rounded-xl border border-[var(--accent-color)] bg-[rgba(5,5,5,0.92)] p-3 backdrop-blur-xl shadow-[0_0_20px_rgba(0,255,102,0.25)] text-white"
            >
              <RefreshCw className="h-4 w-4 text-[var(--accent-color)] animate-spin" />
              <div className="font-mono text-xs">
                <span className="font-bold text-[var(--accent-color)]">Update Ready</span>
              </div>
              <button
                onClick={handleReload}
                className="rounded-lg bg-[var(--accent-color)] px-2.5 py-1 font-mono text-xs font-bold text-black transition-all hover:brightness-110 focus:outline-none"
              >
                Refresh
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Install PWA Button */}
        <AnimatePresence>
          {isInstallable && !isInstalled && (
            <motion.button
              key="pwa-install-fab-button"
              {...animProps}
              onClick={handleInstallClick}
              className="group flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-[var(--accent-color)]/60 bg-[rgba(10,14,11,0.85)] text-[var(--accent-color)] backdrop-blur-xl shadow-[0_0_20px_rgba(0,255,102,0.2)] transition-all duration-300 hover:border-[var(--accent-color)] hover:bg-[rgba(0,255,102,0.15)] hover:shadow-[0_0_25px_rgba(0,255,102,0.4)] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50"
              title="Install Portfolio App"
              aria-label="Install Portfolio Application"
            >
              <Download className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:translate-y-0.5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Circular Fullscreen Toggle FAB (Hidden when running in standalone PWA mode) */}
        <AnimatePresence>
          {isFullscreenSupported && !isStandalone && (
            <motion.button
              key="fullscreen-toggle-fab-button"
              {...animProps}
              onClick={toggleFullscreen}
              className="group flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-[var(--border-accent)] bg-[rgba(10,14,11,0.85)] text-[var(--accent-color)] backdrop-blur-xl shadow-[0_0_20px_rgba(0,255,102,0.2)] transition-all duration-300 hover:border-[var(--accent-color)] hover:bg-[rgba(0,255,102,0.15)] hover:shadow-[0_0_25px_rgba(0,255,102,0.4)] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen Mode' : 'Enter Fullscreen Mode'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-90" />
              ) : (
                <Maximize2 className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-110" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Safari iOS Add to Home Screen Instructions Modal */}
      <AnimatePresence>
        {showIosPrompt && !isInstalled && (
          <motion.div
            key="pwa-ios-install-prompt-modal"
            {...animProps}
            className="fixed bottom-20 right-5 max-w-xs z-[9995] rounded-2xl border border-[var(--accent-color)]/40 bg-[rgba(5,5,5,0.95)] p-4 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4" />
                Add to Home Screen
              </div>
              <button
                onClick={() => setShowIosPrompt(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close iOS Install Prompt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 font-mono text-xs leading-relaxed text-gray-300">
              To install on iOS, tap <span className="font-bold text-white">Share</span> in Safari and select <span className="font-bold text-[var(--accent-color)]">Add to Home Screen</span>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
