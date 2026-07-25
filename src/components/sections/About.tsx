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
        badgeText="PROFESSIONAL PROFILE"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Engineer Profile HUD */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard variant="glow" className="text-center relative">
            <div className="relative w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-[var(--border-accent)] p-1 bg-[var(--bg-glass)]">
              <img
                src={(stats as any)?.profileImage || '/hero-hacker.png'}
                alt={profile.name}
                className="w-full h-full object-cover rounded-xl"
              />
              <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-[var(--accent-color)] border-2 border-black animate-pulse" />
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight">{profile.name}</h3>
            <p className="text-xs font-mono text-[var(--accent-color)] mt-1 mb-4 uppercase">
              {profile.professionalIdentity || profile.headline}
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <CyberBadge variant="green" size="sm">
                Available for Hire
              </CyberBadge>
              <CyberBadge variant="cyan" size="sm">
                CSE Engineer
              </CyberBadge>
            </div>

            {/* Quick Metrics HUD */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-center mb-6">
              <div>
                <div className="text-2xl font-extrabold text-[var(--accent-color)]">
                  <AnimatedCounter value={stats.yearsLearning || '2+'} />
                </div>
                <div className="text-[10px] text-gray-400 uppercase">Years Learning</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-emerald-400">
                  <AnimatedCounter value={stats.projects || '15+'} />
                </div>
                <div className="text-[10px] text-gray-400 uppercase">Projects Built</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-cyan-400">
                  <AnimatedCounter value={stats.certifications || '10+'} />
                </div>
                <div className="text-[10px] text-gray-400 uppercase">Certifications</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-amber-400">∞</div>
                <div className="text-[10px] text-gray-400 uppercase">Curiosity</div>
              </div>
            </div>

            {/* Social Shortcuts */}
            <div className="flex items-center justify-center gap-3 pt-2">
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
        <div className="lg:col-span-7 space-y-6">
          <GlassCard variant="default">
            <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[var(--accent-color)]" />
              Personal Biography & Focus
            </h4>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6 font-sans">
              {profile.bio || profile.personalBio}
            </p>

            {/* Current Focus */}
            <div className="p-4 rounded-xl bg-black/40 border border-[var(--border-accent)] mb-6">
              <span className="text-xs font-mono text-[var(--accent-color)] uppercase tracking-wider font-bold block mb-1">
                Current Focus:
              </span>
              <p className="text-xs sm:text-sm text-gray-300 font-mono">
                {profile.currentFocus ||
                  'Building production-grade secure web apps & studying AI-driven threat detection.'}
              </p>
            </div>

            {/* Core Values Grid */}
            <h5 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">
              Engineering Values & Principles
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {parsedValues.map((val: string, idx: number) => (
                <div
                  key={idx}
                  className="px-3 py-2 text-center rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-gray-200"
                >
                  {val}
                </div>
              ))}
            </div>

            {/* Tech Philosophy Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent border-l-4 border-[var(--accent-color)]">
              <h6 className="text-xs font-mono text-[var(--accent-color)] uppercase font-bold mb-1">
                Technical Philosophy
              </h6>
              <p className="text-xs sm:text-sm italic text-gray-300">
                "{profile.techPhilosophy || 'Build simple, resilient, and audit-ready systems with defence-in-depth architecture.'}"
              </p>
            </div>
          </GlassCard>

          {/* Education & Credentials */}
          <GlassCard variant="default">
            <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
              Academic Background
            </h4>
            <div className="space-y-3">
              {parsedEducation.map((edu: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-xs sm:text-sm font-mono text-gray-200">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>{edu}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </SectionWrapper>
  );
}
