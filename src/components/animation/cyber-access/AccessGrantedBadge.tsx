'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccessGrantedBadgeProps {
  show: boolean;
}

export default function AccessGrantedBadge({ show }: AccessGrantedBadgeProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-5 right-6 z-50 pointer-events-none flex items-center gap-2.5 px-4 py-2 rounded border border-[#00ff66]/60 bg-[#030504]/90 text-[#00ff66] font-mono text-xs font-bold tracking-widest uppercase shadow-[0_0_25px_rgba(0,255,102,0.3)] backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
          <span>ACCESS GRANTED</span>
          <span className="text-[#00f0ff]">✓</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
