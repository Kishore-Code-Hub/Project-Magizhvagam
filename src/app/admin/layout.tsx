'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  User,
  Cpu,
  FolderGit2,
  Calendar,
  Award,
  Inbox,
  Image as ImageIcon,
  Palette,
  Terminal,
  Activity,
  Search,
  BarChart3,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // If on login page, render children without sidebar layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Hero & Identity', href: '/admin/hero', icon: Sparkles },
    { label: 'About Engineer', href: '/admin/about', icon: User },
    { label: 'Technical Skills', href: '/admin/skills', icon: Cpu },
    { label: 'Featured Projects', href: '/admin/projects', icon: FolderGit2 },
    { label: 'Career Timeline', href: '/admin/timeline', icon: Calendar },
    { label: 'Certifications', href: '/admin/certificates', icon: Award },
    { label: 'Messages / Inbox', href: '/admin/contact', icon: Inbox },
    { label: 'Media Library', href: '/admin/media', icon: ImageIcon },
    { label: 'Visual Appearance', href: '/admin/appearance', icon: Palette },
    { label: 'Matrix Engine', href: '/admin/matrix', icon: Terminal },
    { label: 'System Diagnostics', href: '/admin/diagnostics', icon: Activity },
    { label: 'SEO Manager', href: '/admin/seo', icon: Search },
    { label: 'Analytics Telemetry', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Security & Audit', href: '/admin/security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <aside
        className={`bg-[#0a0e0b] border-r border-[var(--border-accent)] flex flex-col justify-between transition-all duration-300 z-30 sticky top-0 h-screen ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-color)] animate-ping" />
                <span className="font-mono font-bold text-sm tracking-wider text-[var(--accent-color)]">
                  CYBER_CMS
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white mx-auto cursor-pointer"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-xs transition-all ${
                    isActive
                      ? 'bg-[var(--accent-color)] text-black font-bold shadow-[var(--shadow-accent-glow)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-xs text-gray-400 hover:text-[var(--accent-color)] hover:bg-white/5 transition-all"
            title="View Public Site"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Public Site</span>}
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-mono text-xs text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
