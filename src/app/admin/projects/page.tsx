'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { CyberBadge } from '@/components/ui/CyberBadge';
import { Modal } from '@/components/ui/Modal';
import { FileUploader } from '@/components/ui/FileUploader';
import { FolderGit2, Plus, Edit2, Trash2, Save, ExternalLink, Eye } from 'lucide-react';
import { DESIGN_SYSTEM } from '@/lib/design-system';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    longDescription: '',
    image: '',
    gallery: '[]',
    githubUrl: '',
    liveUrl: '',
    documentationUrl: '',
    architectureDiagram: '',
    tags: '[]',
    category: 'Web Engineering',
    status: 'Completed',
    challenges: '',
    solutions: '',
    featured: false,
    published: true,
  });

  const loadProjects = () => {
    fetch('/api/admin/projects')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      longDescription: '',
      image: '',
      gallery: '[]',
      githubUrl: '',
      liveUrl: '',
      documentationUrl: '',
      architectureDiagram: '',
      tags: '["Next.js", "TypeScript", "Tailwind"]',
      category: 'Web Engineering',
      status: 'Completed',
      challenges: '',
      solutions: '',
      featured: false,
      published: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: any) => {
    setEditingProject(proj);
    setFormData({
      title: proj.title,
      description: proj.description,
      longDescription: proj.longDescription || '',
      image: proj.image,
      gallery: proj.gallery || '[]',
      githubUrl: proj.githubUrl || '',
      liveUrl: proj.liveUrl || '',
      documentationUrl: proj.documentationUrl || '',
      architectureDiagram: proj.architectureDiagram || '',
      tags: proj.tags,
      category: proj.category || 'Web Engineering',
      status: proj.status || 'Completed',
      challenges: proj.challenges || '',
      solutions: proj.solutions || '',
      featured: proj.featured,
      published: proj.published,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await fetch(`/api/admin/projects?id=${id}`, { method: 'DELETE' });
      loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingProject ? 'PUT' : 'POST';
      const body = editingProject ? { id: editingProject.id, ...formData } : formData;

      const res = await fetch('/api/admin/projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Save failed');

      setIsModalOpen(false);
      loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-mono text-left max-w-6xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-[var(--accent-color)]" /> Featured Projects CMS
          </h1>
          <p className="text-xs text-gray-400">Manage software portfolio entries, galleries, and documentation.</p>
        </div>

        <GlowButton variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          New Project
        </GlowButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <GlassCard key={proj.id} variant="default" className="flex flex-col justify-between p-0 overflow-hidden">
            <div className="relative h-40 w-full bg-black/40">
              <img src={proj.image} alt={proj.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                <CyberBadge variant="green" size="sm">
                  {proj.category}
                </CyberBadge>
                <CyberBadge variant="cyan" size="sm">
                  {proj.status || 'Completed'}
                </CyberBadge>
                {proj.featured && (
                  <CyberBadge variant="amber" size="sm">
                    Featured
                  </CyberBadge>
                )}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-lg mb-1">{proj.title}</h4>
                <p className="text-xs text-gray-400 line-clamp-2 mb-4">{proj.description}</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{proj.published ? 'Published' : 'Draft'}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(proj)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProject ? 'Edit Project' : 'New Project'} maxWidth="4xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">PROJECT TITLE *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                {DESIGN_SYSTEM.categories.projects.filter(c => c !== 'All Projects').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">PROJECT STATUS *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
              >
                <option value="Completed">Completed</option>
                <option value="In Development">In Development</option>
                <option value="Working on">Working on</option>
                <option value="Beta / Maintenance">Beta / Maintenance</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">TECH TAGS (JSON or Comma-Separated)</label>
              <input
                type="text"
                placeholder='["MongoDB", "Express", "React"]'
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">SHORT DESCRIPTION *</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">LONG DESCRIPTION & DEEP DIVE</label>
            <textarea
              rows={3}
              value={formData.longDescription}
              onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">GITHUB REPO URL</label>
              <input
                type="text"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">LIVE DEMO URL</label>
              <input
                type="text"
                value={formData.liveUrl}
                onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">TECHNICAL CHALLENGES</label>
              <textarea
                rows={2}
                value={formData.challenges}
                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">ARCHITECTURAL SOLUTIONS</label>
              <textarea
                rows={2}
                value={formData.solutions}
                onChange={(e) => setFormData({ ...formData, solutions: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">COVER IMAGE</label>
            <FileUploader
              category="projects"
              value={formData.image}
              onUploadComplete={(url) => setFormData({ ...formData, image: url })}
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs text-gray-300 font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="accent-[var(--accent-color)] w-4 h-4 cursor-pointer"
              />
              <span>Featured Project</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-gray-300 font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="accent-[var(--accent-color)] w-4 h-4 cursor-pointer"
              />
              <span>Published on Website</span>
            </label>
          </div>

          <GlowButton type="submit" variant="primary" className="w-full" leftIcon={<Save className="w-4 h-4" />}>
            Save Project Entry
          </GlowButton>
        </form>
      </Modal>
    </div>
  );
}
