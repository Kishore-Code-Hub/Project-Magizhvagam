'use client';

import { useContext } from 'react';
import { BootContext, BootState } from '@/contexts/BootContext';

export function useBoot(): BootState {
  const context = useContext(BootContext);
  if (!context) {
    throw new Error('useBoot must be used within a <BootProvider>');
  }
  return context;
}
