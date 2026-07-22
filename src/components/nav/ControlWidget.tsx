'use client';

import React from 'react';
import { ExternalLink, Shield } from 'lucide-react';

interface ControlWidgetProps {
  resumeUrl?: string;
}

export default function ControlWidget({ resumeUrl = 'https://drive.google.com' }: ControlWidgetProps) {
  const safeResumeUrl = resumeUrl || 'https://drive.google.com';

  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 font-mono select-none">
      {/* Brand Badge Widget */}
      <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl glass-panel border-accent/40 bg-[#050505]/90 backdrop-blur-xl text-xs">
        <Shield className="w-4 h-4 text-accent" />
        <span className="font-bold text-white uppercase">KISHORE</span>
        <span className="text-[9px] text-accent uppercase font-bold">// SOC OS v3.6</span>
      </div>

      {/* Resume Button */}
      <a
        href={safeResumeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold rounded-xl bg-accent text-[#050505] shadow-lg shadow-accent/20 hover:bg-white transition-all transform hover:-translate-y-0.5"
      >
        <span>RESUME</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
