'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { FileUploader } from '@/components/ui/FileUploader';
import { User, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminAboutPage() {
  const [formData, setFormData] = useState({
    professionalIdentity: '',
    personalBio: '',
    currentFocus: '',
    techPhilosophy: '',
    availability: '',
    values: '[]',
    profileImage: '',
  });

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const stats = typeof data.stats === 'string' ? JSON.parse(data.stats) : data.stats || {};
          setFormData({
            professionalIdentity: data.professionalIdentity || '',
            personalBio: data.personalBio || data.bio || '',
            currentFocus: data.currentFocus || '',
            techPhilosophy: data.techPhilosophy || '',
            availability: data.availability || '',
            values: typeof data.values === 'string' ? data.values : JSON.stringify(data.values || []),
            profileImage: stats.profileImage || '/hero-hacker.png',
          });
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setSaving(true);
      setMessage(null);

      try {
        const res = await fetch('/api/admin/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professionalIdentity: formData.professionalIdentity,
            personalBio: formData.personalBio,
            currentFocus: formData.currentFocus,
            techPhilosophy: formData.techPhilosophy,
            availability: formData.availability,
            values: formData.values,
            stats: {
              profileImage: formData.profileImage,
            },
          }),
        });

        const resData = await res.json();

        if (!res.ok) {
          throw new Error(resData.error || `HTTP ${res.status}: Save failed`);
        }

        setIsDirty(false);
        setLastSaved(new Date().toLocaleTimeString());
        setMessage({ type: 'success', text: 'About section & Profile photo updated successfully!' });
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Error saving about data' });
      } finally {
        setSaving(false);
      }
    },
    [formData]
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
            <User className="w-6 h-6 text-[var(--accent-color)]" /> About The Engineer Manager
          </h1>
          <p className="text-xs text-gray-400">Configure personal biography, professional identity, profile photo, and principles.</p>
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
        <GlassCard variant="default" className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Engineer Profile Photo</label>
            <FileUploader
              category="about"
              value={formData.profileImage}
              onUploadComplete={(url) => handleFieldChange('profileImage', url)}
            />
            {formData.profileImage && (
              <p className="mt-2 text-xs text-emerald-400 font-mono">Current Photo: {formData.profileImage}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Professional Identity Title</label>
            <input
              type="text"
              value={formData.professionalIdentity}
              onChange={(e) => handleFieldChange('professionalIdentity', e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Personal Biography</label>
            <textarea
              rows={4}
              value={formData.personalBio}
              onChange={(e) => handleFieldChange('personalBio', e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white resize-none focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Current Focus</label>
            <input
              type="text"
              value={formData.currentFocus}
              onChange={(e) => handleFieldChange('currentFocus', e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Technical Philosophy</label>
            <input
              type="text"
              value={formData.techPhilosophy}
              onChange={(e) => handleFieldChange('techPhilosophy', e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Availability Status</label>
            <input
              type="text"
              value={formData.availability}
              onChange={(e) => handleFieldChange('availability', e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
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
          Save About Engineer Settings (Ctrl+S)
        </GlowButton>
      </form>
    </div>
  );
}
