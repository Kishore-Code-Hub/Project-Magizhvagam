'use client';

import React, { useState } from 'react';
import { TimelineData } from '@/types';
import { Clock, Radio, Activity, ChevronRight, CheckCircle2 } from 'lucide-react';
import { CyberAudio } from '@/lib/CyberAudio';
import { useTheme } from '@/components/theme/ThemeProvider';

interface TimelineProps {
  timeline: TimelineData[];
}

export default function Timeline({ timeline }: TimelineProps) {
  const { audioMuted } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(timeline[0]?.id || null);

  const toggleExpand = (id: string) => {
    CyberAudio.playKeyClick(audioMuted);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="timeline" className="py-24 px-4 md:px-8 relative z-10 circuit-grid font-mono">
      <div className="max-w-7xl mx-auto space-y-12 pl-0 lg:pl-16">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
            <span className="pulse-dot" />
            // INTERACTIVE MISSION LOG & FIBER PIPELINE
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            CAREER MILESTONES & <br />
            <span className="text-gradient">FIBER-OPTIC DATA PACKETS</span>
          </h2>
        </div>

        {/* Vertical Fiber Optic Network Cable */}
        <div className="relative pl-6 sm:pl-10 space-y-8 border-l-2 border-accent/40">
          
          {/* Animated Glowing Packet Traveling Down the Cable */}
          <div className="absolute top-0 -left-[5px] w-2 h-8 rounded-full bg-accent shadow-[0_0_15px_var(--accent-color)] animate-[pulse_2s_infinite]" />

          {timeline.map((entry, idx) => {
            const isExpanded = expandedId === entry.id;

            return (
              <div key={entry.id} className="relative group">
                
                {/* Node Connection Point Dot */}
                <div
                  onClick={() => toggleExpand(entry.id)}
                  className={`absolute -left-[31px] sm:-left-[47px] top-1.5 w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all ${
                    isExpanded
                      ? 'bg-accent border-accent text-[#050505] shadow-[0_0_20px_var(--accent-color)]'
                      : 'bg-[#050505] border-accent/60 text-accent hover:border-accent'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                </div>

                {/* Event Card Panel */}
                <div
                  onClick={() => toggleExpand(entry.id)}
                  className="glass-panel p-6 border-accent/40 bg-[#040705]/95 rounded-2xl hover:border-accent transition-all cursor-pointer space-y-3 shadow-2xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent/20 pb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-accent/15 border border-accent/30 text-accent font-extrabold">
                        {entry.year}
                      </span>
                      <span className="font-bold text-white uppercase">{entry.category}</span>
                    </div>
                    <span className="text-[10px] text-accent font-bold flex items-center gap-1">
                      {isExpanded ? 'COLLAPSE NODE' : 'EXPAND NODE'} <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white group-hover:text-accent transition-colors">
                    {entry.title}
                  </h3>

                  {entry.subtitle && (
                    <p className="text-xs text-accent font-bold">{entry.subtitle}</p>
                  )}

                  <p className="text-xs text-gray-300 font-sans leading-relaxed">
                    {entry.description}
                  </p>

                  {/* Expanded Extra Details */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-accent/20 space-y-2 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> MILESTONE COMPLETED & VERIFIED
                      </div>
                      <p className="text-gray-400 font-sans text-xs">
                        Logged in the SOC mission archives. Associated repositories, project builds, and credentials indexed.
                      </p>
                    </div>
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
