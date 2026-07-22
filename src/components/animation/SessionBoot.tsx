'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Shield, CheckCircle2 } from 'lucide-react';
import { CyberAudio } from '@/lib/CyberAudio';

export default function SessionBoot({ onComplete }: { onComplete: () => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);

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
      '[ BIOS POST v3.6 ] Initializing SOC Hardware Workstation...',
      '[ MEMORY OK ] 64GB DDR5 ECC RAM Verified',
      '[ SECURITY ] Secure Boot: ACTIVE | TPM 2.0 Connected',
      '[ KERNEL ] Loading Linux SOC Kernel v6.8.0-kali1...',
      '[ MOUNT ] Mounting Encrypted Filesystem /dev/nvme0n1p2...',
      '[ NETWORK ] Interface eth0 UP - IPv4 192.168.1.1 (ENCRYPTED)',
      '[ SYSTEM ] Starting Docker Daemon & FastAPI SOC Engines...',
      '[ PRISMA ] Connecting to Database Instance... OK',
      '[ AUTH ] Verifying JWT Authorization Subsystem... PASSED',
      '[ SOC OS ] System Integrity Check: 100% ONLINE',
      '>> PORTFOLIO WORKSTATION READY. LAUNCHING SOC WORKSTATION...',
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
          setTimeout(onComplete, 600);
        }, 500);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#030504] flex items-center justify-center p-4 font-mono select-none">
      <div className="max-w-xl w-full glass-panel p-6 border-accent/60 bg-[#050806] space-y-4 shadow-[0_0_60px_rgba(0,255,102,0.25)]">
        <div className="flex items-center justify-between border-b border-accent/30 pb-3 text-xs font-bold text-accent">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent animate-pulse" />
            <span>KISHORE SOC SYSTEM BOOT v3.6</span>
          </span>
          <span className="text-[10px] text-gray-400">INITIALIZING...</span>
        </div>

        <div className="h-64 overflow-y-auto space-y-1.5 text-xs text-emerald-400 font-mono scrollbar-none">
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
