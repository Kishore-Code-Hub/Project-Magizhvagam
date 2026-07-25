'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { Modal } from '@/components/ui/Modal';
import { Calendar, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { DESIGN_SYSTEM } from '@/lib/design-system';

export default function AdminTimelinePage() {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    year: '2026',
    title: '',
    subtitle: '',
    description: '',
    category: 'Education',
    expandedContent: '',
    isCurrent: false,
    order: 0,
  });

  const loadTimeline = () => {
    fetch('/api/admin/timeline')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTimeline(data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      year: new Date().getFullYear().toString(),
      title: '',
      subtitle: '',
      description: '',
      category: 'Education',
      expandedContent: '',
      isCurrent: false,
      order: timeline.length,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      year: item.year,
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description,
      category: item.category,
      expandedContent: item.expandedContent || '',
      isCurrent: item.isCurrent,
      order: item.order,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete entry?')) return;
    await fetch(`/api/admin/timeline?id=${id}`, { method: 'DELETE' });
    loadTimeline();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? 'PUT' : 'POST';
    const body = editingItem ? { id: editingItem.id, ...formData } : formData;

    await fetch('/api/admin/timeline', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setIsModalOpen(false);
    loadTimeline();
  };

  return (
    <div className="space-y-8 font-mono text-left max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[var(--accent-color)]" /> Career Timeline CMS
          </h1>
          <p className="text-xs text-gray-400">Manage milestones, education, internships, research, and hackathons.</p>
        </div>

        <GlowButton variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add Milestone
        </GlowButton>
      </div>

      <div className="space-y-4">
        {timeline.map((item) => (
          <GlassCard key={item.id} variant="default" className="flex items-center justify-between p-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-[var(--bg-glass)] text-[var(--accent-color)] border border-[var(--border-accent)]">
                  {item.year}
                </span>
                <span className="text-xs text-gray-400">{item.category}</span>
              </div>
              <h4 className="font-bold text-white text-base">{item.title}</h4>
              <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => handleOpenEdit(item)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Milestone' : 'Add Milestone'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">YEAR / PERIOD *</label>
              <input
                type="text"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">CATEGORY *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
              >
                {DESIGN_SYSTEM.categories.timeline.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">TITLE *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">SUMMARY *</label>
            <textarea
              rows={2}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white resize-none"
            />
          </div>

          <GlowButton type="submit" variant="primary" className="w-full" leftIcon={<Save className="w-4 h-4" />}>
            Save Milestone
          </GlowButton>
        </form>
      </Modal>
    </div>
  );
}
