'use client';

import React, { useState, useMemo } from 'react';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { SkillCard, SkillItem } from '@/components/ui/SkillCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, SlidersHorizontal, Layers } from 'lucide-react';
import { DESIGN_SYSTEM } from '@/lib/design-system';

interface SkillsProps {
  skills: SkillItem[];
}

export default function Skills({ skills = [] }: SkillsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'proficiency' | 'experience' | 'name'>('proficiency');

  const categories = ['All', ...DESIGN_SYSTEM.categories.skills];

  const filteredSkills = useMemo(() => {
    return skills
      .filter((s) => {
        const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
        const matchesSearch =
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.shortDesc && s.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'proficiency') return b.proficiency - a.proficiency;
        if (sortBy === 'experience') return b.yearsExperience - a.yearsExperience;
        return a.name.localeCompare(b.name);
      });
  }, [skills, selectedCategory, searchQuery, sortBy]);

  return (
    <SectionWrapper id="skills">
      <SectionTitle
        title="TECHNICAL SKILLS"
        subtitle="Technology Stack & Engineering Expertise"
        badgeText="CAPABILITIES & TOOLING"
      />

      {/* Controls HUD Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-accent)] backdrop-blur-xl">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search technology stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-color)] transition-colors"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3 font-mono text-xs text-gray-300">
          <span className="flex items-center gap-1.5 text-gray-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-color)]" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-black/60 border border-white/10 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--accent-color)]"
          >
            <option value="proficiency">Highest Proficiency</option>
            <option value="experience">Years Experience</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-xs font-mono rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[var(--accent-color)] text-black font-bold border-[var(--accent-color)] shadow-[var(--shadow-accent-glow)]'
                : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills Cards Grid */}
      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSkills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Matching Skills Found"
          description="Try clearing your search query or selecting a different skill category."
        />
      )}
    </SectionWrapper>
  );
}
