'use client';

import React, { useState } from 'react';
import { TimelineData } from '@/types';
import { GraduationCap, Milestone, Rocket, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineProps {
  timeline: TimelineData[];
}

export default function Timeline({ timeline }: TimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(timeline[0]?.id || null);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'education':
        return GraduationCap;
      case 'project':
        return Rocket;
      case 'security':
        return Shield;
      default:
        return Milestone;
    }
  };

  return (
    <section id="timeline" className="py-24 px-4 md:px-8 relative z-10">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-purple-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            JOURNEY & MILESTONES
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            My <span className="text-gradient">Timeline</span>
          </h2>
        </div>

        {/* Vertical Timeline */}
        <div className="relative border-l-2 border-purple-500/40 ml-4 md:ml-32 space-y-8 pl-6 md:pl-10">
          {timeline.map((entry) => {
            const IconComp = getCategoryIcon(entry.category);
            const isExpanded = expandedId === entry.id;

            return (
              <div key={entry.id} className="relative group">
                {/* Year Badge */}
                <div className="hidden md:block absolute -left-36 top-1 text-right w-24">
                  <span className="text-sm font-bold text-purple-400 font-mono px-2.5 py-1 rounded-lg bg-purple-950/30 border border-purple-500/30">
                    {entry.year}
                  </span>
                </div>

                {/* Node Bullet Circle */}
                <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-6 h-6 rounded-full bg-black dark:bg-[#08080b] border-2 border-purple-500 flex items-center justify-center group-hover:scale-125 transition-all shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                </div>

                {/* Content Panel */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className={cn(
                    'glass-panel p-6 cursor-pointer transition-all space-y-3',
                    isExpanded && 'border-purple-500/70 shadow-lg shadow-purple-950/20'
                  )}
                >
                  {/* Mobile Year Badge */}
                  <div className="md:hidden inline-block text-xs font-bold text-purple-400 font-mono px-2 py-0.5 rounded bg-purple-950/30 border border-purple-500/20 mb-1">
                    {entry.year}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-600/10 border border-purple-500/30 text-purple-400">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold group-hover:text-purple-300 transition-colors">
                          {entry.title}
                        </h3>
                        {entry.subtitle && (
                          <span className="text-xs text-purple-400 font-medium">{entry.subtitle}</span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        'w-5 h-5 text-gray-400 transition-transform duration-200',
                        isExpanded && 'rotate-90 text-purple-400'
                      )}
                    />
                  </div>

                  {isExpanded && (
                    <p className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 leading-relaxed pt-2 border-t border-purple-500/20 animate-in fade-in duration-200">
                      {entry.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
