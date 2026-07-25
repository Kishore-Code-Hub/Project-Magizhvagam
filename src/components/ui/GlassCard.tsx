'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'interactive' | 'bordered';
  glowColor?: string;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  className = '',
  glowColor,
  ...motionProps
}) => {
  const variantStyles = {
    default: 'bg-[var(--bg-card)] border border-[var(--border-accent)] backdrop-blur-xl',
    glow: 'bg-[var(--bg-card)] border border-[var(--border-accent)] backdrop-blur-xl shadow-[var(--shadow-accent-glow)]',
    interactive:
      'bg-[var(--bg-card)] border border-[var(--border-accent)] backdrop-blur-xl hover:border-[var(--border-accent-hover)] hover:shadow-[var(--shadow-accent-glow)] transition-all duration-300 transform hover:-translate-y-1',
    bordered: 'bg-[var(--bg-card)] border-2 border-[var(--accent-color)] backdrop-blur-2xl',
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 ${variantStyles[variant]} ${className}`}
      style={glowColor ? ({ '--accent-color': glowColor } as React.CSSProperties) : undefined}
      {...motionProps}
    >
      {/* Corner Cyber HUD Accents */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[var(--accent-color)] opacity-40 pointer-events-none" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[var(--accent-color)] opacity-40 pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[var(--accent-color)] opacity-40 pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[var(--accent-color)] opacity-40 pointer-events-none" />

      {children}
    </motion.div>
  );
};
