'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { CyberBadge } from './CyberBadge';
import { Award, Clock, Star, Code2, Terminal, Cpu, Database, Shield, Flame, Server, Globe, Layers } from 'lucide-react';

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

function renderSkillIcon(logo?: string | null, name: string = '') {
  if (!logo && !name) return <span className="font-mono font-bold text-sm">SK</span>;

  // Priority 1 & 2: Uploaded URL / Media asset
  if (logo && (logo.startsWith('/') || logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('data:'))) {
    return <img src={logo} alt={name} className="w-6 h-6 object-contain" />;
  }

  // Priority 3: Icon Map for Key Terms
  const key = (logo || name).toLowerCase();
  if (key.includes('python')) return <span className="text-emerald-400 font-bold font-mono text-sm">Py</span>;
  if (key.includes('react') || key.includes('next')) return <Globe className="w-5 h-5 text-cyan-400" />;
  if (key.includes('type') || key.includes('script')) return <span className="text-blue-400 font-bold font-mono text-sm">TS</span>;
  if (key.includes('cyber') || key.includes('sec') || key.includes('shield')) return <Shield className="w-5 h-5 text-emerald-400" />;
  if (key.includes('linux') || key.includes('terminal') || key.includes('bash')) return <Terminal className="w-5 h-5 text-amber-400" />;
  if (key.includes('sql') || key.includes('data') || key.includes('db')) return <Database className="w-5 h-5 text-purple-400" />;
  if (key.includes('api') || key.includes('cloud') || key.includes('docker') || key.includes('aws')) return <Server className="w-5 h-5 text-cyan-400" />;
  if (key.includes('c++') || key.includes('java') || key.includes('code')) return <Code2 className="w-5 h-5 text-emerald-400" />;

  // Priority 4: Fallback Tech Badge (First 2 characters)
  return <span className="font-mono font-bold text-sm text-[var(--accent-color)]">{name.slice(0, 2).toUpperCase()}</span>;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill }) => {
  return (
    <GlassCard variant="interactive" className="group flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-color)] group-hover:scale-110 group-hover:border-[var(--accent-color)] transition-all duration-300">
              {renderSkillIcon(skill.officialLogo, skill.name)}
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
