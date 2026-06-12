/**
 * MAGIZHVAGAM V4 — Animation Loader
 * 
 * Reads animation config from API, sets data-mz-* attributes on <html>,
 * and applies preset-based animation timing.
 * Respects prefers-reduced-motion at all times.
 */

(function() {
  'use strict';

  // Preset timing multipliers
  const PRESET_SPEEDS = {
    subtle: 0.5,
    elevated: 1.0,
    expressive: 1.5,
    none: 0
  };

  function applyAnimationConfig(config) {
    if (!config) return;

    const html = document.documentElement;

    // Set preset
    const preset = config.preset || 'elevated';
    html.setAttribute('data-mz-anim', preset);

    // Set speed multiplier
    const speed = PRESET_SPEEDS[preset] || 1.0;
    html.style.setProperty('--layout-animation-speed', speed);

    // Set per-control overrides
    const overrides = config.overrides || {};
    if (overrides.cardHover) html.setAttribute('data-mz-card-hover', overrides.cardHover);
    if (overrides.btnClick) html.setAttribute('data-mz-btn-click', overrides.btnClick);
    if (overrides.pageEntrance) html.setAttribute('data-mz-page-entrance', overrides.pageEntrance);
    if (overrides.scrollReveal !== undefined) html.setAttribute('data-mz-scroll-reveal', overrides.scrollReveal ? 'true' : 'false');
    if (overrides.countdownTick) html.setAttribute('data-mz-countdown-tick', overrides.countdownTick);
    if (overrides.skeletonShimmer) html.setAttribute('data-mz-skeleton-shimmer', overrides.skeletonShimmer);

    // Reduced motion — always enforced, cannot be disabled by admin
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      html.setAttribute('data-mz-anim', 'none');
      html.style.setProperty('--layout-animation-speed', '0');
    }
  }

  async function loadAnimationConfig() {
    try {
      const res = await fetch('/api/site-settings/animation');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        applyAnimationConfig(json.data);
      }
    } catch (err) {
      // Default to elevated preset
      applyAnimationConfig({ preset: 'elevated', overrides: { cardHover: 'lift', scrollReveal: true } });
    }
  }

  // Listen for reduced motion changes
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.setAttribute('data-mz-anim', 'none');
      document.documentElement.style.setProperty('--layout-animation-speed', '0');
    } else {
      loadAnimationConfig(); // Re-apply from config
    }
  });

  // Listen for live updates
  window.addEventListener('mz:animation-updated', function() {
    loadAnimationConfig();
  });

  // Load on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAnimationConfig);
  } else {
    loadAnimationConfig();
  }

  window.__mzAnimLoader = { reload: loadAnimationConfig };
})();
