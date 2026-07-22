'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AccentTheme = 'cyber-green';

export type PerformanceLevel = 'high' | 'medium' | 'low' | 'auto';

interface ThemeContextType {
  theme: AccentTheme;
  performanceLevel: PerformanceLevel;
  setPerformanceLevel: (level: PerformanceLevel) => void;
  audioMuted: boolean;
  setAudioMuted: (muted: boolean) => void;
  toggleAudio: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<AccentTheme>('cyber-green');
  const [performanceLevel, setPerformanceLevelState] = useState<PerformanceLevel>('auto');
  const [audioMuted, setAudioMuted] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedPerf = localStorage.getItem('soc_performance_level') as PerformanceLevel | null;
    if (storedPerf) {
      setPerformanceLevelState(storedPerf);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.add('theme-cyber-green');
  }, [mounted]);

  const setPerformanceLevel = (level: PerformanceLevel) => {
    setPerformanceLevelState(level);
    localStorage.setItem('soc_performance_level', level);
  };

  const toggleAudio = () => {
    setAudioMuted((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        performanceLevel,
        setPerformanceLevel,
        audioMuted,
        setAudioMuted,
        toggleAudio,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
