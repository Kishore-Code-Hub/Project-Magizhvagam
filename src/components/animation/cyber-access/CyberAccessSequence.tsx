'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCyberAccessStateMachine } from './useCyberAccessStateMachine';
import MatrixCenterLoader from './MatrixCenterLoader';
import QuantumShutter from './QuantumShutter';
import FallbackBoundary from './FallbackBoundary';
import { BootController } from '@/lib/boot/BootController';

interface CyberAccessSequenceProps {
  onComplete?: () => void;
  onReveal?: () => void;
  telemetry?: {
    ip?: string;
    userAgent?: string;
    host?: string;
  };
}

function SequenceInner({ onComplete, onReveal }: CyberAccessSequenceProps) {
  const {
    state,
    triggerAuthorize,
  } = useCyberAccessStateMachine(onComplete, onReveal);

  const [msgOffset, setMsgOffset] = React.useState({ x: 0, y: -40 });

  React.useEffect(() => {
    fetch('/api/appearance')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setMsgOffset({
            x: typeof data.bootMsgOffsetX === 'number' ? data.bootMsgOffsetX : 0,
            y: typeof data.bootMsgOffsetY === 'number' ? data.bootMsgOffsetY : -40,
          });
        }
      })
      .catch(() => { });
  }, []);

  // Filtered interaction listener (Enter, Space, Click, Tap only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      BootController.handleUserInteraction(e);
    };

    const handlePointer = (e: MouseEvent | TouchEvent) => {
      BootController.handleUserInteraction(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handlePointer);
    window.addEventListener('touchstart', handlePointer);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handlePointer);
      window.removeEventListener('touchstart', handlePointer);
    };
  }, []);

  if (state === 'COMPLETE') {
    return null;
  }

  const showTerminal = state === 'TRACE' || state === 'AUTHORIZE';

  return (
    <>
      <div
        id="cyber-access-overlay"
        data-cyber-state={state}
        className={`fixed inset-0 z-50 overflow-hidden select-none bg-[#030303] flex items-center justify-center p-4 transition-opacity duration-500 ${
          state === 'SHUTTER' || state === 'REVEAL' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Background ambient glow */}
        <div className="absolute inset-0 bg-radial from-[#00ff66]/10 via-transparent to-black pointer-events-none" />

        <AnimatePresence mode="wait">
          {/* Phase 1: Center Matrix Hacker Boot Loader */}
          {showTerminal && (
            <motion.div
              key="phase1-matrix-loader"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-full flex items-center justify-center"
            >
              <MatrixCenterLoader
                onAuthorize={triggerAuthorize}
                isAuthorizing={state === 'AUTHORIZE'}
              />
            </motion.div>
          )}

          {/* Phase 2: Access Granted // Initializing System Overlay */}
          {(state === 'DISSOLVE' || state === 'BEAM' || state === 'RING') && (
            <motion.div
              key="phase2-initializing-overlay"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-full h-1 bg-[#00f0ff] shadow-[0_0_50px_#00f0ff] animate-pulse" />
              <div
                className="absolute font-mono text-xl sm:text-2xl font-extrabold text-[#00ff66] tracking-[0.3em] uppercase animate-ping text-center px-4"
                style={{
                  transform: `translate(${msgOffset.x}px, ${msgOffset.y}px)`,
                  textShadow: '0 0 20px rgba(0, 255, 102, 0.9), 0 0 40px rgba(0, 255, 102, 0.5)',
                }}
              >
                ACCESS GRANTED // INITIALIZING SYSTEM
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Phase 3: Quantum Shutter & Welcome Screen Overlay */}
      <QuantumShutter active={state === 'SHUTTER' || state === 'REVEAL'} isOpening={state === 'REVEAL'} />
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
