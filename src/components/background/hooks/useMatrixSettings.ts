'use client';

import { useState, useEffect } from 'react';
import {
  MatrixSettings,
  DEFAULT_SETTINGS,
  PRESETS,
  MatrixPreset,
  PerformanceLevel,
} from '../store/matrixStore';

const STORAGE_KEY = 'hk_matrix_settings';

export function useMatrixSettings() {
  const [settings, setSettings] = useState<MatrixSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings({
            ...DEFAULT_SETTINGS,
            ...parsed,
            opacity: typeof parsed.opacity === 'number' && parsed.opacity > 0 ? parsed.opacity : DEFAULT_SETTINGS.opacity,
            enabled: parsed.enabled !== false,
          });
        }
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();

    const handleStorageChange = () => loadSettings();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('matrix_settings_change', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('matrix_settings_change', handleStorageChange);
    };
  }, []);

  const updateSettings = (updates: Partial<MatrixSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('matrix_settings_change'));
      } catch {
        // LocalStorage save ignore error
      }
      return next;
    });
  };

  const applyPreset = (presetName: MatrixPreset) => {
    const presetOverrides = PRESETS[presetName];
    if (presetOverrides) {
      updateSettings({
        preset: presetName,
        ...presetOverrides,
      });
    }
  };

  const setPerformanceLevel = (level: PerformanceLevel) => {
    let density = settings.density;
    if (level === 'Ultra') density = 8000;
    else if (level === 'High') density = 6000;
    else if (level === 'Medium') density = 4500;
    else if (level === 'Low') density = 1800;

    updateSettings({
      performanceLevel: level,
      density,
    });
  };

  return {
    settings,
    isLoaded,
    updateSettings,
    applyPreset,
    setPerformanceLevel,
  };
}
