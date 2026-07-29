'use client';

import React from 'react';
import Typewriter from '@/components/animation/Typewriter';
import CyberWorkstation from '@/components/3d/CyberWorkstation';
import SideDockNav from '@/components/nav/SideDockNav';
import PerformanceManager from '@/components/ui/PerformanceManager';
import CommandPalette from '@/components/ui/CommandPalette';
import { ArrowRight, Mail, ExternalLink } from 'lucide-react';
import { GithubIcon, LinkedinIcon, LeetCodeIcon } from '@/components/ui/Icons';
import { ProfileData } from '@/types';
import { getSocials } from '@/lib/social-utils';

interface HeroProps {
  profile: ProfileData;
}

function HeroComponent({ profile }: HeroProps) {
  const socials = getSocials(profile.socials);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Hero Component] profile prop:', profile);
    console.log('[Hero Component] profile.socials:', profile?.socials);
    console.log('[Hero Component] resolved socials:', socials);
  }

  const safeResumeUrl = profile.resumeUrl || 'https://drive.google.com';

  // Read hero image and greeting settings if stored in profile.stats
  const heroImage = (profile.stats as any)?.heroImage || '/Hero-section-banner.webp';
  const greetingText = (profile.stats as any)?.greeting || 'Welcome to my Hackspot';

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] w-full flex items-center justify-center pt-14 sm:pt-16 md:pt-20 pb-12 md:pb-20 px-4 sm:px-8 md:px-12 bg-transparent overflow-hidden"
    >
      {/* VS Code Style Command Palette Overlay */}
      <CommandPalette />

      {/* Left Operating Command Dock Navigation */}
      <SideDockNav resumeUrl={safeResumeUrl} greetingText={greetingText} />

      {/* Background Adaptive Performance Manager Engine */}
      <PerformanceManager />

      <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch z-10 pl-0 lg:pl-16">
        
        {/* Left Column (45% / 5 cols on lg, 50% on md): Text Content */}
        <div className="order-1 md:order-1 lg:order-1 md:col-span-1 lg:col-span-5 flex flex-col justify-between text-left w-full p-6 sm:p-8 rounded-[24px] bg-[rgba(10,12,14,0.45)] backdrop-blur-[24px] border border-[rgba(0,255,120,0.18)] shadow-[0_30px_80px_rgba(0,255,100,0.1)] space-y-6">
          {/* Plain Text Greeting */}
          <div className="w-full text-center md:text-left font-mono text-sm sm:text-base tracking-wide text-accent/90 font-medium select-none animate-in fade-in duration-700">
            {greetingText}
          </div>

          {/* Title Block */}
          <div className="space-y-1.5 font-mono w-full break-words">
            <h2 className="text-xs sm:text-sm text-gray-400 font-medium tracking-wide">
              HELLO, I'M
            </h2>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight break-words uppercase">
              {profile.name || 'KISHORE_NARAYANAN_K'}
            </h1>
          </div>

          {/* Typewriter Role Loop Sequence */}
          <div className="min-h-[48px] sm:min-h-[56px] flex items-center font-mono max-w-full overflow-visible">
            <Typewriter words={profile.taglines} />
          </div>

          {/* Bio paragraph */}
          <p className="text-sm sm:text-base text-gray-300 font-sans leading-relaxed max-w-[640px]">
            {profile.bio || profile.headline || 'I build secure, intelligent and scalable digital solutions with a strong focus on Cybersecurity, AI and real-world impact.'}
          </p>

          {/* Prominent LinkedIn CTA Button */}
          <div className="pt-1">
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Connect with me on LinkedIn"
              title="Connect with me on LinkedIn"
              className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#0A66C2] text-white border border-[#0A66C2] font-medium text-xs sm:text-sm hover:bg-white hover:text-[#0A66C2] hover:border-[#0A66C2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] transition-all duration-200 ease-in-out shadow-[0_4px_15px_rgba(10,102,194,0.35)] hover:shadow-[0_6px_20px_rgba(10,102,194,0.5)] transform hover:-translate-y-0.5 cursor-pointer"
            >
              <LinkedinIcon className="w-4 h-4 shrink-0 fill-current" />
              <span>Connect with me on LinkedIn</span>
            </a>
          </div>

          {/* Action Buttons Row Grid Container */}
          <div className="space-y-4 pt-2 font-mono">
            {/* Primary Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-accent/60 text-xs font-bold text-white hover:border-accent hover:text-accent transition-all hover:scale-[1.02] bg-[#040705]/60 backdrop-blur-md"
              >
                <Mail className="w-4 h-4 text-accent" />
                <span>CONTACT ME</span>
              </a>

              <a
                href={safeResumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-accent/60 text-xs font-bold text-white hover:border-accent hover:text-accent transition-all hover:scale-[1.02] bg-[#040705]/60 backdrop-blur-md"
              >
                <span>RESUME</span>
                <ExternalLink className="w-3.5 h-3.5 text-accent" />
              </a>

              <a
                href="#projects"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-accent text-accent font-extrabold text-xs hover:bg-accent hover:text-[#050505] shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] bg-[#040705]/80 backdrop-blur-md"
              >
                <span>VIEW PROJECTS</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Dedicated Horizontal Social Links Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">CONNECT:</span>
              <div className="flex items-center gap-2.5">
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Profile"
                  title="GitHub Profile"
                  className="p-2.5 rounded-xl border border-accent/50 text-gray-300 hover:text-accent hover:border-accent hover:shadow-[0_0_15px_rgba(0,255,102,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-300 hover:scale-110 bg-[#040705]/60 backdrop-blur-md cursor-pointer"
                >
                  <GithubIcon className="w-4 h-4" />
                </a>

                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Profile"
                  title="LinkedIn Profile"
                  className="p-2.5 rounded-xl border border-accent/50 text-gray-300 hover:text-accent hover:border-accent hover:shadow-[0_0_15px_rgba(0,255,102,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-300 hover:scale-110 bg-[#040705]/60 backdrop-blur-md cursor-pointer"
                >
                  <LinkedinIcon className="w-4 h-4" />
                </a>

                <a
                  href={socials.leetcode}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LeetCode Profile"
                  title="LeetCode Profile"
                  className="p-2.5 rounded-xl border border-accent/50 text-gray-300 hover:text-accent hover:border-accent hover:shadow-[0_0_15px_rgba(0,255,102,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-300 hover:scale-110 bg-[#040705]/60 backdrop-blur-md cursor-pointer"
                >
                  <LeetCodeIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (55% / 7 cols on lg, 50% on md): Hero Image Artwork */}
        <div className="order-2 md:order-2 lg:order-2 md:col-span-1 lg:col-span-7 flex justify-center w-full h-full items-stretch">
          <CyberWorkstation heroImage={heroImage} />
        </div>
      </div>
    </section>
  );
}

const Hero = React.memo(HeroComponent);
export default Hero;

