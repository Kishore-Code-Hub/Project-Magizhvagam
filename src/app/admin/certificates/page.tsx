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
    galleryImages: [] as string[],
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
      galleryImages: [],
      description: '',
      featured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cert: any) => {
    setEditingCert(cert);
    let parsedGallery: string[] = [];
    try {
      if (typeof cert.gallery === 'string') {
        parsedGallery = JSON.parse(cert.gallery || '[]');
      } else if (Array.isArray(cert.gallery)) {
        parsedGallery = cert.gallery;
      }
    } catch {}

    setFormData({
      title: cert.title,
      issuer: cert.issuer,
      organizationLogo: cert.organizationLogo || '',
      issueDate: cert.issueDate,
      credentialId: cert.credentialId || '',
      credentialUrl: cert.credentialUrl || '',
      pdfUrl: cert.pdfUrl || '',
      galleryImages: parsedGallery,
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
    const payload = {
      title: formData.title,
      issuer: formData.issuer,
      organizationLogo: formData.organizationLogo,
      issueDate: formData.issueDate,
      credentialId: formData.credentialId,
      credentialUrl: formData.credentialUrl,
      pdfUrl: formData.pdfUrl,
      gallery: JSON.stringify(formData.galleryImages),
      description: formData.description,
      featured: formData.featured,
    };
    const body = editingCert ? { id: editingCert.id, ...payload } : payload;

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
          <p className="text-xs text-gray-400">Manage professional certificates, credential IDs, verification URLs, and image galleries.</p>
        </div>

        <GlowButton variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add Certificate
        </GlowButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {certs.map((cert) => (
          <GlassCard key={cert.id} variant="default" className="flex flex-col justify-between p-0 overflow-hidden">
            <div>
              {/* Certificate Image Banner */}
              {(cert.pdfUrl || (cert.organizationLogo && cert.organizationLogo.startsWith('/uploads/'))) && (
                <div className="h-36 w-full bg-black/60 relative border-b border-white/10 overflow-hidden">
                  <img
                    src={cert.pdfUrl || cert.organizationLogo}
                    alt={cert.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                    {cert.organizationLogo && !cert.organizationLogo.startsWith('/uploads/') ? (
                      <img src={cert.organizationLogo} alt={cert.issuer} className="w-5 h-5 object-contain" />
                    ) : (
                      <Award className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm leading-tight">{cert.title}</h4>
                    <p className="text-[10px] text-gray-400 font-mono">{cert.issuer}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center justify-between border-t border-white/5">
              <span className="text-[10px] text-gray-500 font-mono">{cert.issueDate}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleOpenEdit(cert)} className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cert.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:text-red-300 cursor-pointer">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">CREDENTIAL ID</label>
              <input
                type="text"
                value={formData.credentialId}
                onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
                placeholder="e.g. AWS-908123"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">VERIFICATION URL</label>
              <input
                type="text"
                value={formData.credentialUrl}
                onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">DESCRIPTION & SKILLS</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white resize-none"
              placeholder="Short description of credential achievements..."
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-white/10">
            <div>
              <label className="block text-xs font-bold text-emerald-400 mb-1">
                PRIMARY CERTIFICATE PREVIEW IMAGE (pdfUrl)
              </label>
              <FileUploader
                category="certificates"
                label="Upload Primary Certificate Image or Drag & Drop"
                value={formData.pdfUrl}
                onUploadComplete={(url) => setFormData({ ...formData, pdfUrl: url })}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">ORGANIZATION / ISSUER LOGO</label>
              <FileUploader
                category="certificates"
                label="Upload Issuer Logo"
                value={formData.organizationLogo}
                onUploadComplete={(url) => setFormData({ ...formData, organizationLogo: url })}
              />
            </div>

            {/* Additional Certification Proof Images Gallery */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <label className="block text-xs font-bold text-cyan-400 mb-1 uppercase">
                ADDITIONAL CERTIFICATE IMAGES ({formData.galleryImages.length})
              </label>

              {formData.galleryImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
                  {formData.galleryImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/60 aspect-video">
                      <img src={imgUrl} alt={`Proof Image ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const nextGallery = formData.galleryImages.filter((_, i) => i !== idx);
                          setFormData({ ...formData, galleryImages: nextGallery });
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-90 hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-gray-300">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <FileUploader
                category="certificates"
                label={`Upload Additional Image #${formData.galleryImages.length + 1} (or Drag & Drop)`}
                onUploadComplete={(url) => {
                  if (url) {
                    setFormData((prev) => ({
                      ...prev,
                      galleryImages: [...prev.galleryImages, url],
                    }));
                  }
                }}
              />
              <p className="text-[10px] text-gray-400 font-mono">
                Upload 3rd, 4th, 5th+ additional certificate proof images or verification documents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="certFeatured"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="accent-[var(--accent-color)] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="certFeatured" className="text-xs text-gray-300 font-bold cursor-pointer">
              Feature on Top Grid
            </label>
          </div>

          <GlowButton type="submit" variant="primary" className="w-full" leftIcon={<Save className="w-4 h-4" />}>
            Save Certification
          </GlowButton>
        </form>
      </Modal>
    </div>
  );
}
