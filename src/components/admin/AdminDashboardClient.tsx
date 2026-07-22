'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  LogOut,
  LayoutDashboard,
  User,
  FolderGit2,
  Mail,
  ShieldAlert,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

interface Props {
  session: { email: string };
  profile: any;
  projects: any[];
  skills: any[];
  messages: any[];
  auditLogs: any[];
}

export default function AdminDashboardClient({
  session,
  profile: initialProfile,
  projects: initialProjects,
  skills: initialSkills,
  messages: initialMessages,
  auditLogs,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'projects' | 'messages' | 'audit'>('overview');

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: initialProfile?.name || 'Soundkish',
    headline: initialProfile?.headline || 'Securing Systems. Building Trust.',
    bio: initialProfile?.bio || '',
    resumeUrl: initialProfile?.resumeUrl || 'https://drive.google.com',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // New Project Form
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tags: 'FastAPI, Python, Security',
    githubUrl: '',
    liveUrl: '',
  });

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = newProject.tags.split(',').map((t) => t.trim());
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProject, tags: tagsArray }),
      });
      if (res.ok) {
        setShowAddProject(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    await fetch(`/api/admin/projects?id=${id}`, { method: 'DELETE' });
    router.refresh();
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Delete this contact message?')) return;
    await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-mono bg-[#050505] text-white">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#040705] border-r border-accent/30 p-6 flex flex-col justify-between space-y-8 select-none">
        <div className="space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">SOC ADMIN</h2>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                AUTHENTICATED
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
              { id: 'profile', label: 'PROFILE & COPY', icon: User },
              { id: 'projects', label: 'PROJECTS (CRUD)', icon: FolderGit2 },
              { id: 'messages', label: `MESSAGES (${initialMessages.length})`, icon: Mail },
              { id: 'audit', label: 'AUDIT LOGS', icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-accent/20 border border-accent text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.25)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 text-accent" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Badge & Logout */}
        <div className="pt-4 border-t border-accent/20 space-y-3">
          <div className="text-[11px] text-gray-400 truncate">
            LOGGED AS: <span className="text-accent font-mono font-bold">{session.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/40 text-rose-400 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>TERMINATE SESSION</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-extrabold text-white">SOC SYSTEM OVERVIEW</h1>
              <p className="text-xs text-gray-400">Live operational metrics and workstation statistics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="glass-panel p-6 space-y-2 border-accent/30 bg-[#040705]/90 rounded-2xl">
                <span className="text-xs text-gray-400 font-bold">TOTAL MESSAGES</span>
                <p className="text-3xl font-extrabold text-accent">{initialMessages.length}</p>
              </div>
              <div className="glass-panel p-6 space-y-2 border-accent/30 bg-[#040705]/90 rounded-2xl">
                <span className="text-xs text-gray-400 font-bold">ACTIVE PROJECTS</span>
                <p className="text-3xl font-extrabold text-accent">{initialProjects.length}</p>
              </div>
              <div className="glass-panel p-6 space-y-2 border-accent/30 bg-[#040705]/90 rounded-2xl">
                <span className="text-xs text-gray-400 font-bold">TECH SKILLS</span>
                <p className="text-3xl font-extrabold text-accent">{initialSkills.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-extrabold text-white">EDIT PROFILE & RESUME LINK</h1>
              <p className="text-xs text-gray-400">Update public copy without touching codebase</p>
            </div>

            <form onSubmit={handleSaveProfile} className="glass-panel p-8 space-y-6 border-accent/30 bg-[#040705]/90 rounded-2xl">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">OPERATIVE NAME</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-3 glass-input text-xs font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">HEADLINE</label>
                <input
                  type="text"
                  value={profileForm.headline}
                  onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                  className="w-full px-4 py-3 glass-input text-xs font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">STATEMENT / BIO</label>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-4 py-3 glass-input text-xs font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">EXTERNAL RESUME URL</label>
                <input
                  type="url"
                  value={profileForm.resumeUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, resumeUrl: e.target.value })}
                  className="w-full px-4 py-3 glass-input text-xs font-mono"
                />
              </div>

              {profileSaved && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Profile copy saved successfully!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 rounded-xl border border-accent text-accent font-bold text-xs hover:bg-accent hover:text-[#050505] transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>SAVE PROFILE CHANGES</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-white">MANAGE PROJECTS</h1>
                <p className="text-xs text-gray-400">Add, edit, or remove portfolio projects</p>
              </div>
              <button
                onClick={() => setShowAddProject(!showAddProject)}
                className="px-4 py-2.5 rounded-xl border border-accent text-accent font-bold text-xs hover:bg-accent hover:text-[#050505] transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>ADD PROJECT</span>
              </button>
            </div>

            {/* Add Project Form */}
            {showAddProject && (
              <form onSubmit={handleCreateProject} className="glass-panel p-6 space-y-4 max-w-xl border-accent/40 bg-[#040705]/95 rounded-2xl">
                <h3 className="text-sm font-bold text-accent">CREATE NEW PROJECT ENTRY</h3>
                <input
                  type="text"
                  required
                  placeholder="Project Title"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-4 py-2.5 glass-input text-xs"
                />
                <textarea
                  required
                  placeholder="Short Description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2.5 glass-input text-xs"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated e.g. Python, FastAPI, Docker)"
                  value={newProject.tags}
                  onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                  className="w-full px-4 py-2.5 glass-input text-xs"
                />
                <input
                  type="url"
                  placeholder="GitHub URL"
                  value={newProject.githubUrl}
                  onChange={(e) => setNewProject({ ...newProject, githubUrl: e.target.value })}
                  className="w-full px-4 py-2.5 glass-input text-xs"
                />
                <input
                  type="url"
                  placeholder="Live Demo URL"
                  value={newProject.liveUrl}
                  onChange={(e) => setNewProject({ ...newProject, liveUrl: e.target.value })}
                  className="w-full px-4 py-2.5 glass-input text-xs"
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 border border-accent text-accent font-bold text-xs rounded-xl hover:bg-accent hover:text-[#050505]">
                    SAVE PROJECT
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="px-4 py-2 border border-accent/30 text-gray-400 text-xs rounded-xl"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            )}

            {/* Project List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialProjects.map((p) => (
                <div key={p.id} className="glass-panel p-5 space-y-3 flex flex-col justify-between border-accent/30 bg-[#040705]/90 rounded-2xl">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">{p.title}</h4>
                    <p className="text-xs text-gray-400">{p.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-accent/20">
                    <span className="text-[10px] text-accent font-mono">{p.tags}</span>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MESSAGES */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white">CONTACT MESSAGES INBOX</h1>
              <p className="text-xs text-gray-400">Direct transmissions received from public console</p>
            </div>

            {initialMessages.length === 0 ? (
              <div className="glass-panel p-8 text-center text-gray-400 text-xs border-accent/30">
                No contact transmissions in inbox yet.
              </div>
            ) : (
              <div className="space-y-4">
                {initialMessages.map((msg) => (
                  <div key={msg.id} className="glass-panel p-6 space-y-3 border-accent/30 bg-[#040705]/90 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">{msg.subject}</h4>
                        <span className="text-xs text-accent">
                          {msg.name} ({msg.email})
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-2 text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#020403] p-4 rounded-xl border border-accent/20">
                      {msg.message}
                    </p>
                    <div className="text-[10px] text-gray-500 font-mono">
                      SENT AT: {new Date(msg.createdAt).toLocaleString()} | IP: {msg.ipAddress || '127.0.0.1'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white">SECURITY AUDIT LOGS</h1>
              <p className="text-xs text-gray-400">Immutable authentication and operational history</p>
            </div>

            <div className="glass-panel border-accent/30 bg-[#040705]/90 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-accent/10 text-accent border-b border-accent/25 uppercase font-mono">
                  <tr>
                    <th className="p-4">ACTION</th>
                    <th className="p-4">ACTOR</th>
                    <th className="p-4">DETAILS</th>
                    <th className="p-4">TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent/10">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-accent/5">
                      <td className="p-4 font-bold text-accent font-mono">{log.action}</td>
                      <td className="p-4 text-gray-300">{log.actor}</td>
                      <td className="p-4 text-gray-400">{log.details || '—'}</td>
                      <td className="p-4 text-gray-500 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
