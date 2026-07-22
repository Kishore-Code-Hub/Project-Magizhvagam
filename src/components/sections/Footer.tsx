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
    <footer className="border-t border-purple-500/20 py-12 px-4 md:px-8 relative z-10 bg-black/60 dark:bg-[#08080b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-900/30 border border-purple-500/40 flex items-center justify-center">
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-sm font-semibold">Soundkish Portfolio</span>
        </div>

        {/* Center: Social Icons */}
        <div className="flex items-center gap-4">
          {profile.socials.github && (
            <a
              href={profile.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="p-2.5 rounded-lg glass-panel text-gray-400 hover:text-purple-300 transition-colors"
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
              className="p-2.5 rounded-lg glass-panel text-gray-400 hover:text-purple-300 transition-colors"
            >
              <LinkedinIcon className="w-4 h-4" />
            </a>
          )}
          {profile.socials.email && (
            <a
              href={profile.socials.email}
              aria-label="Email"
              className="p-2.5 rounded-lg glass-panel text-gray-400 hover:text-purple-300 transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Right: Copyright & Back To Top */}
        <div className="flex items-center gap-6">
          <span className="text-xs text-gray-500">
            © {new Date().getFullYear()} Soundkish. All rights reserved.
          </span>

          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="p-2.5 rounded-xl glass-panel text-purple-400 hover:text-purple-300 transition-all hover:scale-105"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
