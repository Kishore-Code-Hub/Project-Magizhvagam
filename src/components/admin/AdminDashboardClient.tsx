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
  Upload,
  Save,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  Image as ImageIcon,
  RotateCcw,
  Globe,
  Activity,
  FileText,
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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'media' | 'profile' | 'atmosphere' | 'presets' | 'projects' | 'messages' | 'seo' | 'audit'
  >('overview');

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: initialProfile?.name || 'Soundkish',
    headline: initialProfile?.headline || 'Securing Systems. Building Trust.',
    bio: initialProfile?.bio || '',
    resumeUrl: initialProfile?.resumeUrl || 'https://drive.google.com',
    heroImage: initialProfile?.stats?.heroImage || '/Hero-section-banner.jfif',
    fitMode: initialProfile?.stats?.fitMode || 'cover',
    brightness: initialProfile?.stats?.brightness || 100,
    contrast: initialProfile?.stats?.contrast || 100,
    glowIntensity: initialProfile?.stats?.glowIntensity || 100,
  });

  const [atmosphereForm, setAtmosphereForm] = useState({
    matrixOpacity: '0.15',
    matrixSpeed: '0.35',
    matrixDensity: 'high',
    performanceMode: 'auto',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Media Library items state
  const [mediaList, setMediaList] = useState<string[]>([
    '/Hero-section-banner.jfif',
    '/images/project-placeholder.svg',
  ]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setProfileForm((prev) => ({ ...prev, heroImage: data.url }));
        setMediaList((prev) => [data.url, ...prev]);
        setHasUnsavedChanges(true);
      } else {
        alert(data.error || 'Image upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('File upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);

    try {
      const payload = {
        name: profileForm.name,
        headline: profileForm.headline,
        bio: profileForm.bio,
        resumeUrl: profileForm.resumeUrl,
        stats: {
          ...initialProfile?.stats,
          heroImage: profileForm.heroImage,
          fitMode: profileForm.fitMode,
          brightness: profileForm.brightness,
          contrast: profileForm.contrast,
          glowIntensity: profileForm.glowIntensity,
        },
      };

      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setProfileSaved(true);
        setHasUnsavedChanges(false);
        setTimeout(() => setProfileSaved(false), 3000);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'Performance') {
      setProfileForm((prev) => ({ ...prev, glowIntensity: 50 }));
      setAtmosphereForm((prev) => ({ ...prev, performanceMode: 'low' }));
    } else if (presetName === 'Showcase') {
      setProfileForm((prev) => ({ ...prev, glowIntensity: 150 }));
      setAtmosphereForm((prev) => ({ ...prev, performanceMode: 'high' }));
    }
    setHasUnsavedChanges(true);
  };

  const handleResetDefaultHero = () => {
    setProfileForm((prev) => ({
      ...prev,
      heroImage: '/Hero-section-banner.jfif',
      fitMode: 'cover',
      brightness: 100,
      contrast: 100,
      glowIntensity: 100,
    }));
    setHasUnsavedChanges(true);
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
              <h2 className="text-base font-bold text-white uppercase tracking-wider">SOC ADMIN CMS</h2>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                AUTHENTICATED
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
              { id: 'media', label: 'MEDIA LIBRARY', icon: ImageIcon },
              { id: 'profile', label: 'HERO & PROFILE', icon: User },
              { id: 'presets', label: 'BRAND PRESETS', icon: Sparkles },
              { id: 'atmosphere', label: 'ATMOSPHERE', icon: Sliders },
              { id: 'projects', label: 'PROJECTS (CRUD)', icon: FolderGit2 },
              { id: 'messages', label: `MESSAGES (${initialMessages.length})`, icon: Mail },
              { id: 'seo', label: 'SEO & TELEMETRY', icon: Globe },
              { id: 'audit', label: 'AUDIT LOGS', icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-accent/20 border border-accent text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.25)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-accent" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.id === 'profile' && hasUnsavedChanges && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
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
        
        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between font-mono">
            <span>⚠️ You have unsaved changes in your settings.</span>
            <button
              onClick={handleSaveProfile}
              className="px-3 py-1 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400"
            >
              SAVE NOW
            </button>
          </div>
        )}

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

        {/* TAB 2: MEDIA LIBRARY */}
        {activeTab === 'media' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-white">CENTRAL MEDIA LIBRARY</h1>
                <p className="text-xs text-gray-400">Upload, manage, and reuse media assets across sections</p>
              </div>

              <label className="px-4 py-2.5 rounded-xl border border-accent text-accent font-bold text-xs hover:bg-accent hover:text-[#050505] transition-all flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>UPLOAD MEDIA FILE</span>
                <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,video/*,.pdf" />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {mediaList.map((url, idx) => (
                <div key={idx} className="glass-panel p-3 border-accent/30 bg-[#040705]/90 rounded-2xl space-y-2">
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-black relative border border-accent/20">
                    <img src={url} alt="Media Asset" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400 truncate max-w-[120px]">{url}</span>
                    <button
                      onClick={() => {
                        setProfileForm((prev) => ({ ...prev, heroImage: url }));
                        setHasUnsavedChanges(true);
                      }}
                      className="text-accent font-bold hover:underline"
                    >
                      USE AS HERO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: HERO & PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-extrabold text-white">EDIT HERO ARTWORK & PROFILE</h1>
              <p className="text-xs text-gray-400">Upload Hero Artwork and configure image FX processing</p>
            </div>

            <form onSubmit={handleSaveProfile} className="glass-panel p-8 space-y-6 border-accent/30 bg-[#040705]/90 rounded-2xl">
              {/* Hero Image Preview & Upload Controls */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-300">HERO ARTWORK IMAGE</label>
                <div className="w-full h-48 rounded-2xl overflow-hidden border border-accent/40 bg-black relative flex items-center justify-center">
                  {profileForm.heroImage ? (
                    <img
                      src={profileForm.heroImage}
                      alt="Hero Preview"
                      className="w-full h-full object-cover"
                      style={{
                        filter: `brightness(${profileForm.brightness}%) contrast(${profileForm.contrast}%)`,
                      }}
                    />
                  ) : (
                    <span className="text-xs text-gray-500">No Image Selected</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="px-4 py-2 rounded-xl border border-accent text-accent font-bold text-xs hover:bg-accent hover:text-[#050505] cursor-pointer">
                    {uploadingImage ? 'UPLOADING...' : 'UPLOAD NEW ARTWORK'}
                    <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetDefaultHero}
                    className="px-4 py-2 rounded-xl border border-accent/40 text-gray-300 font-bold text-xs hover:border-accent hover:text-accent flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESET TO DEFAULT</span>
                  </button>
                </div>
              </div>

              {/* Image FX Controls */}
              <div className="space-y-4 pt-4 border-t border-accent/20 text-xs">
                <h4 className="font-bold text-accent">// IMAGE PROCESSING FX CONTROLS</h4>

                <div className="space-y-2">
                  <label className="text-gray-400">BRIGHTNESS: {profileForm.brightness}%</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={profileForm.brightness}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, brightness: Number(e.target.value) });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full accent-emerald-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-gray-400">CONTRAST: {profileForm.contrast}%</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={profileForm.contrast}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, contrast: Number(e.target.value) });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full accent-emerald-400"
                  />
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">OPERATIVE NAME</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, name: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-4 py-3 glass-input text-xs font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">STATEMENT / BIO</label>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, bio: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
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

        {/* TAB 4: PRESETS */}
        {activeTab === 'presets' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-extrabold text-white">BRAND-PRESERVING ENVIRONMENT PRESETS</h1>
              <p className="text-xs text-gray-400">Switch motion profiles without altering Cyber Green identity</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'Performance', desc: 'Optimized FPS with reduced glow' },
                { name: 'Showcase', desc: 'Full motion depth and rich bloom' },
                { name: 'Streaming', desc: 'Flicker-free smooth transitions' },
                { name: 'Developer', desc: 'Clean balanced workspace' },
              ].map((p) => (
                <button
                  key={p.name}
                  onClick={() => handleApplyPreset(p.name)}
                  className="glass-panel p-5 space-y-2 border-accent/30 bg-[#040705]/90 rounded-2xl hover:border-accent text-left transition-all group"
                >
                  <h4 className="text-base font-bold text-accent group-hover:underline">{p.name} PRESET</h4>
                  <p className="text-xs text-gray-400">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ATMOSPHERE */}
        {activeTab === 'atmosphere' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-extrabold text-white">ATMOSPHERE & MATRIX SETTINGS</h1>
              <p className="text-xs text-gray-400">Configure Matrix Rain streams (12-20% opacity binary) and fog</p>
            </div>

            <div className="glass-panel p-8 space-y-6 border-accent/30 bg-[#040705]/90 rounded-2xl">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">MATRIX RAIN SPEED</label>
                <input
                  type="text"
                  value={atmosphereForm.matrixSpeed}
                  onChange={(e) => setAtmosphereForm({ ...atmosphereForm, matrixSpeed: e.target.value })}
                  className="w-full px-4 py-3 glass-input text-xs font-mono"
                />
              </div>

              <button
                onClick={() => alert('Atmosphere parameters updated.')}
                className="px-6 py-3 rounded-xl border border-accent text-accent font-bold text-xs hover:bg-accent hover:text-[#050505] transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>SAVE ATMOSPHERE SETTINGS</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-white">MANAGE PROJECTS</h1>
                <p className="text-xs text-gray-400">Add, edit, or remove portfolio projects</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialProjects.map((p) => (
                <div key={p.id} className="glass-panel p-5 space-y-3 border-accent/30 bg-[#040705]/90 rounded-2xl">
                  <h4 className="text-base font-bold text-white">{p.title}</h4>
                  <p className="text-xs text-gray-400">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: MESSAGES */}
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
                    <h4 className="text-base font-bold text-white">{msg.subject}</h4>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#020403] p-4 rounded-xl border border-accent/20">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: SEO */}
        {activeTab === 'seo' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-extrabold text-white">SEO & TELEMETRY MANAGER</h1>
              <p className="text-xs text-gray-400">Manage title, meta tags, OpenGraph, and sitemap settings</p>
            </div>
            <div className="glass-panel p-6 border-accent/30 bg-[#040705]/90 rounded-2xl space-y-3 text-xs text-gray-300">
              <div>Title: Kishore | Cybersecurity Enthusiast & Full-Stack Engineer</div>
              <div>Description: Securing Systems. Building Trust.</div>
              <div>OpenGraph: https://soundkish.dev</div>
            </div>
          </div>
        )}

        {/* TAB 9: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white">SECURITY AUDIT LOGS</h1>
              <p className="text-xs text-gray-400">Immutable authentication and operational history</p>
            </div>
            <div className="glass-panel border-accent/30 bg-[#040705]/90 rounded-2xl overflow-hidden p-4 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2 border-b border-accent/10 flex justify-between">
                  <span className="text-accent font-bold">{log.action}</span>
                  <span className="text-gray-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
