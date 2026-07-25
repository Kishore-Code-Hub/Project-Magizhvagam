'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { FileUploader } from '@/components/ui/FileUploader';
import { Sparkles, Save, CheckCircle, AlertCircle, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export default function AdminHeroPage() {
  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    bio: '',
    resumeUrl: '',
    heroImage: '',
    greeting: '',
  });

  const [roles, setRoles] = useState<string[]>([
    'Cybersecurity Enthusiast_',
    'Ethical Hacker_',
    'Software Engineer_',
    'AI Developer_',
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const parseTaglines = (raw: string | string[]): string[] => {
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fallback fallback
    }
    return ['Cybersecurity Enthusiast_', 'Software Engineer_', 'AI Developer_'];
  };

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const stats = typeof data.stats === 'string' ? JSON.parse(data.stats) : data.stats || {};
          setFormData({
            name: data.name || '',
            headline: data.headline || '',
            bio: data.bio || '',
            resumeUrl: data.resumeUrl || '',
            heroImage: stats.heroImage || '/Hero-section-banner.jfif',
            greeting: stats.greeting || 'Welcome to my Cyber Operations Hub',
          });
          setRoles(parseTaglines(data.taglines));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleRoleChange = (index: number, val: string) => {
    const next = [...roles];
    next[index] = val;
    setRoles(next);
    setIsDirty(true);
  };

  const handleAddRole = () => {
    setRoles((prev) => [...prev, 'New Role_']);
    setIsDirty(true);
  };

  const handleDeleteRole = (index: number) => {
    setRoles((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleMoveRole = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === roles.length - 1)) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...roles];
    [next[index], next[targetIdx]] = [next[targetIdx], next[index]];
    setRoles(next);
    setIsDirty(true);
  };

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setSaving(true);
      setMessage(null);

      const validRoles = roles.map((r) => r.trim()).filter(Boolean);
      const taglinesJson = JSON.stringify(validRoles.length > 0 ? validRoles : ['Cybersecurity Researcher_']);

      try {
        const res = await fetch('/api/admin/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            headline: formData.headline,
            taglines: taglinesJson,
            bio: formData.bio,
            resumeUrl: formData.resumeUrl,
            stats: {
              heroImage: formData.heroImage,
              greeting: formData.greeting,
            },
          }),
        });

        const resData = await res.json();

        if (!res.ok) {
          throw new Error(resData.error || `HTTP ${res.status}: Save failed`);
        }

        setIsDirty(false);
        setLastSaved(new Date().toLocaleTimeString());
        setMessage({ type: 'success', text: 'Hero & Identity updated successfully!' });
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Save error' });
      } finally {
        setSaving(false);
      }
    },
    [formData, roles]
  );

  // Ctrl+S / Cmd+S Keyboard Save Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  return (
    <div className="space-y-8 font-mono text-left max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--accent-color)]" /> Hero & Identity Manager
          </h1>
          <p className="text-xs text-gray-400">Control public greeting, titles, typewriter role loops, and hero media.</p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-[10px] text-amber-400 font-bold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
              Unsaved Changes
            </span>
          )}
          {lastSaved && <span className="text-[10px] text-gray-400">Last saved: {lastSaved}</span>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard variant="default" className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Greeting Line</label>
            <input
              type="text"
              value={formData.greeting}
              onChange={(e) => handleFieldChange('greeting', e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Engineer Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Main Headline / Subtitle</label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => handleFieldChange('headline', e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          {/* Interactive Role Pills Manager */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase">Typewriter Role Loop Sequence</label>
                <p className="text-[10px] text-gray-400">Add, edit, delete, or reorder dynamic roles for the typewriter loop.</p>
              </div>
              <GlowButton type="button" variant="secondary" size="sm" onClick={handleAddRole} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Role
              </GlowButton>
            </div>

            <div className="space-y-2">
              {roles.map((role, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-white/10">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => handleRoleChange(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-black/50 border border-white/10 text-emerald-400 focus:outline-none focus:border-[var(--accent-color)]"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveRole(idx, 'up')}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === roles.length - 1}
                      onClick={() => handleMoveRole(idx, 'down')}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(idx)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Resume URL</label>
            <input
              type="text"
              value={formData.resumeUrl}
              onChange={(e) => handleFieldChange('resumeUrl', e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Hero Workstation Banner Image</label>
            <FileUploader
              category="hero"
              onUploadComplete={(url) => handleFieldChange('heroImage', url)}
            />
            {formData.heroImage && (
              <p className="mt-2 text-xs text-emerald-400 font-mono">Current Banner: {formData.heroImage}</p>
            )}
          </div>
        </GlassCard>

        {message && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <GlowButton type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Save Hero Settings (Ctrl+S)
          </GlowButton>
        </div>
      </form>
    </div>
  );
}
