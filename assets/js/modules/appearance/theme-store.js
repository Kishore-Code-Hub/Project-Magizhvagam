/**
 * Centralized ThemeStore — Appearance Studio State Management
 * Coordinates state distribution, debounces preview updates, and manages BroadcastChannel messaging.
 */
class ThemeStore {
  constructor() {
    this.state = null;
    this.listeners = [];
    this.debounceTimer = null;
    this.broadcastChannel = null;

    try {
      this.broadcastChannel = new BroadcastChannel('mz-theme-channel');
    } catch (e) {
      console.warn('[ThemeStore] BroadcastChannel not supported:', e);
    }
  }

  // Load settings from server database or cached state
  async load() {
    if (this.state) return this.state;
    try {
      const res = await adminFetch('/api/site-settings/theme');
      const data = await res.json();
      if (data.success && data.data) {
        this.state = data.data;
        return this.state;
      }
    } catch (err) {
      console.warn('[ThemeStore] Failed to fetch theme from DB:', err);
    }
    return null;
  }

  // Retrieve local state directly
  get() {
    return this.state;
  }

  // Update specific slice in state and broadcast
  update(updater) {
    if (!this.state) return;
    updater(this.state);
    this.broadcast();
  }

  // Dispatch current values to controllers and debounced postMessage previews
  broadcast() {
    if (!this.state) return;
    
    // 1. Notify local active workspace controllers
    this.listeners.forEach(cb => cb(this.state));

    // 2. Debounce postMessage updates to prevent preview lag on fast slider drags (16ms = ~1 frame)
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (typeof window.syncLivePreview === 'function') {
        window.syncLivePreview(this.state);
      }
    }, 16);
  }

  // Register state listeners
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Revert local modifications and reload from server DB
  async reload() {
    this.state = null;
    await this.load();
    this.broadcast();
  }

  // Reset theme settings back to system defaults
  async reset() {
    try {
      const res = await adminFetch('/api/settings/homepage/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        this.state = data.data;
        this.broadcast();
        return true;
      }
    } catch (err) {
      console.warn('[ThemeStore] Reset failed:', err);
    }
    return false;
  }

  // Persist current state values to database and trigger caches invalidation
  async save() {
    if (!this.state) return false;
    try {
      const res = await adminFetch('/api/site-settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state)
      });
      const data = await res.json();
      if (data.success) {
        // Clear local caches
        localStorage.removeItem('mz-theme-cache');
        localStorage.removeItem('mz-homepage-settings');
        localStorage.removeItem('mz-feature-toggles');

        // Broadcast to other storefront tabs using BroadCastChannel
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({ type: 'mz:theme-saved' });
        }

        window.MZAppearanceStudio.markClean();
        return true;
      }
    } catch (err) {
      console.warn('[ThemeStore] Save failed:', err);
    }
    return false;
  }

  destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.listeners = [];
  }
}

// Global Singleton Instance
window.MZThemeStore = new ThemeStore();
