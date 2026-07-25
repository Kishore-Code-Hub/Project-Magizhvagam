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
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        const orderA = (a as any).order ?? 0;
        const orderB = (b as any).order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
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
      />



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
