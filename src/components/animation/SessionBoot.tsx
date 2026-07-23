'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Shield, CheckCircle2, FastForward } from 'lucide-react';
import { CyberAudio } from '@/lib/CyberAudio';

export default function SessionBoot({ onComplete }: { onComplete: () => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const skipBoot = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('soc_session_booted', 'true');
    }
    setDone(true);
    onComplete();
  };

  useEffect(() => {
    // Check if session boot was already shown
    if (typeof window !== 'undefined') {
      const hasBooted = sessionStorage.getItem('soc_session_booted');
      if (hasBooted) {
        onComplete();
        return;
      }
    }

    const bootSequence = [
      '[1/6] Initializing SOC Cyber Workspace...',
      '[2/6] Loading AI Neural Subsystem & Engine...',
      '[3/6] Fetching 3D Photorealistic Workstation Assets...',
      '[4/6] Connecting PostgreSQL & Prisma Database...',
      '[5/6] Decrypting Operative Workspace Credentials...',
      '[6/6] System Integrity Check: 100% ONLINE. WELCOME BACK.',
    ];

    let currentStep = 0;
    CyberAudio.playBootChime(false);

    const interval = setInterval(() => {
      if (currentStep < bootSequence.length) {
        setLogs((prev) => [...prev, bootSequence[currentStep]]);
        CyberAudio.playKeyClick(false);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('soc_session_booted', 'true');
          }
          setDone(true);
          setTimeout(onComplete, 500);
        }, 400);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#030504] flex items-center justify-center p-4 font-mono select-none">
      <div className="max-w-xl w-full glass-panel p-6 border-accent/60 bg-[#040705] space-y-5 shadow-[0_0_60px_rgba(0,255,102,0.25)] relative">
        <div className="flex items-center justify-between border-b border-accent/30 pb-3 text-xs font-bold text-accent">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent animate-pulse" />
            <span>KISHORE SOC SYSTEM BOOT v4.0</span>
          </span>
          <button
            onClick={skipBoot}
            className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded bg-accent/15 border border-accent/40 text-accent hover:bg-accent hover:text-[#050505] transition-all font-bold"
          >
            <FastForward className="w-3 h-3" />
            <span>SKIP BOOT</span>
          </button>
        </div>

        <div className="h-60 overflow-y-auto space-y-2 text-xs text-emerald-400 font-mono">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-gray-500 text-[10px]">&gt;</span>
              <span className={idx === logs.length - 1 ? 'text-accent font-bold animate-pulse' : 'text-gray-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-accent/20 flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5 text-accent">
            <CheckCircle2 className="w-3.5 h-3.5" /> BOOT SEQUENCE IN PROGRESS
          </span>
          <span className="animate-pulse text-accent font-bold">PLEASE WAIT</span>
        </div>
      </div>
    </div>
  );
}
