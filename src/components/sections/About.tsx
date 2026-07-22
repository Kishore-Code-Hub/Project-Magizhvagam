'use client';

import React from 'react';
import { ProfileData } from '@/types';
import { ArrowRight, UserCheck, Code, Award, Infinity, Cpu, Lock } from 'lucide-react';

interface AboutProps {
  profile: ProfileData;
}

export default function About({ profile }: AboutProps) {
  const statsList = [
    { label: 'Years Learning', value: profile.stats.yearsLearning, icon: UserCheck },
    { label: 'Projects', value: profile.stats.projects, icon: Code },
    { label: 'Certifications', value: profile.stats.certifications, icon: Award },
    { label: 'Curiosity', value: profile.stats.curiosity, icon: Infinity },
  ];

  return (
    <section id="about" className="py-24 px-4 md:px-8 relative z-10">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-purple-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            ABOUT ME
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            Who Am <span className="text-gradient">I?</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Narrative Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-8 space-y-4">
              <p className="text-lg leading-relaxed">
                I'm a Computer Science Engineering student passionate about exploring the world of{' '}
                <span className="text-purple-400 font-semibold">Cybersecurity</span>, AI, and building secure, resilient digital systems.
              </p>

              <p className="text-base text-gray-400 leading-relaxed">
                My work bridges software engineering and defensive security. Whether designing automated timetable engines or auditing network packet streams for vulnerabilities, I believe in writing software that is resilient by design.
              </p>

              <div className="pt-4 flex items-center gap-4">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 text-sm font-semibold transition-all hover:translate-x-1"
                >
                  <span>Know More About Me</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Shield Badge */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm aspect-square glass-panel p-6 flex flex-col items-center justify-center text-center overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 w-28 h-28 rounded-full bg-purple-600/10 border border-purple-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.25)] mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-12 h-12 text-purple-400" />
              </div>

              <div className="relative z-10 space-y-1">
                <h3 className="text-lg font-bold">Defensive & Offensive Mindset</h3>
                <p className="text-xs text-gray-400 max-w-xs">
                  Understanding attack vectors to engineer resilient, unbreachable software systems.
                </p>
              </div>

              <Cpu className="absolute bottom-6 right-6 w-5 h-5 text-blue-400/40 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {statsList.map((stat, idx) => {
            const IconComp = stat.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-6 flex flex-col items-center justify-center text-center space-y-2 group hover:scale-[1.02] transition-all"
              >
                <div className="p-3 rounded-xl bg-purple-600/10 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform">
                  <IconComp className="w-6 h-6" />
                </div>
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {stat.value}
                </span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
