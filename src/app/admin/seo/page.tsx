'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { Search, Save, CheckCircle } from 'lucide-react';

export default function AdminSEOPage() {
  const [seo, setSeo] = useState({
    siteTitle: '',
    siteDescription: '',
    keywords: '',
    ogImage: '',
    twitterCard: 'summary_large_image',
    robots: 'index, follow',
    canonicalUrl: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/seo')
      .then((res) => res.json())
      .then((data) => {
        if (data) setSeo(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seo),
      });

      if (!res.ok) throw new Error('Save failed');

      setMessage('SEO descriptors updated successfully!');
    } catch (err: any) {
      setMessage('Save error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-mono text-left max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Search className="w-6 h-6 text-[var(--accent-color)]" /> SEO & Meta Descriptor Manager
          </h1>
          <p className="text-xs text-gray-400">Configure global metadata, OpenGraph tags, canonicals, and indexing rules.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard variant="default" className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">GLOBAL SITE TITLE</label>
            <input
              type="text"
              value={seo.siteTitle}
              onChange={(e) => setSeo({ ...seo, siteTitle: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">META DESCRIPTION</label>
            <textarea
              rows={3}
              value={seo.siteDescription}
              onChange={(e) => setSeo({ ...seo, siteDescription: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">KEYWORDS (COMMA SEPARATED)</label>
            <input
              type="text"
              value={seo.keywords}
              onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">CANONICAL URL</label>
              <input
                type="text"
                value={seo.canonicalUrl}
                onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">ROBOTS RULE</label>
              <input
                type="text"
                value={seo.robots}
                onChange={(e) => setSeo({ ...seo, robots: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
              />
            </div>
          </div>
        </GlassCard>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <GlowButton type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
          Save SEO Configuration
        </GlowButton>
      </form>
    </div>
  );
}
