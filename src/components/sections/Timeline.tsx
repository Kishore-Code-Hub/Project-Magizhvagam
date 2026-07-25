'use client';

import React, { useState } from 'react';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { TimelineCard, TimelineItem } from '@/components/ui/TimelineCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DESIGN_SYSTEM } from '@/lib/design-system';

interface TimelineProps {
  timeline: TimelineItem[];
}

export default function Timeline({ timeline = [] }: TimelineProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...DESIGN_SYSTEM.categories.timeline];

  const filteredTimeline = timeline.filter(
    (t) => selectedCategory === 'All' || t.category === selectedCategory
  );

  return (
    <SectionWrapper id="timeline">
      <SectionTitle
        title="CAREER TIMELINE"
        subtitle="Education • Experience • Projects • Achievements"
        badgeText="ENGINEERING MILESTONES"
      />

      {/* Category Filter Pills */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-mono rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[var(--accent-color)] text-black font-bold border-[var(--accent-color)] shadow-[var(--shadow-accent-glow)]'
                : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredTimeline.length > 0 ? (
        <div className="relative max-w-4xl mx-auto space-y-6">
          {/* Vertical Center Line for Desktop */}
          <div className="hidden sm:block absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-[var(--accent-color)] via-emerald-500/30 to-transparent" />

          {filteredTimeline.map((item) => (
            <div key={item.id} className="relative sm:pl-16">
              {/* Timeline Indicator Node */}
              <div className="hidden sm:flex absolute left-4 top-6 -translate-x-1/2 w-4 h-4 rounded-full bg-black border-2 border-[var(--accent-color)] items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] animate-ping" />
              </div>

              <TimelineCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Milestones Recorded"
          description="Career entries will be logged as milestones unfold."
        />
      )}
    </SectionWrapper>
  );
}
