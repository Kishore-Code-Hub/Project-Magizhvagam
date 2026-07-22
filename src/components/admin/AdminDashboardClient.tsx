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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#0c0c14] border-r border-white/10 p-6 flex flex-col justify-between space-y-8">
        <div className="space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Admin Control</h2>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                SECURE SESSION
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'profile', label: 'Profile Copy', icon: User },
              { id: 'projects', label: 'Projects (CRUD)', icon: FolderGit2 },
              { id: 'messages', label: `Messages (${initialMessages.length})`, icon: Mail },
              { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-purple-600/30 border border-purple-500/50 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 text-purple-400" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Badge & Logout */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="text-xs text-gray-400 truncate">
            Logged as <span className="text-purple-300 font-mono">{session.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
              <p className="text-xs text-gray-400">System status and live metrics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="glass-panel p-6 space-y-2">
                <span className="text-xs text-gray-400 font-medium">Total Messages</span>
                <p className="text-3xl font-bold text-purple-300">{initialMessages.length}</p>
              </div>
              <div className="glass-panel p-6 space-y-2">
                <span className="text-xs text-gray-400 font-medium">Active Projects</span>
                <p className="text-3xl font-bold text-purple-300">{initialProjects.length}</p>
              </div>
              <div className="glass-panel p-6 space-y-2">
                <span className="text-xs text-gray-400 font-medium">Tech Skills</span>
                <p className="text-3xl font-bold text-purple-300">{initialSkills.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Profile & Resume Link</h1>
              <p className="text-xs text-gray-400">Update public copy without redeploying code</p>
            </div>

            <form onSubmit={handleSaveProfile} className="glass-panel p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-3 glass-input text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">Headline</label>
                <input
                  type="text"
                  value={profileForm.headline}
                  onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                  className="w-full px-4 py-3 glass-input text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">Bio Paragraph</label>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-4 py-3 glass-input text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">
                  External Resume URL (Google Drive / CDN link)
                </label>
                <input
                  type="url"
                  value={profileForm.resumeUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, resumeUrl: e.target.value })}
                  className="w-full px-4 py-3 glass-input text-sm"
                />
              </div>

              {profileSaved && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Manage Projects</h1>
                <p className="text-xs text-gray-400">Add, edit, or remove showcase projects</p>
              </div>
              <button
                onClick={() => setShowAddProject(!showAddProject)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </div>

            {/* Add Project Modal / Form */}
            {showAddProject && (
              <form onSubmit={handleCreateProject} className="glass-panel p-6 space-y-4 max-w-xl">
                <h3 className="text-sm font-bold text-white">Create New Project</h3>
                <input
                  type="text"
                  required
                  placeholder="Project Title"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-4 py-2.5 glass-input text-sm"
                />
                <textarea
                  required
                  placeholder="Short Description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2.5 glass-input text-sm"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={newProject.tags}
                  onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                  className="w-full px-4 py-2.5 glass-input text-sm"
                />
                <input
                  type="url"
                  placeholder="GitHub URL"
                  value={newProject.githubUrl}
                  onChange={(e) => setNewProject({ ...newProject, githubUrl: e.target.value })}
                  className="w-full px-4 py-2.5 glass-input text-sm"
                />
                <input
                  type="url"
                  placeholder="Live Demo URL"
                  value={newProject.liveUrl}
                  onChange={(e) => setNewProject({ ...newProject, liveUrl: e.target.value })}
                  className="w-full px-4 py-2.5 glass-input text-sm"
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white text-xs rounded-lg">
                    Save Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="px-4 py-2 bg-white/10 text-gray-300 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Project List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialProjects.map((p) => (
                <div key={p.id} className="glass-panel p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">{p.title}</h4>
                    <p className="text-xs text-gray-400">{p.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-[10px] text-purple-300 font-mono">{p.tags}</span>
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
              <h1 className="text-2xl font-bold text-white">Contact Messages Inbox</h1>
              <p className="text-xs text-gray-400">Direct inquiries submitted via public contact form</p>
            </div>

            {initialMessages.length === 0 ? (
              <div className="glass-panel p-8 text-center text-gray-400 text-sm">
                No contact messages in inbox yet.
              </div>
            ) : (
              <div className="space-y-4">
                {initialMessages.map((msg) => (
                  <div key={msg.id} className="glass-panel p-6 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">{msg.subject}</h4>
                        <span className="text-xs text-purple-400">
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
                    <p className="text-xs text-gray-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      {msg.message}
                    </p>
                    <div className="text-[10px] text-gray-500 font-mono">
                      Sent at: {new Date(msg.createdAt).toLocaleString()} | IP: {msg.ipAddress || '127.0.0.1'}
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
              <h1 className="text-2xl font-bold text-white">Security Audit Logs</h1>
              <p className="text-xs text-gray-400">Immutable trail of authentication and modification actions</p>
            </div>

            <div className="glass-panel overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-gray-400 border-b border-white/10 uppercase font-mono">
                  <tr>
                    <th className="p-4">Action</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-purple-300 font-mono">{log.action}</td>
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
