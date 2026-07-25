'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { CyberBadge } from '@/components/ui/CyberBadge';
import { Modal } from '@/components/ui/Modal';
import { FileUploader } from '@/components/ui/FileUploader';
import { Cpu, Plus, Edit2, Trash2, Save, Star } from 'lucide-react';
import { DESIGN_SYSTEM } from '@/lib/design-system';

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Languages',
    officialLogo: '',
    shortDesc: '',
    yearsExperience: 1,
    proficiency: 85,
    level: 'Advanced',
    featured: false,
    order: 0,
  });

  const loadSkills = () => {
    fetch('/api/admin/skills')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSkills(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleOpenAdd = () => {
    setEditingSkill(null);
    setFormData({
      name: '',
      category: 'Languages',
      officialLogo: '',
      shortDesc: '',
      yearsExperience: 1,
      proficiency: 85,
      level: 'Advanced',
      featured: false,
      order: skills.length,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (skill: any) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category,
      officialLogo: skill.officialLogo || '',
      shortDesc: skill.shortDesc || '',
      yearsExperience: skill.yearsExperience,
      proficiency: skill.proficiency,
      level: skill.level,
      featured: skill.featured,
      order: skill.order,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill entry?')) return;
    try {
      await fetch(`/api/admin/skills?id=${id}`, { method: 'DELETE' });
      loadSkills();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingSkill ? 'PUT' : 'POST';
      const body = editingSkill ? { id: editingSkill.id, ...formData } : formData;

      const res = await fetch('/api/admin/skills', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Save failed');

      setIsModalOpen(false);
      loadSkills();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-mono text-left max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[var(--accent-color)]" /> Technical Skills CMS
          </h1>
          <p className="text-xs text-gray-400">CRUD manager for skills, proficiencies, experience, and logos.</p>
        </div>

        <GlowButton variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add New Skill
        </GlowButton>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <GlassCard key={skill.id} variant="default" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {skill.officialLogo && (
                    <img src={skill.officialLogo} alt={skill.name} className="w-6 h-6 object-contain" />
                  )}
                  <h4 className="font-bold text-white text-base">{skill.name}</h4>
                </div>
                <CyberBadge variant="green" size="sm">
                  {skill.category}
                </CyberBadge>
              </div>

              <div className="text-xs text-gray-400 space-y-1 mb-4">
                <div>Proficiency: <span className="text-[var(--accent-color)] font-bold">{skill.proficiency}%</span></div>
                <div>Experience: <span className="text-white font-bold">{skill.yearsExperience} yrs</span></div>
                <div>Level: <span className="text-cyan-400 font-bold">{skill.level}</span></div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(skill)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(skill.id)}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Edit/Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSkill ? 'Edit Skill' : 'Add Skill'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">SKILL NAME *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">CATEGORY *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
              >
                {DESIGN_SYSTEM.categories.skills.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">PROFICIENCY LEVEL *</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">PROFICIENCY % ({formData.proficiency}%)</label>
              <input
                type="range"
                min="1"
                max="100"
                value={formData.proficiency}
                onChange={(e) => setFormData({ ...formData, proficiency: parseInt(e.target.value) })}
                className="w-full accent-[var(--accent-color)]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">YEARS EXPERIENCE</label>
              <input
                type="number"
                step="0.5"
                value={formData.yearsExperience}
                onChange={(e) => setFormData({ ...formData, yearsExperience: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">OFFICIAL SVG LOGO</label>
            <FileUploader category="icons" onUploadComplete={(url) => setFormData({ ...formData, officialLogo: url })} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="accent-[var(--accent-color)] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="featured" className="text-xs text-gray-300 font-bold cursor-pointer">
                Feature on Top Grid
              </label>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 mb-1">MANUAL DISPLAY ORDER</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-black/40 border border-white/10 text-white"
              />
            </div>
          </div>

          <GlowButton type="submit" variant="primary" className="w-full" leftIcon={<Save className="w-4 h-4" />}>
            Save Skill Entry
          </GlowButton>
        </form>
      </Modal>
    </div>
  );
}
