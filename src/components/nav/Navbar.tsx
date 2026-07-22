'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Menu, X, ExternalLink, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/ThemeProvider';

interface NavbarProps {
  resumeUrl?: string;
}

const NAV_ITEMS = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Certifications', href: '#certifications' },
  { label: 'Timeline', href: '#timeline' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar({ resumeUrl = 'https://drive.google.com' }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const safeResumeUrl = resumeUrl || 'https://drive.google.com';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      const sections = NAV_ITEMS.map((item) => (item?.href ?? '').substring(1));
      for (const sectionId of sections) {
        if (!sectionId) continue;
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-8 py-4',
        scrolled
          ? 'bg-black/60 dark:bg-[#08080b]/80 backdrop-blur-md border-b border-purple-500/20 shadow-lg shadow-purple-950/10 py-3'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="#hero" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/40 flex items-center justify-center group-hover:border-purple-500/80 transition-colors">
            <Shield className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white dark:text-white light:text-gray-900 group-hover:text-purple-400 transition-colors">
              Soundkish
            </span>
            <span className="text-[10px] uppercase tracking-wider text-purple-400 font-medium">
              Cybersecurity Enthusiast
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/[0.04] dark:bg-white/[0.03] light:bg-black/[0.04] border border-purple-500/30 rounded-full px-4 py-1.5 backdrop-blur-md">
          {NAV_ITEMS.map((item) => {
            const sectionId = (item?.href ?? '').substring(1);
            const isActive = activeSection === sectionId;
            return (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  'px-3.5 py-1.5 text-sm font-medium rounded-full transition-all relative',
                  isActive
                    ? 'text-purple-400 font-semibold'
                    : 'text-gray-400 hover:text-purple-300 hover:bg-purple-500/10'
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Action Buttons: Theme Toggle + Resume */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Theme Toggle Switch */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className="p-2.5 rounded-xl glass-panel text-gray-300 hover:text-white transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-purple-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
            )}
          </button>

          {/* Resume Button */}
          <a
            href={safeResumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-900/30 hover:shadow-purple-700/50 transition-all transform hover:-translate-y-0.5"
          >
            <span>Resume</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile Hamburger & Theme Toggle Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl glass-panel text-gray-300"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-purple-600" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="p-2 rounded-xl glass-panel text-gray-300"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[70px] p-4 bg-[#08080b]/95 dark:bg-[#08080b]/95 light:bg-[#f8f8fa]/95 backdrop-blur-xl border-b border-purple-500/30 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-top-4 duration-200">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-base font-medium rounded-xl text-gray-300 hover:text-purple-300 hover:bg-purple-500/10 flex items-center justify-between"
            >
              <span>{item.label}</span>
              <span className="text-purple-400 text-xs">→</span>
            </a>
          ))}
          <a
            href={safeResumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 w-full py-3 text-center rounded-xl bg-purple-600 text-white font-medium flex items-center justify-center gap-2"
          >
            <span>Resume</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </header>
  );
}
