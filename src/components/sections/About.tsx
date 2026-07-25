'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberBadge } from '@/components/ui/CyberBadge';
import { GlowButton } from '@/components/ui/GlowButton';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { ProfileData } from '@/types';
import {
  ShieldCheck,
  Code2,
  Cpu,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Mail,
  Award,
  Terminal,
  Compass,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';

interface AboutProps {
  profile: ProfileData;
}

export default function About({ profile }: AboutProps) {
  const safeResumeUrl = profile.resumeUrl || 'https://drive.google.com';

  const stats = profile.stats || {
    yearsLearning: '2+',
    projects: '15+',
    certifications: '10+',
    curiosity: '∞',
  };

  const parsedValues = React.useMemo(() => {
    try {
      return typeof profile.values === 'string' ? JSON.parse(profile.values) : profile.values || [];
    } catch {
      return ['Security First', 'Clean Code', 'Continuous Learning', 'User Privacy'];
    }
  }, [profile.values]);

  const parsedEducation = React.useMemo(() => {
    try {
      return typeof profile.education === 'string'
        ? JSON.parse(profile.education)
        : profile.education || [];
    } catch {
      return ['B.E. Computer Science & Engineering'];
    }
  }, [profile.education]);

  return (
    <SectionWrapper id="about">
      <SectionTitle
        title="ABOUT THE ENGINEER"
        subtitle="Software Engineering Rigor • Cybersecurity Research • Production Architectures"
      />

      <div className="p-6 sm:p-8 rounded-[24px] bg-[rgba(10,12,14,0.42)] backdrop-blur-[24px] border border-[rgba(0,255,120,0.15)] shadow-[0_25px_70px_rgba(0,255,100,0.10)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Engineer Profile HUD */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <GlassCard variant="glow" className="h-full flex-1 flex flex-col justify-between p-6 sm:p-8 rounded-[24px]">
              <div>
                <div className="relative w-28 h-28 mx-auto mb-4 rounded-2xl overflow-hidden border-2 border-[var(--border-accent)] p-1 bg-[var(--bg-glass)] aspect-square">
                  <img
                    src={(stats as any)?.profileImage || '/hero-hacker.png'}
                    alt={profile.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <span className="absolute bottom-2 right-2 w-3.5 h-3.5 rounded-full bg-[var(--accent-color)] border-2 border-black animate-pulse" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-center">{profile.name}</h3>
                <p className="text-xs font-mono text-[var(--accent-color)] mt-1 mb-4 uppercase text-center">
                  {profile.professionalIdentity || profile.headline}
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <CyberBadge variant="green" size="sm">
                    Available for Hire
                  </CyberBadge>
                  <CyberBadge variant="cyan" size="sm">
                    CSE Engineer
                  </CyberBadge>
                </div>

                {/* Quick Metrics HUD */}
                <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-center mb-4">
                  <div>
                    <div className="text-xl font-extrabold text-[var(--accent-color)]">
                      <AnimatedCounter value={stats.yearsLearning || '2+'} />
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase">Years Learning</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-emerald-400">
                      <AnimatedCounter value={stats.projects || '15+'} />
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase">Projects Built</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-cyan-400">
                      <AnimatedCounter value={stats.certifications || '10+'} />
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase">Certifications</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-amber-400">∞</div>
                    <div className="text-[10px] text-gray-400 uppercase">Curiosity</div>
                  </div>
                </div>
              </div>

              {/* Social Shortcuts Pinned to Bottom */}
              <div className="flex items-center justify-center gap-3 pt-2 mt-auto">
                {profile.socials?.github && (
                  <a
                    href={profile.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[var(--accent-color)] border border-white/10 transition-colors"
                  >
                    <GithubIcon className="w-4 h-4" />
                  </a>
                )}
                {profile.socials?.linkedin && (
                  <a
                    href={profile.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[var(--accent-color)] border border-white/10 transition-colors"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                  </a>
                )}
                {profile.socials?.email && (
                  <a
                    href={profile.socials.email}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[var(--accent-color)] border border-white/10 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Narrative & Technical Core */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <GlassCard variant="default" className="h-full flex-1 flex flex-col justify-between p-6 sm:p-8 rounded-[24px]">
              <div>
                <h4 className="text-base font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[var(--accent-color)]" />
                  Personal Biography & Focus
                </h4>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4 font-sans">
                  {profile.personalBio || profile.bio}
                </p>

                {/* Current Focus */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-[var(--border-accent)] mb-4">
                  <span className="text-[11px] font-mono text-[var(--accent-color)] uppercase tracking-wider font-bold block mb-1">
                    Current Focus:
                  </span>
                  <p className="text-xs text-gray-300 font-mono">
                    {profile.currentFocus ||
                      'Building production-grade secure web apps & studying AI-driven threat detection.'}
                  </p>
                </div>

                {/* Core Values Grid */}
                <h5 className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mb-2.5">
                  Engineering Values & Principles
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {parsedValues.map((val: string, idx: number) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 text-center rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-gray-200"
                    >
                      {val}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Philosophy Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent border-l-4 border-[var(--accent-color)] mt-2">
                <h6 className="text-[11px] font-mono text-[var(--accent-color)] uppercase font-bold mb-0.5">
                  Technical Philosophy
                </h6>
                <p className="text-xs italic text-gray-300">
                  "{profile.techPhilosophy || 'Build simple, resilient, and audit-ready systems with defence-in-depth architecture.'}"
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
