'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { Modal } from '@/components/ui/Modal';
import { FileUploader } from '@/components/ui/FileUploader';
import { Award, Plus, Edit2, Trash2, Save, ExternalLink } from 'lucide-react';

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    organizationLogo: '',
    issueDate: '',
    credentialId: '',
    credentialUrl: '',
    pdfUrl: '',
    description: '',
    featured: false,
  });

  const loadCerts = () => {
    fetch('/api/admin/certificates')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCerts(data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadCerts();
  }, []);

  const handleOpenAdd = () => {
    setEditingCert(null);
    setFormData({
      title: '',
      issuer: '',
      organizationLogo: '',
      issueDate: '2026',
      credentialId: '',
      credentialUrl: '',
      pdfUrl: '',
      description: '',
      featured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cert: any) => {
    setEditingCert(cert);
    setFormData({
      title: cert.title,
      issuer: cert.issuer,
      organizationLogo: cert.organizationLogo || '',
      issueDate: cert.issueDate,
      credentialId: cert.credentialId || '',
      credentialUrl: cert.credentialUrl || '',
      pdfUrl: cert.pdfUrl || '',
      description: cert.description || '',
      featured: cert.featured,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete certificate?')) return;
    await fetch(`/api/admin/certificates?id=${id}`, { method: 'DELETE' });
    loadCerts();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCert ? 'PUT' : 'POST';
    const body = editingCert ? { id: editingCert.id, ...formData } : formData;

    await fetch('/api/admin/certificates', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setIsModalOpen(false);
    loadCerts();
  };

  return (
    <div className="space-y-8 font-mono text-left max-w-5xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Award className="w-6 h-6 text-[var(--accent-color)]" /> Certifications CMS
          </h1>
          <p className="text-xs text-gray-400">Manage professional certificates, credential IDs, and verification URLs.</p>
        </div>

        <GlowButton variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add Certificate
        </GlowButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {certs.map((cert) => (
          <GlassCard key={cert.id} variant="default" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {cert.organizationLogo ? (
                  <img src={cert.organizationLogo} alt={cert.issuer} className="w-8 h-8 object-contain" />
                ) : (
                  <Award className="w-6 h-6 text-[var(--accent-color)]" />
                )}
                <div>
                  <h4 className="font-bold text-white text-sm leading-tight">{cert.title}</h4>
                  <p className="text-[10px] text-gray-400 font-mono">{cert.issuer}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-gray-500">{cert.issueDate}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleOpenEdit(cert)} className="p-1.5 rounded-lg bg-white/5 text-gray-300">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cert.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCert ? 'Edit Certificate' : 'Add Certificate'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">CERTIFICATE TITLE *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">ISSUING ORGANIZATION *</label>
              <input
                type="text"
                required
                value={formData.issuer}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">ISSUE DATE *</label>
              <input
                type="text"
                required
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">VERIFICATION URL</label>
            <input
              type="text"
              value={formData.credentialUrl}
              onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">ORGANIZATION LOGO</label>
            <FileUploader category="certificates" onUploadComplete={(url) => setFormData({ ...formData, organizationLogo: url })} />
          </div>

          <GlowButton type="submit" variant="primary" className="w-full" leftIcon={<Save className="w-4 h-4" />}>
            Save Certification
          </GlowButton>
        </form>
      </Modal>
    </div>
  );
}
