'use client';

import React, { useEffect } from 'react';
import { useCyberAccessStateMachine } from './useCyberAccessStateMachine';
import TerminalPhase from './TerminalPhase';
import QuantumShutter from './QuantumShutter';
import FallbackBoundary from './FallbackBoundary';
import { FastForward, Terminal } from 'lucide-react';

interface CyberAccessSequenceProps {
  onComplete?: () => void;
}

function SequenceInner({ onComplete }: CyberAccessSequenceProps) {
  const {
    state,
    progress,
    stageText,
    elapsedTime,
    phaseTimer,
    remainingTime,
    triggerAuthorize,
    skipSequence,
  } = useCyberAccessStateMachine(onComplete);

  // Keyboard shortcut listener: ESC to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipSequence();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skipSequence]);

  if (state === 'COMPLETE') {
    return null;
  }

  const showTerminal = state === 'TRACE' || state === 'AUTHORIZE';

  return (
    <>
      <div
        id="cyber-access-overlay"
        data-cyber-state={state}
        className={`fixed inset-0 z-50 overflow-hidden select-none bg-[#030303] flex items-center justify-center p-4 transition-opacity duration-700 ${
          state === 'SHUTTER' || state === 'REVEAL' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Background ambient glow */}
        <div className="absolute inset-0 bg-radial from-[#00ff66]/10 via-transparent to-black pointer-events-none" />

        {/* Top-Right SKIP Button */}
        <div className="absolute top-5 right-6 z-50">
          <button
            onClick={skipSequence}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00ff66]/10 border border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/20 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)] active:scale-95 cursor-pointer"
          >
            <span>SKIP (ESC)</span>
            <FastForward className="w-3.5 h-3.5 text-[#00f0ff]" />
          </button>
        </div>

        {/* State Badge */}
        <div className="absolute top-5 left-6 z-50 font-mono text-[10px] text-[#00ff66]/80 bg-black/80 px-2.5 py-1 rounded border border-[#00ff66]/30 pointer-events-none flex items-center gap-2">
          <Terminal className="w-3 h-3 text-[#00ff66] animate-pulse" />
          <span>CYBER BOOTLOADER // <span className="text-[#00f0ff] font-bold">{state}</span> [{stageText}]</span>
        </div>

        {/* Phase 1: SOC Terminal Trace & Progress Bar */}
        {showTerminal && (
          <TerminalPhase
            onAuthorize={triggerAuthorize}
            isAuthorizing={state === 'AUTHORIZE'}
            progress={progress}
            stageText={stageText}
          />
        )}

        {/* Phase 3, 4, 5: Dissolve & Light Beam & Ring Overlay Effects */}
        {(state === 'DISSOLVE' || state === 'BEAM' || state === 'RING') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-1 bg-[#00f0ff] shadow-[0_0_50px_#00f0ff] animate-pulse" />
            <div className="absolute font-mono text-2xl font-extrabold text-[#00ff66] tracking-[0.3em] uppercase animate-ping">
              ACCESS GRANTED // INITIALIZING SYSTEM
            </div>
          </div>
        )}
      </div>

      {/* Phase 6: Quantum Shutter Overlay */}
      <QuantumShutter active={state === 'SHUTTER'} />
    </>
  );
}

export default function CyberAccessSequence(props: CyberAccessSequenceProps) {
  return (
    <FallbackBoundary onFallback={() => props.onComplete?.()}>
      <SequenceInner {...props} />
    </FallbackBoundary>
  );
}
