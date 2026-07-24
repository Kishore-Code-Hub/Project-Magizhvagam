'use client';

import React, { useState, useEffect } from 'react';

interface TerminalPhaseProps {
  onAuthorize: () => void;
  isAuthorizing: boolean;
}

export default function TerminalPhase({ onAuthorize, isAuthorizing }: TerminalPhaseProps) {
  const [ipText, setIpText] = useState('192.168.█.██');
  const targetIp = '192.168.56.103';

  // Rapid IP scramble morphing algorithm (300ms)
  useEffect(() => {
    const scrambleFrames = [
      '192.168.█.██',
      '192.168.4.12',
      '192.168.32.78',
      '192.168.56.█',
      '192.168.56.89',
      '192.168.56.103',
    ];
    let frameIdx = 0;

    const interval = setInterval(() => {
      if (frameIdx < scrambleFrames.length) {
        setIpText(scrambleFrames[frameIdx]);
        frameIdx++;
      } else {
        clearInterval(interval);
      }
    }, 70);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg px-6 py-8 rounded-lg bg-[#030504]/90 border border-[#00ff66]/30 shadow-[0_0_50px_rgba(0,255,102,0.12)] backdrop-blur-md text-left font-mono select-none">
      {/* Scanline overlay pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 rounded-lg overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 4px, 6px 100%',
        }}
      />

      {/* Security Level Header */}
      <div className="flex items-center justify-between border-b border-[#00ff66]/20 pb-3 mb-5 text-[11px] text-[#00ff66]/70 uppercase tracking-widest">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-ping" />
          <span>CYBER OPS CENTER // AUTH NODE</span>
        </span>
        <span className="text-gray-500 font-semibold">SEC LEVEL 4</span>
      </div>

      {/* Terminal Text Output */}
      <div className="space-y-3.5 text-xs text-emerald-400/90 leading-relaxed font-mono">
        <div className="text-[#00ff66] font-semibold tracking-wide flex items-center gap-2">
          <span className="text-[#00f0ff]">&gt;</span> INCOMING CONNECTION ESTABLISHED
        </div>

        <div className="text-gray-400 space-y-1 pl-3 border-l border-[#00ff66]/20">
          <div>Authenticating Request...</div>
          <div>Locating Origin...</div>
        </div>

        <div className="pt-1">
          <div className="text-gray-400 text-[11px] uppercase tracking-wider">Detecting IP Address:</div>
          <div className="text-sm font-bold tracking-widest text-[#00f0ff] pt-0.5 transition-all">
            {ipText}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#00ff66]/15 text-[11px]">
          <div>
            <span className="text-gray-500 block uppercase">IDENTITY</span>
            <span className="text-amber-400 font-bold tracking-wider">UNKNOWN</span>
          </div>
          <div>
            <span className="text-gray-500 block uppercase">STATUS</span>
            <span className="text-[#00ff66] font-bold tracking-wider animate-pulse">
              ACCESS AWAITING AUTHORIZATION
            </span>
          </div>
        </div>
      </div>

      {/* Glowing Authorize Button */}
      <div className="mt-7 flex justify-center">
        <button
          onClick={onAuthorize}
          disabled={isAuthorizing}
          className={`relative group px-7 py-3 rounded text-xs font-mono font-bold tracking-widest uppercase transition-all duration-300 ${
            isAuthorizing
              ? 'bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66] shadow-[0_0_30px_rgba(0,255,102,0.6)] scale-95'
              : 'bg-[#00ff66]/10 hover:bg-[#00ff66]/25 text-[#00ff66] border border-[#00ff66]/60 hover:border-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.2)] hover:shadow-[0_0_35px_rgba(0,255,102,0.5)] active:scale-95 cursor-pointer'
          }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <span>[ GRANT ACCESS ]</span>
            <span className="w-1.5 h-3 bg-[#00ff66] animate-pulse inline-block" />
          </span>
          <span className="absolute inset-0 rounded bg-gradient-to-r from-[#00ff66]/0 via-[#00ff66]/20 to-[#00ff66]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </div>
  );
}
