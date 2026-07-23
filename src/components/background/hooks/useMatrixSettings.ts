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
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Fallback to default settings
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateSettings = (updates: Partial<MatrixSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
