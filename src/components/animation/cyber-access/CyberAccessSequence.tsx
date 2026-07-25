'use client';

import React from 'react';
import { useCyberAccessStateMachine } from './useCyberAccessStateMachine';
import TerminalPhase from './TerminalPhase';
import FallbackBoundary from './FallbackBoundary';
import { FastForward, Terminal } from 'lucide-react';

interface CyberAccessSequenceProps {
  onComplete?: () => void;
}

function SequenceInner({ onComplete }: CyberAccessSequenceProps) {
  const { state, isMobile, progress, stageText, triggerAuthorize, skipSequence } = useCyberAccessStateMachine(onComplete);

  if (state === 'COMPLETE') {
    return null;
  }

  const showTerminal = state === 'TRACE' || state === 'AUTHORIZE';

  return (
    <div
      id="cyber-access-overlay"
      data-cyber-state={state}
      className="fixed inset-0 z-50 overflow-hidden select-none bg-[#030303] flex items-center justify-center p-4 transition-opacity duration-700"
    >
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-radial from-[#00ff66]/10 via-transparent to-black pointer-events-none" />

      {/* Top-Right SKIP Button */}
      <div className="absolute top-5 right-6 z-50">
        <button
          onClick={skipSequence}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00ff66]/10 border border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/20 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)] active:scale-95 cursor-pointer"
        >
          <span>SKIP</span>
          <FastForward className="w-3.5 h-3.5 text-[#00f0ff]" />
        </button>
      </div>

      {/* State Badge */}
      <div className="absolute top-5 left-6 z-50 font-mono text-[10px] text-[#00ff66]/80 bg-black/80 px-2.5 py-1 rounded border border-[#00ff66]/30 pointer-events-none flex items-center gap-2">
        <Terminal className="w-3 h-3 text-[#00ff66] animate-pulse" />
        <span>CYBER BOOTLOADER // <span className="text-[#00f0ff] font-bold">{stageText}</span></span>
      </div>

      {/* Phase 1: SOC Terminal Trace & Grant Access Button */}
      {showTerminal && (
        <TerminalPhase
          onAuthorize={triggerAuthorize}
          isAuthorizing={state === 'AUTHORIZE'}
          progress={progress}
          stageText={stageText}
        />
      )}
    </div>
  );
}

export default function CyberAccessSequence(props: CyberAccessSequenceProps) {
  return (
    <FallbackBoundary onFallback={() => props.onComplete?.()}>
      <SequenceInner {...props} />
    </FallbackBoundary>
  );
}
