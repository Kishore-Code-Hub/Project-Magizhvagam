'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { FileUploader } from '@/components/ui/FileUploader';
import { Sparkles, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminHeroPage() {
  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    taglines: '[]',
    bio: '',
    resumeUrl: '',
    heroImage: '',
    greeting: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const stats = typeof data.stats === 'string' ? JSON.parse(data.stats) : data.stats || {};
          setFormData({
            name: data.name || '',
            headline: data.headline || '',
            taglines: data.taglines || '[]',
            bio: data.bio || '',
            resumeUrl: data.resumeUrl || '',
            heroImage: stats.heroImage || '/Hero-section-banner.jfif',
            greeting: stats.greeting || 'Welcome to my Cyber Operations Hub',
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          headline: formData.headline,
          taglines: formData.taglines,
          bio: formData.bio,
          resumeUrl: formData.resumeUrl,
          stats: {
            heroImage: formData.heroImage,
            greeting: formData.greeting,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to update Hero configuration');

      setMessage({ type: 'success', text: 'Hero & Identity updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Save error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-mono text-left max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--accent-color)]" /> Hero & Identity Manager
          </h1>
          <p className="text-xs text-gray-400">Control public greeting, titles, typing animations, and hero media.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard variant="default" className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Greeting Line</label>
            <input
              type="text"
              value={formData.greeting}
              onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Engineer Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Main Headline</label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">
              Role Typing Loop Words (JSON Array Format)
            </label>
            <input
              type="text"
              value={formData.taglines}
              onChange={(e) => setFormData({ ...formData, taglines: e.target.value })}
              placeholder='["Cybersecurity Researcher", "Software Engineer", "AI Developer"]'
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Resume URL</label>
            <input
              type="text"
              value={formData.resumeUrl}
              onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Hero Workstation Banner Image</label>
            <FileUploader
              category="hero"
              onUploadComplete={(url) => setFormData({ ...formData, heroImage: url })}
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

        <GlowButton type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
          Save Hero Settings
        </GlowButton>
      </form>
    </div>
  );
}
