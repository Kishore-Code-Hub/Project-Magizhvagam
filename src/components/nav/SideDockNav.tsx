'use client';

import React, { useState, useEffect } from 'react';
import {
  Home,
  UserCheck,
  Cpu,
  FolderGit2,
  Award,
  Clock,
  Mail,
  ExternalLink,
  ShieldAlert,
  Volume2,
  VolumeX,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CyberAudio } from '@/lib/CyberAudio';

interface SideDockNavProps {
  resumeUrl?: string;
}

export default function SideDockNav({ resumeUrl = 'https://drive.google.com' }: SideDockNavProps) {
  const { audioMuted, toggleAudio } = useTheme();
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileOpen, setMobileOpen] = useState(false);

  const dockItems = [
    { label: 'HOME', href: '#hero', icon: Home, id: 'hero' },
    { label: 'ABOUT', href: '#about', icon: UserCheck, id: 'about' },
    { label: 'SKILLS', href: '#skills', icon: Cpu, id: 'skills' },
    { label: 'PROJECTS', href: '#projects', icon: FolderGit2, id: 'projects' },
    { label: 'CERTIFICATIONS', href: '#certifications', icon: Award, id: 'certifications' },
    { label: 'TIMELINE', href: '#timeline', icon: Clock, id: 'timeline' },
    { label: 'CONTACT', href: '#contact', icon: Mail, id: 'contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 300;
      for (const item of dockItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleItemClick = () => {
    CyberAudio.playKeyClick(audioMuted);
    setMobileOpen(false);
  };

  return (
    <>
      {/* --- DESKTOP DOCK (Permanently visible slim strip expanding on hover) --- */}
      <aside className="hidden lg:flex fixed left-5 top-1/2 -translate-y-1/2 z-50 flex-col items-start font-mono">
        <div className="w-[68px] hover:w-[230px] glass-panel p-2.5 rounded-2xl border-accent/40 bg-[#040605]/95 backdrop-blur-2xl flex flex-col gap-2 shadow-[0_0_35px_rgba(0,0,0,0.9)] transition-all duration-300 ease-out group/dock overflow-hidden select-none">
          {/* Top SOC Indicator */}
          <div className="flex items-center gap-3 px-3 py-2 border-b border-accent/20 text-accent font-bold text-[10px]">
            <div className="relative flex items-center justify-center flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            </div>
            <span className="opacity-0 group-hover/dock:opacity-100 transition-opacity duration-200 whitespace-nowrap uppercase tracking-wider">
              SOC COMMAND
            </span>
          </div>

          {/* Navigation Items */}
          {dockItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeSection === item.id;

            return (
              <a
                key={item.id}
                href={item.href}
                onClick={handleItemClick}
                className={cn(
                  'flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all relative text-xs font-bold group/item',
                  isActive
                    ? 'bg-accent/15 text-accent border border-accent/50 shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <IconComp className="w-4 h-4 text-accent group-hover/item:scale-110 transition-transform" />
                </div>

                <span className="opacity-0 group-hover/dock:opacity-100 transition-opacity duration-200 whitespace-nowrap uppercase tracking-widest text-[11px]">
                  {item.label}
                </span>
              </a>
            );
          })}

          {/* External Links: Resume & Admin */}
          <div className="border-t border-accent/20 pt-2 flex flex-col gap-1">
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleItemClick}
              className="flex items-center gap-3.5 px-3 py-2 rounded-xl text-gray-300 hover:text-accent hover:bg-accent/10 transition-all font-mono text-[11px] font-bold"
            >
              <ExternalLink className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="opacity-0 group-hover/dock:opacity-100 transition-opacity duration-200 whitespace-nowrap uppercase tracking-widest">
                RESUME
              </span>
            </a>

            <a
              href="/admin/dashboard"
              onClick={handleItemClick}
              className="flex items-center gap-3.5 px-3 py-2 rounded-xl text-gray-300 hover:text-accent hover:bg-accent/10 transition-all font-mono text-[11px] font-bold"
            >
              <ShieldAlert className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="opacity-0 group-hover/dock:opacity-100 transition-opacity duration-200 whitespace-nowrap uppercase tracking-widest">
                ADMIN DOCK
              </span>
            </a>

            {/* Audio Toggle Button */}
            <button
              onClick={() => {
                toggleAudio();
                CyberAudio.playKeyClick(false);
              }}
              className="flex items-center gap-3.5 px-3 py-2 rounded-xl text-gray-400 hover:text-accent hover:bg-accent/10 transition-all text-[11px] font-bold"
            >
              {audioMuted ? (
                <VolumeX className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 text-accent flex-shrink-0 animate-pulse" />
              )}
              <span className="opacity-0 group-hover/dock:opacity-100 transition-opacity duration-200 whitespace-nowrap uppercase tracking-widest">
                {audioMuted ? 'AUDIO: OFF' : 'AUDIO: ON'}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE DOCK (Floating expandable circular menu at bottom-left) --- */}
      <div className="lg:hidden fixed bottom-5 left-5 z-50 font-mono">
        {mobileOpen && (
          <div className="mb-3 glass-panel p-3 rounded-2xl border-accent/50 bg-[#050806]/95 backdrop-blur-2xl flex flex-col gap-2 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
            {dockItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={handleItemClick}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold',
                    isActive ? 'bg-accent/20 text-accent border border-accent/40' : 'text-gray-300 hover:text-white'
                  )}
                >
                  <IconComp className="w-4 h-4 text-accent" />
                  <span>{item.label}</span>
                </a>
              );
            })}
            <div className="border-t border-accent/20 pt-2 flex flex-col gap-1.5 text-xs">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleItemClick}
                className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-accent font-bold"
              >
                <ExternalLink className="w-4 h-4 text-accent" />
                <span>RESUME</span>
              </a>
              <a
                href="/admin/dashboard"
                onClick={handleItemClick}
                className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-accent font-bold"
              >
                <ShieldAlert className="w-4 h-4 text-accent" />
                <span>ADMIN</span>
              </a>
            </div>
          </div>
        )}

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-12 h-12 rounded-full glass-panel border-accent text-accent flex items-center justify-center shadow-2xl bg-[#050505] active:scale-95 transition-transform"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </>
  );
}
