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
  align = 'center',
  className = '',
}) => {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <div className="w-full flex justify-center mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`inline-flex flex-col p-6 sm:p-8 rounded-[24px] bg-[rgba(10,12,14,0.42)] backdrop-blur-[24px] border border-[rgba(0,255,120,0.15)] shadow-[0_25px_70px_rgba(0,255,100,0.10)] max-w-3xl ${alignmentClasses[align]} ${className}`}
      >
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white uppercase">
        {title.split(' ').map((word, i) => (
          <span key={i} className={i % 2 !== 0 ? 'text-[var(--accent-color)] font-extrabold' : ''}>
            {word}{' '}
          </span>
        ))}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base sm:text-lg text-gray-300 max-w-2xl font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className="w-20 h-1 mt-4 rounded-full bg-gradient-to-r from-[var(--accent-color)] to-transparent opacity-60" />
    </motion.div>
    </div>
  );
};
