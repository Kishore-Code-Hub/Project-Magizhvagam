'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface QuantumShutterProps {
  active: boolean;
}

export default function QuantumShutter({ active }: QuantumShutterProps) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden select-none">
      {/* 80ms Volumetric White Lens Seam Flash */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0.2 }}
        animate={{ opacity: [0, 1, 0.9, 0], scaleY: [0.2, 3, 1, 0] }}
        transition={{ duration: 0.45, ease: [0.82, 0, 0.2, 1] }}
        className="absolute top-1/2 left-0 right-0 h-16 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#ffffff] to-transparent shadow-[0_0_80px_#ffffff] z-50 pointer-events-none"
      />

      {/* Radial Bloom Lens Flare */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2.0] }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-radial from-white via-[#00ff66]/50 to-transparent blur-2xl z-50 pointer-events-none"
      />

      {/* 150ms "WELCOME, KISHORE" HUD Toast Moment */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1.05, 1, 0.95] }}
        transition={{ duration: 0.45, times: [0, 0.2, 0.7, 1] }}
        className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center font-mono pointer-events-none"
      >
        <div className="px-6 py-3 rounded-lg bg-black/90 border border-[#00ff66] shadow-[0_0_40px_rgba(0,255,102,0.6)] backdrop-blur-md">
          <div className="text-[10px] text-[#00ff66] uppercase tracking-widest font-bold">
            SECURITY CLEARANCE GRANTED // SYSTEM READY
          </div>
          <div className="text-xl sm:text-2xl text-white font-extrabold tracking-tight mt-0.5">
            WELCOME, <span className="text-[#00f0ff]">ANONYMOUS</span>
          </div>
        </div>
      </motion.div>

      {/* Upper Shutter Panel (Slides Upward) */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{ y: '-100%' }}
        transition={{ duration: 0.45, ease: [0.82, 0, 0.2, 1] }}
        className="absolute top-0 left-0 right-0 h-1/2 bg-[#030303] border-b-2 border-[#00ff66]/60 shadow-[0_15px_40px_rgba(0,0,0,0.95)] z-40 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#030504] to-[#00ff66]/15 opacity-50" />
      </motion.div>

      {/* Lower Shutter Panel (Slides Downward) */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{ y: '100%' }}
        transition={{ duration: 0.45, ease: [0.82, 0, 0.2, 1] }}
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#030303] border-t-2 border-[#00ff66]/60 shadow-[0_-15px_40px_rgba(0,0,0,0.95)] z-40 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-[#030504] to-[#00ff66]/15 opacity-50" />
      </motion.div>
    </div>
  );
}
