'use client';

import React from 'react';
import Typewriter from '@/components/animation/Typewriter';
import QuantumCyberShield from '@/components/3d/QuantumCyberShield';
import MatrixRain from '@/components/animation/MatrixRain';
import { ArrowRight, Mail, ChevronDown, ExternalLink } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';
import { ProfileData } from '@/types';

interface HeroProps {
  profile: ProfileData;
}

export default function Hero({ profile }: HeroProps) {
  const safeResumeUrl = profile.resumeUrl || 'https://drive.google.com';

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] w-full flex items-center justify-center pt-24 pb-12 px-4 md:px-8 circuit-grid overflow-hidden"
    >
      {/* Matrix Digital Binary Rain Overlay */}
      <MatrixRain />

      {/* Aurora Ambient Background Glow */}
      <div className="aurora-blob aurora-purple w-[500px] h-[500px] top-[-10%] left-[-10%]" />
      <div className="aurora-blob aurora-blue w-[450px] h-[450px] bottom-[-10%] right-[-10%]" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Column: Intro & Animated Role Typist */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          {/* Eyebrow Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-purple-500/30 w-fit backdrop-blur-md">
            <span className="pulse-dot" />
            <span className="text-xs uppercase tracking-widest text-purple-400 font-semibold">
              CYBERSECURITY ENTHUSIAST & AI ARCHITECT
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Securing Systems.{' '}
            <span className="text-gradient">Building Trust.</span>
          </h1>

          {/* Animated Typist */}
          <div className="text-xl sm:text-2xl font-medium flex items-center gap-2.5 min-h-[40px]">
            <span className="text-gray-400 font-normal">Hi, I'm</span>
            <Typewriter />
          </div>

          {/* Bio paragraph */}
          <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-2xl">
            {profile.bio}
          </p>

          {/* CTA Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* View Projects Button */}
            <a
              href="#projects"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-purple-950/40 hover:shadow-purple-700/60 hover:scale-[1.02] transition-all"
            >
              <span>View Projects</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            {/* Contact Me Button */}
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl glass-panel text-sm font-medium hover:scale-[1.02] transition-all"
            >
              <Mail className="w-4 h-4 text-purple-400" />
              <span>Contact Me</span>
            </a>

            {/* Resume Button */}
            <a
              href={safeResumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl glass-panel text-sm font-medium hover:scale-[1.02] transition-all"
            >
              <span>Resume</span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            </a>

            {/* Social Link Pills */}
            <div className="flex items-center gap-2 ml-auto sm:ml-2">
              {profile.socials.github && (
                <a
                  href={profile.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Profile"
                  className="p-3.5 rounded-xl glass-panel text-gray-300 hover:text-white transition-all hover:scale-105"
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
                  className="p-3.5 rounded-xl glass-panel text-gray-300 hover:text-white transition-all hover:scale-105"
                >
                  <LinkedinIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 3D Holographic Quantum Cyber Shield */}
        <div className="lg:col-span-5 flex justify-center">
          <QuantumCyberShield />
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <a
        href="#about"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 hover:text-purple-300 transition-colors cursor-pointer group"
      >
        <span className="text-[11px] uppercase tracking-widest font-medium">Scroll Down</span>
        <ChevronDown className="w-4 h-4 animate-bounce text-purple-400" />
      </a>
    </section>
  );
}
