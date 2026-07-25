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
  return (
    <SectionWrapper id="timeline">
      <SectionTitle
        title="CAREER TIMELINE"
        subtitle="Education • Experience • Projects • Achievements"
      />

      {timeline.length > 0 ? (
        <div className="relative max-w-4xl mx-auto space-y-6">
          {/* Vertical Center Line for Desktop */}
          <div className="hidden sm:block absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-[var(--accent-color)] via-emerald-500/30 to-transparent" />

          {timeline.map((item) => (
            <div key={item.id} className="relative sm:pl-16">
              {/* Timeline Cyber Arrow Indicator Node */}
              <div className="hidden sm:flex absolute left-6 top-6 -translate-x-1/2 w-6 h-6 rounded-full bg-black border border-[var(--accent-color)] items-center justify-center text-[var(--accent-color)] text-xs font-mono font-bold shadow-[0_0_10px_rgba(0,255,102,0.4)]">
                ▶
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
