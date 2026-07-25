'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { CyberBadge } from './CyberBadge';
import { Award, Clock, Star } from 'lucide-react';

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  officialLogo?: string | null;
  shortDesc?: string | null;
  yearsExperience: number;
  proficiency: number;
  level: string;
  featured: boolean;
}

interface SkillCardProps {
  skill: SkillItem;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill }) => {
  return (
    <GlassCard variant="interactive" className="group flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-color)] group-hover:scale-110 group-hover:border-[var(--accent-color)] transition-all duration-300">
              {skill.officialLogo ? (
                <img src={skill.officialLogo} alt={skill.name} className="w-6 h-6 object-contain" />
              ) : (
                <span className="font-mono font-bold text-sm">{skill.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg group-hover:text-[var(--accent-color)] transition-colors">
                {skill.name}
              </h3>
              <p className="text-xs text-gray-400 font-mono">{skill.category}</p>
            </div>
          </div>
          {skill.featured && (
            <CyberBadge variant="green" size="sm" icon={<Star className="w-3 h-3 fill-emerald-400" />}>
              Featured
            </CyberBadge>
          )}
        </div>

        {skill.shortDesc && (
          <p className="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed">
            {skill.shortDesc}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-color)]" />
            {skill.yearsExperience} {skill.yearsExperience === 1 ? 'Year' : 'Years'} Exp
          </span>
          <span className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-[var(--accent-color)]" />
            {skill.level}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex justify-between items-center text-xs font-mono mb-1.5">
          <span className="text-gray-400 uppercase tracking-wider">Proficiency</span>
          <span className="text-[var(--accent-color)] font-bold">{skill.proficiency}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${skill.proficiency}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-color)] to-emerald-400 shadow-[var(--shadow-accent-glow)]"
          />
        </div>
      </div>
    </GlassCard>
  );
};
