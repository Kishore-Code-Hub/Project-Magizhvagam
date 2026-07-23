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

  // Read hero image and greeting settings if stored in profile.stats
  const heroImage = (profile.stats as any)?.heroImage || '/Hero-section-banner.jfif';
  const greetingText = (profile.stats as any)?.greeting || 'Welcome to my Hackspot';

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] w-full flex items-center justify-center pt-14 sm:pt-16 md:pt-20 pb-12 md:pb-20 px-4 sm:px-8 md:px-12 bg-[#050505] overflow-hidden"
    >
      {/* Session-Cached 5-Second SOC Preloader */}
      {!bootComplete && <SessionBoot onComplete={() => setBootComplete(true)} />}

      {/* VS Code Style Command Palette Overlay */}
      <CommandPalette />

      {/* 6-Layer Atmospheric Background System */}
      <AtmosphereLayers />

      {/* Left Operating Command Dock Navigation */}
      <SideDockNav resumeUrl={safeResumeUrl} greetingText={greetingText} />

      {/* Background Adaptive Performance Manager Engine */}
      <PerformanceManager />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-14 xl:gap-20 items-center z-10 pl-0 lg:pl-16">
        
        {/* Mobile View Stacking Order: Text Content FIRST (order-1), Hero Banner SECOND (order-2) */}
        <div className="order-1 md:order-1 lg:order-1 lg:col-span-5 flex flex-col justify-center text-left max-w-[720px] w-full space-y-4 sm:space-y-5 md:space-y-6">
          {/* Plain Text Greeting - Centered on Mobile, Left-aligned on Desktop (No Pill/Border/Background) */}
          <div className="w-full text-center md:text-left font-mono text-sm sm:text-base tracking-wide text-accent/90 font-medium select-none animate-in fade-in duration-700 mt-2 md:mt-0">
            {greetingText}
          </div>

          {/* Title Block with 720px max-width */}
          <div className="space-y-1.5 font-mono max-w-[720px] break-words">
            <h2 className="text-xs sm:text-sm text-gray-400 font-medium tracking-wide">
              HELLO, I'M
            </h2>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight break-words">
              KISHORE_NARAYANAN_K
            </h1>
          </div>

          {/* Typewriter Role Loop Sequence - Fixed height & no wrapping */}
          <div className="min-h-[44px] sm:min-h-[52px] flex items-center font-mono whitespace-nowrap overflow-visible">
            <Typewriter />
          </div>

          {/* Bio paragraph with max 600px width */}
          <p className="text-sm sm:text-base text-gray-300 font-sans leading-relaxed max-w-[600px]">
            I build <span className="text-accent font-semibold">secure, intelligent</span> and scalable digital solutions with a strong focus on <span className="text-accent font-semibold">Cybersecurity, AI</span> and real-world impact.
          </p>

          {/* Action Buttons Row Grid Container */}
          <div className="space-y-3 pt-2 sm:pt-3 font-mono">
            {/* Row 1: Contact Me, Resume, GitHub Icon, LinkedIn Icon on Desktop */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-accent/60 text-xs font-bold text-white hover:border-accent hover:text-accent transition-all hover:scale-[1.02] bg-[#040705]/60 backdrop-blur-md"
              >
                <Mail className="w-4 h-4 text-accent" />
                <span>CONTACT ME</span>
              </a>

              <a
                href={safeResumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-accent/60 text-xs font-bold text-white hover:border-accent hover:text-accent transition-all hover:scale-[1.02] bg-[#040705]/60 backdrop-blur-md"
              >
                <span>RESUME</span>
                <ExternalLink className="w-3.5 h-3.5 text-accent" />
              </a>

              {/* Social Icon Buttons matched to minimal outline button style */}
              <div className="flex items-center gap-2">
                {profile.socials.github && (
                  <a
                    href={profile.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub Profile"
                    className="p-2.5 rounded-xl border border-accent/60 text-gray-300 hover:text-accent hover:border-accent transition-all hover:scale-105 bg-[#040705]/60 backdrop-blur-md"
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
                    className="p-2.5 rounded-xl border border-accent/60 text-gray-300 hover:text-accent hover:border-accent transition-all hover:scale-105 bg-[#040705]/60 backdrop-blur-md"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Row 2: VIEW PROJECTS button aligned to the left directly below */}
            <div>
              <a
                href="#projects"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-accent text-accent font-extrabold text-xs hover:bg-accent hover:text-[#050505] shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] bg-[#040705]/80 backdrop-blur-md"
              >
                <span>VIEW PROJECTS</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Hero Image Artwork placed SECOND (order-2) on mobile */}
        <div className="order-2 md:order-2 lg:order-2 lg:col-span-7 flex justify-center w-full">
          <CyberWorkstation heroImage={heroImage} />
        </div>
      </div>
    </section>
  );
}

