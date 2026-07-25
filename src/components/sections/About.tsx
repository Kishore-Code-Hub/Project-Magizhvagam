'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { CyberBadge } from '@/components/ui/CyberBadge';
import { GlowButton } from '@/components/ui/GlowButton';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { SkillProgressBar } from '@/components/ui/SkillProgressBar';
import { ProfileData } from '@/types';
import { normalizeImageUrl } from '@/lib/image-utils';
import { getSocials } from '@/lib/social-utils';
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
  MapPin,
  Briefcase,
  User,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Download,
  Flame,
  Globe,
  Lock,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';

interface AboutProps {
  profile: ProfileData;
}

const COLOR_TOKEN_MAP: Record<string, string> = {
  emerald: '#00ff66',
  cyan: '#00f0ff',
  amber: '#ffb700',
  purple: '#a855f7',
  rose: '#ff0055',
  blue: '#3b82f6',
};

const ICON_MAP: Record<string, any> = {
  ShieldCheck,
  Code2,
  Cpu,
  GraduationCap,
  Sparkles,
  Award,
  Terminal,
  Compass,
  Rocket,
  CheckCircle2,
  Flame,
  Globe,
  Lock,
};

function getLucideIcon(name?: string, fallback: any = ShieldCheck): any {
  if (!name) return fallback;
  return ICON_MAP[name] || fallback;
}

function getSpecializationIcon(card: any): any {
  const key = `${card.iconName || ''} ${card.title || ''}`.toLowerCase();
  if (key.includes('cyber') || key.includes('shield') || key.includes('sec')) return ShieldCheck;
  if (key.includes('ai') || key.includes('brain') || key.includes('cpu') || key.includes('neural')) return Cpu;
  if (key.includes('network') || key.includes('compass') || key.includes('tcp') || key.includes('packet')) return Compass;
  if (key.includes('linux') || key.includes('terminal') || key.includes('bash') || key.includes('kernel')) return Terminal;
  if (key.includes('cloud') || key.includes('infra') || key.includes('globe')) return Globe;
  if (key.includes('backend') || key.includes('code') || key.includes('server') || key.includes('api')) return Code2;
  return getLucideIcon(card.iconName, ShieldCheck);
}

function resolveColor(tokenOrHex?: string, fallback = '#00ff66'): string {
  if (!tokenOrHex) return fallback;
  if (COLOR_TOKEN_MAP[tokenOrHex]) return COLOR_TOKEN_MAP[tokenOrHex];
  return tokenOrHex;
}

