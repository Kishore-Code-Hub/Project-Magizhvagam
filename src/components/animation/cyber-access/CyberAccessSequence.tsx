'use client';

import React from 'react';
import { useCyberAccessStateMachine } from './useCyberAccessStateMachine';
import TerminalPhase from './TerminalPhase';
import ParticleDissolveCanvas from './ParticleDissolveCanvas';
import EnergyBeamCanvas from './EnergyBeamCanvas';
import QuantumShutter from './QuantumShutter';
import AccessGrantedBadge from './AccessGrantedBadge';
import FallbackBoundary from './FallbackBoundary';
import { FastForward } from 'lucide-react';

interface CyberAccessSequenceProps {
  onComplete?: () => void;
}

function SequenceInner({ onComplete }: CyberAccessSequenceProps) {
  const { state, isMobile, triggerAuthorize, skipSequence } = useCyberAccessStateMachine(onComplete);

  React.useEffect(() => {
    console.log(`[CyberAccessSequence Inner] Component Mounted / Rendered. State: ${state}`);
    return () => {
      console.log(`[CyberAccessSequence Inner] Component Unmounted (State was: ${state})`);
    };
  }, []);

  if (state === 'COMPLETE') {
    console.log('[CyberAccessSequence Inner] Early return null because state === COMPLETE');
    return null;
  }

  const showTerminal = state === 'TRACE' || state === 'AUTHORIZE';
  const showDissolve = state === 'DISSOLVE';
  const showShutter = state === 'SHUTTER';
  const showGrantedBadge = state === 'REVEAL';

  return (
    <div id="cyber-access-overlay" data-cyber-state={state} className="fixed inset-0 z-50 overflow-hidden select-none bg-[#030303]">
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-radial from-[#00ff66]/10 via-transparent to-black pointer-events-none" />

      {/* Debug Indicator Badge */}
      <div className="absolute top-5 left-6 z-50 font-mono text-[10px] text-[#00ff66]/80 bg-black/80 px-2 py-1 rounded border border-[#00ff66]/30 pointer-events-none">
        CYBER ACCESS TEST // FSM STATE: <span className="text-[#00f0ff] font-bold">{state}</span>
      </div>

      {/* Top-Right Continuous SKIP Button */}
      <div className="absolute top-5 right-6 z-50">
        <button
          onClick={skipSequence}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00ff66]/10 border border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/20 hover:border-[#00ff66] text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)] active:scale-95 cursor-pointer"
        >
          <span>SKIP</span>
          <FastForward className="w-3.5 h-3.5 text-[#00f0ff]" />
        </button>
      </div>

      {/* Phase 1 & 2: SOC Terminal Trace & Grant Access Button */}
      {showTerminal && (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-40">
          <TerminalPhase
            onAuthorize={triggerAuthorize}
            isAuthorizing={state === 'AUTHORIZE'}
          />
        </div>
      )}

      {/* Phase 3: Canvas Particle Dissolve */}
      {showDissolve && <ParticleDissolveCanvas isMobile={isMobile} />}

      {/* Phase 4, 5, 6: Laser Trace, Center Shockwave, 360° Vault Ring & Release */}
      <EnergyBeamCanvas state={state} isMobile={isMobile} />

      {/* Phase 7: Quantum Shutter Split & 80ms Volumetric Bloom */}
      <QuantumShutter active={showShutter} />

      {/* Phase 8: Post-Reveal Top-Right ACCESS GRANTED HUD Toast */}
      <AccessGrantedBadge show={showGrantedBadge} />
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
