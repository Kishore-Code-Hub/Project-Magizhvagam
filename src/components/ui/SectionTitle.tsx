'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  badgeText,
  align = 'center',
  className = '',
}) => {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col mb-12 ${alignmentClasses[align]} ${className}`}
    >
      {badgeText && (
        <span className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-mono tracking-widest uppercase rounded-full bg-[var(--bg-glass)] text-[var(--accent-color)] border border-[var(--border-accent)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] animate-ping" />
          {badgeText}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white uppercase">
        {title.split(' ').map((word, i) => (
          <span key={i} className={i % 2 !== 0 ? 'text-[var(--accent-color)] font-extrabold' : ''}>
            {word}{' '}
          </span>
        ))}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base sm:text-lg text-gray-400 max-w-2xl font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className="w-20 h-1 mt-4 rounded-full bg-gradient-to-r from-[var(--accent-color)] to-transparent opacity-60" />
    </motion.div>
  );
};
