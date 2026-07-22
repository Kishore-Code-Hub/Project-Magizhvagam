'use client';

import React, { useState } from 'react';
import { SkillData } from '@/types';
import { Terminal, Shield, Cpu, Database, Code, Server, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillsProps {
  skills: SkillData[];
}

const CATEGORIES = ['All', 'Languages', 'Security Tools', 'Infra/DevOps'];

export default function Skills({ skills }: SkillsProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredSkills =
    activeCategory === 'All'
      ? skills
      : skills.filter((s) => s.category.toLowerCase().includes(activeCategory.toLowerCase()));

  const getSkillIcon = (iconName: string, category: string) => {
    switch (category.toLowerCase()) {
      case 'security tools':
        return Shield;
      case 'infra/devops':
        return Server;
      default:
        return Code;
    }
  };

  return (
    <section id="skills" className="py-24 px-4 md:px-8 relative z-10 circuit-grid">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header & Category Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-purple-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              TECH ARSENAL
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Skills & <span className="text-gradient">Tools</span>
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 glass-panel p-1.5 rounded-xl w-fit">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                  activeCategory === cat
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                    : 'text-gray-400 hover:text-purple-300 hover:bg-purple-500/10'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Skill Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredSkills.map((skill) => {
            const IconComponent = getSkillIcon(skill.icon, skill.category);
            return (
              <div
                key={skill.id}
                className="glass-panel p-5 flex flex-col items-center justify-center text-center space-y-3 group hover:-translate-y-1.5 cursor-pointer"
              >
                {/* Skill Icon Container */}
                <div className="w-12 h-12 rounded-xl bg-purple-950/30 border border-purple-500/40 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-400/80 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
                  <IconComponent className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
                </div>

                {/* Skill Name */}
                <span className="text-sm font-semibold text-gray-200 dark:text-gray-200 light:text-gray-800 group-hover:text-purple-400 transition-colors">
                  {skill.name}
                </span>

                {/* Category Tag */}
                <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 font-mono">
                  {skill.category}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
