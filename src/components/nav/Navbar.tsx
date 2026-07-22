'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ExternalLink } from 'lucide-react';

interface NavbarProps {
  resumeUrl?: string;
}

export default function Navbar({ resumeUrl = 'https://drive.google.com' }: NavbarProps) {
  const safeResumeUrl = resumeUrl || 'https://drive.google.com';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-4 md:px-8 py-3.5 bg-[#050505]/75 backdrop-blur-xl border-b border-accent/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="#hero" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/40 flex items-center justify-center group-hover:border-accent group-hover:scale-105 transition-all">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div className="flex flex-col font-mono">
            <span className="text-base font-extrabold tracking-wider text-white uppercase">
              KISHORE
            </span>
            <span className="text-[9px] uppercase tracking-widest text-accent font-semibold">
              CYBERSECURITY WORKSTATION
            </span>
          </div>
        </Link>

        {/* Resume Button */}
        <div className="flex items-center gap-3 font-mono">
          <a
            href={safeResumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-accent text-[#050505] shadow-lg shadow-accent/20 hover:bg-white transition-all transform hover:-translate-y-0.5"
          >
            <span>RESUME</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
