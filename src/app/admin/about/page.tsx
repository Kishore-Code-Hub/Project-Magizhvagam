'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { User, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminAboutPage() {
  const [formData, setFormData] = useState({
    professionalIdentity: '',
    personalBio: '',
    currentFocus: '',
    techPhilosophy: '',
    availability: '',
    values: '[]',
    education: '[]',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setFormData({
            professionalIdentity: data.professionalIdentity || '',
            personalBio: data.personalBio || data.bio || '',
            currentFocus: data.currentFocus || '',
            techPhilosophy: data.techPhilosophy || '',
            availability: data.availability || '',
            values: typeof data.values === 'string' ? data.values : JSON.stringify(data.values || []),
            education: '[]',
          });
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || `HTTP ${res.status}: Save failed`);
      }

      setMessage({ type: 'success', text: 'About section updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving about data' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-mono text-left max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <User className="w-6 h-6 text-[var(--accent-color)]" /> About The Engineer Manager
          </h1>
          <p className="text-xs text-gray-400">Configure bio, professional identity, principles, and values.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard variant="default" className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">PROFESSIONAL IDENTITY TITLE</label>
            <input
              type="text"
              value={formData.professionalIdentity}
              onChange={(e) => setFormData({ ...formData, professionalIdentity: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">PERSONAL BIOGRAPHY</label>
            <textarea
              rows={4}
              value={formData.personalBio}
              onChange={(e) => setFormData({ ...formData, personalBio: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">CURRENT FOCUS</label>
            <input
              type="text"
              value={formData.currentFocus}
              onChange={(e) => setFormData({ ...formData, currentFocus: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">TECHNICAL PHILOSOPHY</label>
            <input
              type="text"
              value={formData.techPhilosophy}
              onChange={(e) => setFormData({ ...formData, techPhilosophy: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">AVAILABILITY STATUS</label>
            <input
              type="text"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
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
          Save About Engineer Settings
        </GlowButton>
      </form>
    </div>
  );
}