export default function About({ profile }: AboutProps) {
  const socials = getSocials(profile.socials);

  if (process.env.NODE_ENV === 'development') {
    console.log('[About Component] profile prop:', profile);
    console.log('[About Component] profile.socials:', profile?.socials);
    console.log('[About Component] resolved socials:', socials);
  }

  const safeResumeUrl = profile.resumeUrl || 'https://drive.google.com';

  const aboutModules = profile.aboutModules || {
    showEducation: true,
    showFocus: true,
    showRoadmap: true,
    showSpecializations: true,
    showStats: true,
  };

  const parsedEducation = useMemo(() => {
    try {
      return typeof profile.education === 'string'
        ? JSON.parse(profile.education)
        : profile.education || [];
    } catch {
      return ['B.E. Computer Science & Engineering'];
    }
  }, [profile.education]);

  const academicDegree = profile.academicDegree || {
    degree: parsedEducation[0] || 'B.E. Computer Science & Engineering',
    college: 'SRM Valliammai Engineering College',
    year: '2024 – 2028',
    status: 'Active',
  };

  const focusChips = profile.focusChips && profile.focusChips.length > 0
    ? profile.focusChips
    : [
      '✓ Cybersecurity',
      '✓ AI & Neural Nets',
      '✓ Backend Systems',
      '✓ Cloud Infrastructure',
      '✓ DevOps & Containers',
      '✓ Network Security',
    ];

  const careerRoadmap = profile.careerRoadmap && profile.careerRoadmap.length > 0
    ? profile.careerRoadmap
    : [
      { year: '2024', title: 'Started CSE Engineering', description: 'Foundation in computer science & security principles', iconName: 'GraduationCap', colorToken: 'emerald' },
      { year: '2025', title: 'Full Stack & Security Projects', description: 'Building web systems and pentesting labs', iconName: 'Code2', colorToken: 'cyan' },
      { year: '2026', title: 'AI + Cyber Threat Detection', description: 'Advanced machine learning for network intrusion', iconName: 'Cpu', colorToken: 'amber' },
      { year: 'Goal', title: 'Security Software Engineer', description: 'Production engineering and defense-in-depth', iconName: 'ShieldCheck', colorToken: 'rose' },
    ];

  const statsCards = profile.statsCards && profile.statsCards.length > 0
    ? profile.statsCards
    : [
      { id: '1', value: '15+', label: 'Projects Built', colorToken: 'emerald', iconName: 'Rocket' },
      { id: '2', value: '10+', label: 'Certifications', colorToken: 'cyan', iconName: 'Award' },
      { id: '3', value: '2+', label: 'Years Learning', colorToken: 'emerald', iconName: 'Flame' },
      { id: '4', value: '∞', label: 'Curiosity', colorToken: 'amber', iconName: 'Sparkles' },
    ];

  const specializationCards = profile.specializationCards && profile.specializationCards.length > 0
    ? profile.specializationCards
    : [
      { id: '1', title: 'Cybersecurity', description: 'Application Security, Threat Detection & Vulnerability Analysis', iconName: 'ShieldCheck', colorToken: 'emerald' },
      { id: '2', title: 'AI Systems', description: 'Neural Networks, Computer Vision & Constraint Algorithms', iconName: 'Cpu', colorToken: 'cyan' },
      { id: '3', title: 'Cloud Infra', description: 'Scalable Microservices, Docker Containers & CI/CD Pipelines', iconName: 'Globe', colorToken: 'amber' },
      { id: '4', title: 'Networking', description: 'TCP/IP Architecture, Packet Analysis & Firewall Systems', iconName: 'Compass', colorToken: 'rose' },
      { id: '5', title: 'Backend Systems', description: 'FastAPI, Node.js, High-Throughput REST APIs & JWT Security', iconName: 'Code2', colorToken: 'purple' },
      { id: '6', title: 'Linux Kernel', description: 'Bash Scripting, System Administration & Access Controls', iconName: 'Terminal', colorToken: 'emerald' },
    ];

  const skillProgressList = [
    { name: 'Python', percentage: 90, color: '#00ff66' },
    { name: 'Cybersecurity', percentage: 88, color: '#00f0ff' },
    { name: 'Linux Kernel & Admin', percentage: 88, color: '#ffb700' },
    { name: 'FastAPI / Python Backend', percentage: 85, color: '#00ff66' },
    { name: 'React / Next.js', percentage: 85, color: '#00f0ff' },
    { name: 'Networking & TCP/IP', percentage: 82, color: '#ff0055' },
    { name: 'SQL & Database Design', percentage: 80, color: '#7000ff' },
  ];

  return (
    <SectionWrapper id="about" className="py-24 relative overflow-hidden bg-black/40">
      {/* Background Subtle Cyber Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <SectionTitle
            title="ABOUT ME"
            subtitle="OPERATIONAL & ACADEMIC PROFILE"
            align="center"
          />
        </div>

        {/* TOP SECTION: Main Profile Card & Current Focus Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Glass Profile Card */}
          <div className="lg:col-span-5">
            <GlassCard variant="glow" className="p-6 sm:p-8 rounded-3xl relative overflow-hidden">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Profile Image with Cyber Avatar Ring */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500" />

                  <img
                    src={normalizeImageUrl(profile.profileImage || profile.image, 'about') || '/hero-hacker.png'}
                    alt={profile.name}
                    className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-2 border-emerald-500/80 shadow-2xl"
                  />
                  <div className="absolute bottom-1 right-1 bg-emerald-500 p-1.5 rounded-full border-2 border-black text-black">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-white tracking-wide">{profile.name}</h3>
                  <p className="text-sm font-mono text-emerald-400 mt-1">
                    {profile.professionalIdentity || 'Software Engineer & Cybersecurity Researcher'}
                  </p>
                </div>

                {/* LinkedIn CTA Button - Always Rendered */}
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Connect with me on LinkedIn"
                  title="Connect with me on LinkedIn"
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0A66C2] text-white border border-[#0A66C2] font-bold text-xs hover:bg-white hover:text-[#0A66C2] hover:border-[#0A66C2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] transition-all duration-300 shadow-[0_4px_15px_rgba(10,102,194,0.35)] hover:shadow-[0_6px_20px_rgba(10,102,194,0.5)] transform hover:-translate-y-0.5 mt-1 cursor-pointer"
                >
                  <LinkedinIcon className="w-4 h-4 shrink-0 fill-current" />
                  <span>Connect with me on LinkedIn</span>
                </a>

                {/* About Me Bio Summary Block */}
                <div className="w-full text-left p-4 rounded-2xl bg-black/50 border border-emerald-500/20 space-y-2 mt-2">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-400" /> ABOUT ME
                    </h4>
                    <span className="text-[10px] font-mono text-gray-400">SUMMARY PROTOCOL</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
                    {profile.personalBio || profile.bio}
                  </p>
                </div>

                {/* Social & Contact Actions */}
                <div className="pt-4 border-t border-emerald-500/20 w-full flex items-center justify-center gap-3">
                  {profile.socials?.github && (
                    <a
                      href={profile.socials.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all hover:scale-105"
                      title="GitHub Profile"
                    >
                      <GithubIcon className="w-5 h-5" />
                    </a>
                  )}
                  {profile.socials?.linkedin && (
                    <a
                      href={profile.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all hover:scale-105"
                      title="LinkedIn Profile"
                    >
                      <LinkedinIcon className="w-5 h-5" />
                    </a>
                  )}
                  {profile.socials?.email && (
                    <a
                      href={profile.socials.email}
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all hover:scale-105"
                      title="Email Contact"
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                  )}
                  <a
                    href={safeResumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)]"
                  >
                    <Download className="w-4 h-4" /> RESUME
                  </a>
                </div>
              </div>
            </GlassCard>

            {/* Academic Degree Card (Module) */}
            {aboutModules.showEducation && (
              <GlassCard variant="default" className="mt-6 p-6 rounded-3xl border-emerald-500/30">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold">
                        ACADEMICS
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                        {academicDegree.status}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white">{academicDegree.degree}</h4>
                    <p className="text-xs text-gray-300">{academicDegree.college}</p>
                    <p className="text-xs text-gray-400 font-mono pt-1">{academicDegree.year}</p>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right Column: Core Specializations & Statistics */}
          <div className="lg:col-span-7 space-y-6">

            {/* Specialization Highlight Cards Grid Module */}
            {aboutModules.showSpecializations && (
              <GlassCard variant="default" className="p-6 sm:p-8 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" /> CORE SPECIALIZATION HIGHLIGHTS
                  </h3>
                  <span className="text-xs font-mono text-gray-400 hidden sm:inline">6 MODULES</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {specializationCards.map((card, idx) => {
                    const IconComp = getSpecializationIcon(card);
                    const cardColor = resolveColor(card.colorToken, '#00ff66');

                    return (
                      <div
                        key={card.id || idx}
                        className="p-4 rounded-2xl bg-black/50 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 space-y-2 group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center border bg-black/60 transition-transform duration-300 group-hover:scale-110 shrink-0"
                            style={{ borderColor: `${cardColor}60`, color: cardColor }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {card.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed font-sans line-clamp-2">
                          {card.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: Four Counter Cards Module */}

        {/* BOTTOM SECTION: Four Counter Cards Module */}
        {aboutModules.showStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
            {statsCards.map((st, idx) => {
              const IconComp = getLucideIcon(st.iconName, Rocket);
              const cardColor = resolveColor(st.colorToken, '#00ff66');

              return (
                <GlassCard key={st.id || idx} variant="glow" className="p-5 rounded-2xl flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1" style={{ color: cardColor }}>
                    <IconComp className="w-5 h-5" />
                    <div className="text-2xl sm:text-3xl font-extrabold">
                      {st.value === '∞' ? '∞' : <AnimatedCounter value={st.value} />}
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 font-bold uppercase">{st.label}</div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
