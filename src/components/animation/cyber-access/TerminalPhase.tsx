'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Terminal, KeyRound } from 'lucide-react';

interface TerminalPhaseProps {
  onAuthorize: () => void;
  isAuthorizing: boolean;
  progress?: number;
  stageText?: string;
}

export default function TerminalPhase({
  onAuthorize,
  isAuthorizing,
  progress = 0,
  stageText = 'INITIALIZING_SYSTEM_KERNEL',
}: TerminalPhaseProps) {
  const [ipText, setIpText] = useState('192.168.██.██');
  const [relayText, setRelayText] = useState('TRACING ANONYMOUS RELAY...');

  // Rapid IP scramble morphing algorithm over 1.0s
  useEffect(() => {
    const scrambleFrames = [
      '192.168.██.██',
      '192.168.4.12',
      '192.168.32.78',
      '192.168.56.██',
      '192.168.56.89',
      '192.168.56.103',
    ];

    const relayFrames = [
      'TRACING ANONYMOUS RELAY...',
      'NODE: 10.0.4.1 -> 192.168.1.1',
      'RELAY: 192.168.56.0/24 ENCRYPTED',
      'TARGET: 192.168.56.103 (VERIFIED)',
    ];

    let frameIdx = 0;
    const interval = setInterval(() => {
      if (frameIdx < scrambleFrames.length) {
        setIpText(scrambleFrames[frameIdx]);
        setRelayText(relayFrames[Math.min(frameIdx, relayFrames.length - 1)]);
        frameIdx++;
      } else {
        clearInterval(interval);
      }
    }, 160);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-[92vw] sm:w-[min(900px,80vw)] max-w-[1000px] h-[420px] sm:h-[500px] p-6 sm:p-8 rounded-xl bg-[#030504]/95 border border-[#00ff66]/40 shadow-[0_0_80px_rgba(0,255,102,0.25)] backdrop-blur-xl text-left font-mono select-none flex flex-col justify-between overflow-hidden">
      {/* Scanline overlay pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 rounded-xl overflow-hidden z-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.3) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.05), rgba(0, 255, 0, 0.03), rgba(0, 0, 255, 0.05))',
          backgroundSize: '100% 4px, 6px 100%',
        }}
      />

      {/* Security Level Header Bar */}
      <div className="flex items-center justify-between border-b border-[#00ff66]/30 pb-4 text-xs text-[#00ff66] uppercase tracking-widest z-20">
        <span className="flex items-center gap-2.5 font-bold">
          <Shield className="w-4 h-4 text-[#00ff66] animate-pulse" />
          <span>CYBER OPERATIONS CENTER // AUTH GATEWAY</span>
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="hidden sm:inline text-gray-400">CLEARANCE: LEVEL 5</span>
          <span className="px-2 py-0.5 rounded bg-[#00ff66]/20 border border-[#00ff66]/40 text-[#00ff66] font-bold">
            CLASSIFIED
          </span>
        </div>
      </div>

      {/* Terminal Text Output Log Stream */}
      <div className="space-y-3.5 text-xs sm:text-sm text-emerald-400/90 font-mono z-20 my-auto overflow-y-auto max-h-[300px] scrollbar-none">
        <div className="text-[#00ff66] font-bold tracking-wide flex items-center gap-2 text-sm sm:text-base">
          <Terminal className="w-4 h-4 text-[#00f0ff]" />
          <span>SECURE GATEWAY ESTABLISHED // INC-9042</span>
        </div>

        <div className="text-gray-300 space-y-1.5 pl-4 border-l-2 border-[#00ff66]/40 text-xs sm:text-sm">
          <div className="text-gray-400">&gt; Scanning incoming endpoint connection...</div>
          <div className="text-[#00f0ff] font-semibold">&gt; {relayText}</div>
          <div className="text-amber-400 font-mono font-bold text-[11px]">
            &gt; STAGE: {stageText} [{progress}%]
          </div>
        </div>

        {/* Real Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-400">PRELOADER BUFFER STATUS</span>
            <span className="text-[#00ff66] font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/60 border border-[#00ff66]/30 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-[#00ff66] transition-all duration-300 ease-out shadow-[0_0_12px_#00ff66]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#00ff66]/20 text-xs">
          <div className="space-y-1">
            <span className="text-gray-500 block uppercase text-[10px] tracking-wider">DETECTED TARGET ENDPOINT</span>
            <span className="text-[#00f0ff] font-extrabold text-sm sm:text-base tracking-widest">
              {ipText}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-gray-500 block uppercase text-[10px] tracking-wider">SUBJECT IDENTITY & THREAT LEVEL</span>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-amber-400">IDENTITY: UNKNOWN</span>
              <span className="text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                THREAT: LOW
              </span>
            </div>
          </div>
        </div>

        <div className="pt-1 flex items-center gap-2 text-xs text-amber-300 font-semibold animate-pulse">
          <KeyRound className="w-3.5 h-3.5" />
          <span>{progress >= 100 ? 'ASSETS 100% DECODED. READY FOR OPERATOR AUTHORIZATION.' : 'PRELOADING & DECODING MEDIA MEMORY BUFFERS...'}</span>
        </div>
      </div>

      {/* Glowing Authorize Button & Keyboard Hints */}
      <div className="pt-4 border-t border-[#00ff66]/20 flex flex-col sm:flex-row items-center justify-between gap-3 z-20">
        <div className="text-[11px] text-gray-500 font-mono hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 rounded bg-black border border-gray-700 text-gray-300 text-[10px]">SPACE</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-black border border-gray-700 text-gray-300 text-[10px]">ENTER</kbd> to authorize
        </div>

        <button
          onClick={onAuthorize}
          disabled={isAuthorizing}
          className={`relative group px-8 py-3 rounded-lg text-xs sm:text-sm font-mono font-extrabold tracking-widest uppercase transition-all duration-300 w-full sm:w-auto ${
            isAuthorizing
              ? 'bg-[#00ff66]/30 text-[#00ff66] border border-[#00ff66] shadow-[0_0_40px_rgba(0,255,102,0.8)] scale-95'
              : 'bg-[#00ff66]/15 hover:bg-[#00ff66]/30 text-[#00ff66] border border-[#00ff66]/80 hover:border-[#00ff66] shadow-[0_0_25px_rgba(0,255,102,0.25)] hover:shadow-[0_0_45px_rgba(0,255,102,0.6)] active:scale-95 cursor-pointer'
          }`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>[ GRANT ACCESS ]</span>
            <span className="w-2 h-4 bg-[#00ff66] animate-pulse inline-block" />
          </span>
          <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00ff66]/0 via-[#00ff66]/30 to-[#00ff66]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </div>
  );
}
