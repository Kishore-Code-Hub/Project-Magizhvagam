'use client';

import React, { useState } from 'react';
import { ProfileData } from '@/types';
import {
  ShieldCheck,
  Code,
  Award,
  UserCheck,
  GitCommit,
  Scan,
  CheckCircle2,
  MapPin,
  Target,
  Sparkles,
  ArrowRight,
  Terminal,
} from 'lucide-react';

interface AboutProps {
  profile: ProfileData;
}

export default function About({ profile }: AboutProps) {
  const [profileImg] = useState<string | null>(profile.image || null);

  const statsList = [
    { label: 'PROJECTS COMPLETED', value: `${profile.stats.projects || 15}+`, icon: Code },
    { label: 'CERTIFICATIONS', value: `${profile.stats.certifications || 10}+`, icon: Award },
    { label: 'YEARS LEARNING', value: `${profile.stats.yearsLearning || 3}+`, icon: UserCheck },
    { label: 'GITHUB CONTRIBUTIONS', value: '250+', icon: GitCommit },
  ];

  return (
    <section id="about" className="py-24 px-4 md:px-8 relative z-10 circuit-grid">
      <div className="max-w-7xl mx-auto space-y-12 pl-0 lg:pl-16">
        
        {/* Section Header */}
        <div className="space-y-2 font-mono">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
            <span className="pulse-dot" />
            // SECURITY CLEARANCE TERMINAL
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            BIOMETRIC IDENTITY & <br />
            <span className="text-gradient">OPERATIVE PROFILE</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Airport/SOC Security Clearance Terminal (Left Column: 5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-md glass-panel p-6 border-accent/50 flex flex-col items-center space-y-5 bg-[#040705]/95 shadow-2xl rounded-2xl overflow-hidden font-mono">
              
              {/* Clearance Terminal Header */}
              <div className="w-full flex items-center justify-between border-b border-accent/25 pb-3 text-xs">
                <span className="flex items-center gap-2 font-bold text-accent">
                  <ShieldCheck className="w-4 h-4 text-accent" /> ACCESS LEVEL 5
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold animate-pulse">
                  VERIFIED
                </span>
              </div>

              {/* Holographic Face & Fingerprint Scanning Frame */}
              <div className="relative w-48 h-48 rounded-2xl bg-accent/5 border-2 border-accent flex flex-col items-center justify-center shadow-[0_0_35px_rgba(var(--accent-rgb),0.3)] overflow-hidden group">
                
                {/* HUD Rotating Scanning Rings */}
                <div className="absolute w-60 h-60 rounded-full border border-dashed border-accent/30 animate-[spin_20s_linear_infinite]" />
                <div className="absolute w-44 h-44 rounded-full border border-accent/20 animate-[spin_12s_linear_infinite_reverse]" />

                {profileImg ? (
                  <img
                    src={profileImg}
                    alt={profile.name || 'Operative Photo'}
                    className="w-full h-full object-cover rounded-xl z-10"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-accent p-4 space-y-2 z-10">
                    <Scan className="w-16 h-16 animate-pulse" />
                    <span className="text-[9px] uppercase tracking-widest font-bold text-accent/90">
                      OPERATIVE PHOTO
                    </span>
                  </div>
                )}

                {/* Laser Scanline Beam */}
                <div className="absolute inset-x-0 h-1 bg-accent/80 shadow-[0_0_15px_var(--accent-color)] top-0 animate-[scanline_3s_ease-in-out_infinite]" />
              </div>

              {/* Security Clearance Details Grid */}
              <div className="w-full space-y-2 text-xs border-t border-accent/20 pt-4">
                <div className="flex justify-between items-center text-gray-300">
                  <span className="text-gray-400 font-medium">NAME:</span>
                  <span className="font-bold text-white uppercase">{profile.name || 'Kishore Narayanan K'}</span>
                </div>

                <div className="flex justify-between items-center text-gray-300">
                  <span className="text-gray-400 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-accent" /> LOCATION:
                  </span>
                  <span className="font-bold text-accent">INDIA // REMOTE</span>
                </div>

                <div className="flex justify-between items-center text-gray-300">
                  <span className="text-gray-400 font-medium flex items-center gap-1">
                    <Target className="w-3 h-3 text-accent" /> STATUS:
                  </span>
                  <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> AVAILABLE FOR WORK
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-300">
                  <span className="text-gray-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-accent" /> FOCUS:
                  </span>
                  <span className="font-bold text-white">CYBERSECURITY & AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative Glass Terminal & Stat Tiles (Right Column: 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Story Terminal */}
            <div className="glass-panel p-6 sm:p-8 space-y-4 border-accent/40 shadow-2xl bg-[#040705]/90 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-mono text-accent font-bold border-b border-accent/20 pb-3">
                <Terminal className="w-4 h-4 text-accent" />
                <span>OPERATIVE STATEMENT // BIO & PHILOSOPHY</span>
              </div>

              <p className="text-base sm:text-lg leading-relaxed text-gray-200 font-sans">
                {profile.bio ||
                  "I'm Kishore, a CSE student and Cybersecurity Enthusiast passionate about penetration testing, secure system architecture, and AI-driven full-stack development."}
              </p>

              <p className="text-sm sm:text-base text-gray-400 leading-relaxed font-sans">
                My approach combines defensive security engineering with modern full-stack application development—ensuring every project built is not only fast and intelligent, but hardened against threats.
              </p>

              <div className="pt-2 font-mono">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-accent text-accent font-bold text-xs hover:bg-accent hover:text-[#050505] transition-all"
                >
                  <span>INITIATE CONTACT</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* 4 Animated Achievement Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              {statsList.map((stat, idx) => {
                const IconComp = stat.icon;
                return (
                  <div
                    key={idx}
                    className="glass-panel p-4 border-accent/30 flex flex-col justify-between space-y-3 hover:border-accent hover:-translate-y-1 transition-all rounded-xl bg-[#040705]/80"
                  >
                    <div className="p-2 rounded-lg bg-accent/10 border border-accent/30 text-accent w-fit">
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div>
                      <span className="text-2xl sm:text-3xl font-extrabold text-accent tracking-tight">
                        {stat.value}
                      </span>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider pt-1">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
