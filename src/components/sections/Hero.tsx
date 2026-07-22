'use client';

import React, { useState } from 'react';
import Typewriter from '@/components/animation/Typewriter';
import CyberWorkstation from '@/components/3d/CyberWorkstation';
import MatrixRain from '@/components/animation/MatrixRain';
import VolumetricFog from '@/components/animation/VolumetricFog';
import SessionBoot from '@/components/animation/SessionBoot';
import SideDockNav from '@/components/nav/SideDockNav';
import PerformanceManager from '@/components/ui/PerformanceManager';
import { ArrowRight, Mail, ChevronDown, ExternalLink } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';
import { ProfileData } from '@/types';

interface HeroProps {
  profile: ProfileData;
}

export default function Hero({ profile }: HeroProps) {
  const [bootComplete, setBootComplete] = useState(false);
  const safeResumeUrl = profile.resumeUrl || 'https://drive.google.com';

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] w-full flex items-center justify-center pt-12 pb-8 px-4 md:px-8 circuit-grid overflow-hidden"
    >
      {/* 1-Time Session BIOS Boot Sequence */}
      {!bootComplete && <SessionBoot onComplete={() => setBootComplete(true)} />}

      {/* 3-Layered Matrix Atmosphere & Volumetric Smoke */}
      <MatrixRain />
      <VolumetricFog />

      {/* Left Vertical Glowing Command Dock Navigation */}
      <SideDockNav resumeUrl={safeResumeUrl} />

      {/* Floating GPU Performance HUD */}
      <PerformanceManager />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 py-6 pl-0 lg:pl-16">
        {/* Left Column (5 cols / 42%): Intro & Typing Effect */}
        <div className="lg:col-span-5 flex flex-col gap-5 text-left">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/40 w-fit backdrop-blur-md">
            <span className="pulse-dot" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-accent font-bold">
              SOC WORKSTATION // ACTIVE OPERATIVE
            </span>
          </div>

          {/* Large Title */}
          <div className="space-y-1 font-mono">
            <h2 className="text-sm sm:text-base text-gray-400 font-medium tracking-wide">
              HELLO, I'M
            </h2>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none">
              KISHORE_NARAYANAN_K
            </h1>
          </div>

          {/* Typewriter Role Loop Sequence */}
          <div className="min-h-[44px] flex items-center">
            <Typewriter />
          </div>

          {/* Bio paragraph */}
          <p className="text-sm sm:text-base text-gray-300 font-sans leading-relaxed max-w-lg">
            I build <span className="text-accent font-semibold">secure, intelligent</span> and scalable digital solutions with a strong focus on <span className="text-accent font-semibold">Cybersecurity, AI</span> and real-world impact.
          </p>

          {/* Action Buttons Row with Neon Outlines */}
          <div className="flex flex-wrap items-center gap-3 pt-2 font-mono">
            {/* View Projects Button */}
            <a
              href="#projects"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-accent text-accent font-extrabold text-xs hover:bg-accent hover:text-[#050505] shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
            >
              <span>VIEW PROJECTS</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            {/* Contact Me Button */}
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-accent/60 text-xs font-bold text-white hover:border-accent hover:text-accent transition-all hover:scale-[1.02]"
            >
              <Mail className="w-4 h-4 text-accent" />
              <span>CONTACT ME</span>
            </a>

            {/* Resume Button */}
            <a
              href={safeResumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-accent/60 text-xs font-bold text-white hover:border-accent hover:text-accent transition-all hover:scale-[1.02]"
            >
              <span>RESUME</span>
              <ExternalLink className="w-3.5 h-3.5 text-accent" />
            </a>

            {/* Social Link Pills */}
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

        {/* Right Column (7 cols / 58%): Real 3D Cyber Operations Workstation */}
        <div className="lg:col-span-7 flex justify-center">
          <CyberWorkstation />
        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <a
        href="#about"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 hover:text-accent transition-colors cursor-pointer group z-10 font-mono"
      >
        <span className="text-[10px] uppercase tracking-widest font-semibold">ENTER SOC WORKSPACE</span>
        <ChevronDown className="w-4 h-4 animate-bounce text-accent" />
      </a>
    </section>
  );
}
