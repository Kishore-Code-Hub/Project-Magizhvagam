'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FloatingPanelProps {
  children: React.ReactNode;
  className?: string;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-4, 4, -4] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className={`glass-panel p-4 sm:p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};
