'use client';

import React, { useState } from 'react';
import Typewriter from '@/components/animation/Typewriter';
import CyberWorkstation from '@/components/3d/CyberWorkstation';
import AtmosphereLayers from '@/components/animation/AtmosphereLayers';
import SessionBoot from '@/components/animation/SessionBoot';
import SideDockNav from '@/components/nav/SideDockNav';
import PerformanceManager from '@/components/ui/PerformanceManager';
import CommandPalette from '@/components/ui/CommandPalette';
import { ArrowRight, Mail, ExternalLink } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';
import { ProfileData } from '@/types';

interface HeroProps {
  profile: ProfileData;
}

export default function Hero({ profile }: HeroProps) {
  const [bootComplete, setBootComplete] = useState(false);
  const safeResumeUrl = profile.resumeUrl || 'https://drive.google.com';

  // Read hero image setting if stored in profile.stats
  const heroImage = (profile.stats as any)?.heroImage || '/Hero-section-banner.jfif';

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] w-full flex items-center justify-center pt-20 pb-20 px-4 sm:px-8 md:px-12 bg-[#050505] overflow-hidden"
    >
      {/* Session-Cached 5-Second SOC Preloader */}
      {!bootComplete && <SessionBoot onComplete={() => setBootComplete(true)} />}

      {/* VS Code Style Command Palette Overlay */}
      <CommandPalette />

      {/* 6-Layer Atmospheric Background System */}
      <AtmosphereLayers />

      {/* Left Operating Command Dock Navigation */}
      <SideDockNav resumeUrl={safeResumeUrl} />

      {/* Background Adaptive Performance Manager Engine */}
      <PerformanceManager />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center z-10 pl-0 lg:pl-16">
        
        {/* Mobile View Stacking Order: Artwork Image FIRST on Mobile, Left Column on Desktop */}
        <div className="order-2 md:order-1 lg:order-1 lg:col-span-5 flex flex-col justify-center text-left max-w-[720px] w-full space-y-6">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/40 w-fit font-mono backdrop-blur-md">
            <span className="pulse-dot" />
            <span className="text-[11px] uppercase tracking-widest text-accent font-bold">
              SOC WORKSTATION // ACTIVE OPERATIVE
            </span>
          </div>

          {/* Title Block with 720px max-width */}
          <div className="space-y-2 font-mono max-w-[720px] break-words">
            <h2 className="text-xs sm:text-sm text-gray-400 font-medium tracking-wide">
              HELLO, I'M
            </h2>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight break-words">
              KISHORE_NARAYANAN_K
            </h1>
          </div>

          {/* Typewriter Role Loop Sequence - Fixed height & no wrapping */}
          <div className="min-h-[52px] flex items-center font-mono whitespace-nowrap overflow-visible">
            <Typewriter />
          </div>

          {/* Bio paragraph with max 600px width */}
          <p className="text-sm sm:text-base text-gray-300 font-sans leading-relaxed max-w-[600px]">
            I build <span className="text-accent font-semibold">secure, intelligent</span> and scalable digital solutions with a strong focus on <span className="text-accent font-semibold">Cybersecurity, AI</span> and real-world impact.
          </p>

          {/* Action Buttons Row with Neon Outlines */}
          <div className="flex flex-wrap items-center gap-3.5 pt-4 font-mono">
            <a
              href="#projects"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-accent text-accent font-extrabold text-xs hover:bg-accent hover:text-[#050505] shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
            >
              <span>VIEW PROJECTS</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-accent/60 text-xs font-bold text-white hover:border-accent hover:text-accent transition-all hover:scale-[1.02]"
            >
              <Mail className="w-4 h-4 text-accent" />
              <span>CONTACT ME</span>
            </a>

            <a
              href={safeResumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-accent/60 text-xs font-bold text-white hover:border-accent hover:text-accent transition-all hover:scale-[1.02]"
            >
              <span>RESUME</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent" />
            </a>

            {/* Social Links */}
            <div className="flex items-center gap-2 ml-auto sm:ml-1">
              {profile.socials.github && (
                <a
                  href={profile.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Profile"
                  className="p-3 rounded-xl border border-accent/40 text-gray-300 hover:text-accent hover:border-accent transition-all hover:scale-105"
                >
                  <GithubIcon className="w-4 h-4" />
                </a>
              )}

              {profile.socials.linkedin && (
                <a
                  href={profile.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Profile"
                  className="p-3 rounded-xl border border-accent/40 text-gray-300 hover:text-accent hover:border-accent transition-all hover:scale-105"
                >
                  <LinkedinIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Hero Image Artwork Visual Centerpiece */}
        <div className="order-1 md:order-2 lg:order-2 lg:col-span-7 flex justify-center w-full">
          <CyberWorkstation heroImage={heroImage} />
        </div>
      </div>
    </section>
  );
}

