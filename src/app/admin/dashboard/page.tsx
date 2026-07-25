'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { CyberBadge } from '@/components/ui/CyberBadge';
import {
  LayoutDashboard,
  Eye,
  Inbox,
  FolderGit2,
  Cpu,
  Award,
  Calendar,
  Sparkles,
  Palette,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalViews: 0,
    messagesCount: 0,
    projectClicks: 0,
    resumeDownloads: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data.summary) setStats(data.summary);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 text-left font-mono">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-accent)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-ping" />
            <span className="text-xs text-[var(--accent-color)] uppercase font-bold">Admin CMS Control Plane</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">SYSTEM DASHBOARD</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/appearance">
            <GlowButton variant="secondary" size="sm" leftIcon={<Palette className="w-4 h-4" />}>
              Appearance Editor
            </GlowButton>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <GlowButton variant="primary" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
              Live Portfolio
            </GlowButton>
          </a>
        </div>
      </div>

      {/* Quick Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard variant="glow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase font-bold">Portfolio Views</span>
            <Eye className="w-5 h-5 text-[var(--accent-color)]" />
          </div>
          <div className="text-3xl font-extrabold text-white">{loading ? '...' : stats.totalViews}</div>
          <div className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Real-time Telemetry
          </div>
        </GlassCard>

        <GlassCard variant="glow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase font-bold">Unread Messages</span>
            <Inbox className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{loading ? '...' : stats.messagesCount}</div>
          <Link href="/admin/contact" className="text-[10px] text-cyan-400 mt-2 block hover:underline">
            View System Inbox &rarr;
          </Link>
        </GlassCard>

        <GlassCard variant="glow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase font-bold">Project Clicks</span>
            <FolderGit2 className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{loading ? '...' : stats.projectClicks}</div>
          <Link href="/admin/projects" className="text-[10px] text-amber-400 mt-2 block hover:underline">
            Manage Projects &rarr;
          </Link>
        </GlassCard>

        <GlassCard variant="glow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase font-bold">Resume Downloads</span>
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{loading ? '...' : stats.resumeDownloads}</div>
          <div className="text-[10px] text-gray-400 mt-2">PDF Document Telemetry</div>
        </GlassCard>
      </div>

      {/* Quick Navigation Module Grid */}
      <h3 className="text-lg font-bold text-white uppercase tracking-wider">CMS Content Modules</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Hero & Identity', href: '/admin/hero', desc: 'Edit headline, role typing loop, profile image, and CTA links.', icon: Sparkles },
          { title: 'About Engineer', href: '/admin/about', desc: 'Manage biography, professional identity, tech philosophy, and values.', icon: Sparkles },
          { title: 'Technical Skills', href: '/admin/skills', desc: 'Add/Edit skills, logos, categories, and proficiency levels.', icon: Cpu },
          { title: 'Featured Projects', href: '/admin/projects', desc: 'Manage showcase projects, galleries, metrics, and documentation URLs.', icon: FolderGit2 },
          { title: 'Career Timeline', href: '/admin/timeline', desc: 'Edit milestones, education, experience, and research entries.', icon: Calendar },
          { title: 'Certifications', href: '/admin/certificates', icon: Award, desc: 'Manage certificates, issuer logos, credential verification URLs.' },
        ].map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <Link key={idx} href={mod.href}>
              <GlassCard variant="interactive" className="h-full flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-color)] mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{mod.title}</h4>
                  <p className="text-xs text-gray-400 font-sans leading-relaxed">{mod.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 text-xs text-[var(--accent-color)] flex items-center justify-between">
                  <span>Configure Module</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
