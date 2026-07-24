'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface QuantumShutterProps {
  active: boolean;
}

export default function QuantumShutter({ active }: QuantumShutterProps) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* 80ms Volumetric Light Seam Flash */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0.2 }}
        animate={{ opacity: [0, 1, 0.8, 0], scaleY: [0.2, 2.5, 1, 0] }}
        transition={{ duration: 0.42, ease: [0.82, 0, 0.2, 1] }}
        className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#ffffff] to-transparent shadow-[0_0_60px_#ffffff] z-50 pointer-events-none"
      />

      {/* Radial Lens Flare Overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.4, 1.8] }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-radial from-white via-[#00ff66]/40 to-transparent blur-xl z-50 pointer-events-none"
      />

      {/* Upper Shutter Panel (Slides Upward) */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{ y: '-100%' }}
        transition={{ duration: 0.42, ease: [0.82, 0, 0.2, 1] }}
        className="absolute top-0 left-0 right-0 h-1/2 bg-[#030303] border-b border-[#00ff66]/50 shadow-[0_10px_30px_rgba(0,0,0,0.9)] z-40 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#030504] to-[#00ff66]/10 opacity-40" />
      </motion.div>

      {/* Lower Shutter Panel (Slides Downward) */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{ y: '100%' }}
        transition={{ duration: 0.42, ease: [0.82, 0, 0.2, 1] }}
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#030303] border-t border-[#00ff66]/50 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] z-40 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-[#030504] to-[#00ff66]/10 opacity-40" />
      </motion.div>
    </div>
  );
}
