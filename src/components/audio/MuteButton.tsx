'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useMusic } from '@/lib/audio/useMusic';

export default function MuteButton() {
  const { isMuted, toggleMute } = useMusic();
  const pathname = usePathname();

  // Hide on admin/auth pages
  const isAuthOrAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/login');
  if (isAuthOrAdminPage) {
    return null;
  }

  return (
    <button
      onClick={toggleMute}
      className="fixed top-4 right-4 sm:top-5 sm:right-6 z-50 p-2 rounded-full bg-black/80 border border-[#00FF66]/40 text-[#00FF66] hover:bg-[#00FF66]/20 transition-all shadow-[0_0_15px_rgba(0,255,102,0.3)] active:scale-95 cursor-pointer text-base sm:text-lg leading-none flex items-center justify-center select-none"
    >
      {isMuted ? '🔇' : '🔊'}
    </button>
  );
}
