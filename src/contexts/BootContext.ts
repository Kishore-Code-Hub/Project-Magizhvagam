'use client';

import { createContext } from 'react';
import { CMSInitialPayload } from '@/lib/preload/ThemeLoader';

export interface BootState {
  progress: number;
  stage: string;
  isComplete: boolean;
  isPreloaded: boolean;
  cmsPayload: CMSInitialPayload | null;
  loadingDuration: number;
  skipBoot: () => void;
  retriggerBoot: () => void;
}

export const BootContext = createContext<BootState>({
  progress: 0,
  stage: 'INITIALIZING',
  isComplete: false,
  isPreloaded: false,
  cmsPayload: null,
  loadingDuration: 5.0,
  skipBoot: () => {},
  retriggerBoot: () => {},
});
