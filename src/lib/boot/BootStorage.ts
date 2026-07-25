'use client';

/**
 * Centralized BootStorage Utility
 * Single source of truth for session boot storage operations.
 */
export const BootStorage = {
  isBooted: (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem('soc_session_booted') === 'true';
    } catch {
      return false;
    }
  },

  setBooted: (): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('soc_session_booted', 'true');
    } catch {
      // ignore storage errors
    }
  },

  clearBoot: (): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem('soc_session_booted');
    } catch {
      // ignore storage errors
    }
  },
};
