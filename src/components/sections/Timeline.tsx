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
        subtitle="Education • Experience • Projects"
      />

      {timeline.length > 0 ? (
        <div className="relative max-w-4xl mx-auto space-y-8">
          {/* Continuous Vertical Line */}
          <div className="hidden sm:block absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--accent-color)] via-emerald-500/40 to-transparent" />

          {timeline.map((item) => (
            <div key={item.id} className="relative sm:pl-16 group">
              {/* Horizontal Connecting Arm */}
              <div className="hidden sm:block absolute left-6 top-1/2 -translate-y-1/2 w-10 h-0.5 bg-emerald-500/50 z-0 group-hover:bg-[#00ff66] transition-colors" />

              {/* Node Dot Centered Vertically Relative to Card */}
              <div className="hidden sm:flex absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-black border-2 border-[var(--accent-color)] items-center justify-center text-[var(--accent-color)] text-[10px] font-mono font-bold shadow-[0_0_15px_rgba(0,255,102,0.5)] group-hover:scale-110 transition-transform z-10">
                ●
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
