'use client';

import React from 'react';
import { Shield, Mail, ArrowUp } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';
import { ProfileData } from '@/types';

interface FooterProps {
  profile: ProfileData;
}

export default function Footer({ profile }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-accent/20 py-12 px-4 md:px-8 relative z-10 bg-[#050505]/95 backdrop-blur-xl font-mono">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pl-0 lg:pl-16">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/40 flex items-center justify-center">
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            KISHORE // CYBERSECURITY SOC WORKSTATION v3.6
          </span>
        </div>

        {/* Center: Social Icons */}
        <div className="flex items-center gap-3">
          {profile.socials.github && (
            <a
              href={profile.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="p-2.5 rounded-lg glass-panel border-accent/30 text-gray-400 hover:text-accent transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          )}
          {profile.socials.linkedin && (
            <a
              href={profile.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="p-2.5 rounded-lg glass-panel border-accent/30 text-gray-400 hover:text-accent transition-colors"
            >
              <LinkedinIcon className="w-4 h-4" />
            </a>
          )}
          {profile.socials.email && (
            <a
              href={profile.socials.email}
              aria-label="Email"
              className="p-2.5 rounded-lg glass-panel border-accent/30 text-gray-400 hover:text-accent transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Right: Copyright & Back To Top */}
        <div className="flex items-center gap-6 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} KISHORE. ALL RIGHTS RESERVED.</span>

          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="p-2.5 rounded-xl glass-panel border-accent/40 text-accent hover:bg-accent/10 transition-all hover:scale-105"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
