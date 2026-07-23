'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Home,
  UserCheck,
  Cpu,
  FolderGit2,
  Award,
  Clock,
  Mail,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Volume2,
  VolumeX,
  X,
  Terminal,
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CyberAudio } from '@/lib/CyberAudio';

export default function CommandPalette() {
  const { audioMuted, toggleAudio, performanceLevel, setPerformanceLevel } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const commands = [
    { label: 'GO TO HOME / HERO WORKSTATION', href: '#hero', icon: Home },
    { label: 'GO TO SECURITY CLEARANCE (ABOUT)', href: '#about', icon: UserCheck },
    { label: 'GO TO MOTHERBOARD HARDWARE (SKILLS)', href: '#skills', icon: Cpu },
    { label: 'GO TO DOMAIN SOFTWARE LAB (PROJECTS)', href: '#projects', icon: FolderGit2 },
    { label: 'GO TO CREDENTIAL VAULT (CERTIFICATES)', href: '#certifications', icon: Award },
    { label: 'GO TO FIBER PIPELINE (TIMELINE)', href: '#timeline', icon: Clock },
    { label: 'GO TO TRANSMISSION CONSOLE (CONTACT)', href: '#contact', icon: Mail },
    { label: 'OPEN SOC ADMIN DASHBOARD', href: '/admin/dashboard', icon: ShieldAlert },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (href: string) => {
    CyberAudio.playKeyClick(audioMuted);
    setOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = href;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#030504]/90 backdrop-blur-md flex items-start justify-center pt-20 px-4 font-mono select-none">
      <div className="max-w-xl w-full glass-panel p-4 border-accent/60 bg-[#040805] rounded-2xl space-y-4 shadow-[0_0_60px_rgba(0,255,102,0.3)] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-accent/30 pb-3 px-2">
          <Search className="w-5 h-5 text-accent flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search section (e.g. Projects, Skills, Admin)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg border border-accent/30 text-gray-400 hover:text-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-72 overflow-y-auto space-y-1">
          {filteredCommands.map((cmd, idx) => {
            const Icon = cmd.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSelect(cmd.href)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-accent/15 hover:border-accent/40 border border-transparent text-gray-300 hover:text-accent transition-all text-xs font-bold"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-accent" />
                  <span>{cmd.label}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">EXECUTE &gt;</span>
              </button>
            );
          })}
        </div>

        {/* System Settings Shortcuts Bar */}
        <div className="border-t border-accent/20 pt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-400">
          <div className="flex items-center gap-2">
            <span>PERFORMANCE:</span>
            {(['auto', 'high', 'medium', 'low'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setPerformanceLevel(lvl)}
                className={`px-2 py-0.5 rounded font-bold uppercase transition-all ${
                  performanceLevel === lvl
                    ? 'bg-accent text-[#050505]'
                    : 'bg-accent/10 text-gray-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              toggleAudio();
              CyberAudio.playKeyClick(false);
            }}
            className="flex items-center gap-1 text-accent font-bold hover:underline"
          >
            {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-gray-500" /> : <Volume2 className="w-3.5 h-3.5 text-accent" />}
            <span>{audioMuted ? 'AUDIO: OFF' : 'AUDIO: ON'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
