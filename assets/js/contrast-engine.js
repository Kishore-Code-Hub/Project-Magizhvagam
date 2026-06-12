/**
 * MAGIZHVAGAM — Automatic Contrast Protection
 * Ensures readable text/background pairs across themes and Appearance Studio.
 */
(function (global) {
  'use strict';

  function normalizeHex(hex) {
    if (!hex || typeof hex !== 'string') return null;
    let h = hex.trim();
    if (h.startsWith('rgb')) {
      const m = h.match(/\d+/g);
      if (!m || m.length < 3) return null;
      h = '#' + m.slice(0, 3).map(n => {
        const v = Math.min(255, parseInt(n, 10));
        return v.toString(16).padStart(2, '0');
      }).join('');
    }
    h = h.replace(/^#/, '');
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    if (h.length !== 6 || !/^[0-9a-fA-F]+$/.test(h)) return null;
    return '#' + h.toUpperCase();
  }

  function getLuminance(hex) {
    const normalized = normalizeHex(hex);
    if (!normalized) return 0.5;
    const raw = normalized.replace('#', '');
    const channels = [0, 2, 4].map(i => parseInt(raw.substr(i, 2), 16) / 255);
    const linear = channels.map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  }

  function getContrastRatio(fg, bg) {
    const l1 = getLuminance(fg);
    const l2 = getLuminance(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function isReadable(fg, bg, minRatio) {
    return getContrastRatio(fg, bg) >= (minRatio || 4.5);
  }

  function autoTextForBackground(bgHex) {
    const lum = getLuminance(bgHex);
    if (lum < 0.45) {
      return { primary: '#F5F0E8', muted: '#B8B0C8', inverse: '#0D0A14' };
    }
    return { primary: '#1A1523', muted: '#5A506A', inverse: '#F5F0E8' };
  }

  function ensureReadablePair(bgHex, textHex, minRatio) {
    const bg = normalizeHex(bgHex) || '#0D0A14';
    let text = normalizeHex(textHex);
    if (text && isReadable(text, bg, minRatio || 4.5)) {
      return { bg, text, ratio: getContrastRatio(text, bg), adjusted: false };
    }
    const auto = autoTextForBackground(bg);
    text = auto.primary;
    return { bg, text, ratio: getContrastRatio(text, bg), adjusted: true };
  }

  function validateThemePairings(pairs, minRatio) {
    const failures = [];
    pairs.forEach(({ label, fg, bg }) => {
      const ratio = getContrastRatio(fg, bg);
      if (ratio < (minRatio || 4.5)) {
        failures.push({ label, fg, bg, ratio });
      }
    });
    return { valid: failures.length === 0, failures };
  }

  global.MZContrast = {
    normalizeHex,
    getLuminance,
    getContrastRatio,
    isReadable,
    autoTextForBackground,
    ensureReadablePair,
    validateThemePairings
  };
})(typeof window !== 'undefined' ? window : global);
