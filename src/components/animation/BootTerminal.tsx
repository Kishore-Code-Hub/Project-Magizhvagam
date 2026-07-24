'use client';

import React from 'react';
import SessionBoot from './SessionBoot';

export default function BootTerminal({ onComplete }: { onComplete?: () => void }) {
  return <SessionBoot onComplete={onComplete} />;
}
