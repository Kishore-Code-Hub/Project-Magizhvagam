'use client';

import React, { useEffect } from 'react';
import CyberAccessSequence from './cyber-access/CyberAccessSequence';

export default function SessionBoot({ onComplete }: { onComplete?: () => void }) {
  useEffect(() => {
    console.log('[SessionBoot] Component Mounted');
    return () => {
      console.log('[SessionBoot] Component Unmounted');
    };
  }, []);

  return <CyberAccessSequence onComplete={onComplete} />;
}

