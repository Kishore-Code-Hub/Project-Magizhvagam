'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkillProgressBarProps {
  name: string;
  percentage: number;
  color?: string;
}

export const SkillProgressBar: React.FC<SkillProgressBarProps> = ({
  name,
  percentage,
  color = 'var(--accent-color)',
}) => {
  return (
    <div className="space-y-1 font-mono text-xs">
      <div className="flex justify-between items-center text-gray-300">
        <span className="font-bold tracking-wide">{name}</span>
        <span className="text-emerald-400 font-extrabold">{percentage}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-black/60 border border-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full shadow-[0_0_10px_var(--accent-color)]"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};
