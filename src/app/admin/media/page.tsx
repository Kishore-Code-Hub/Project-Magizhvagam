'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { FileUploader } from '@/components/ui/FileUploader';
import { Modal } from '@/components/ui/Modal';
import { Image as ImageIcon, Folder, Upload, Trash2, Copy, Check, Search, Eye, ExternalLink } from 'lucide-react';

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadMedia = () => {
    fetch('/api/admin/media/upload')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAssets(data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteAsset = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/admin/media/upload?id=${deleteTargetId}`, { method: 'DELETE' });
      setDeleteTargetId(null);
      if (previewAsset?.id === deleteTargetId) setPreviewAsset(null);
      loadMedia();
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ['ALL', 'hero', 'about', 'skills', 'projects', 'certificates', 'uploads'];

  const filteredAssets = assets.filter((asset) => {
    const matchesCat = selectedCategory === 'ALL' || asset.category === selectedCategory;
    const matchesSearch =
      asset.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.fileUrl?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8 font-mono text-left max-w-6xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[var(--accent-color)]" /> Media Assets Library
          </h1>
          <p className="text-xs text-gray-400">Upload, organize, copy URLs, and manage media assets across portfolio modules.</p>
        </div>
      </div>

      <GlassCard variant="default">
        <h4 className="text-sm font-bold text-white uppercase mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-[var(--accent-color)]" /> Upload New Asset
        </h4>
        <FileUploader category="uploads" onUploadComplete={loadMedia} />
      </GlassCard>

      {/* Filter HUD */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded-xl uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[var(--accent-color)] text-black font-bold'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAssets.map((asset) => (
          <GlassCard key={asset.id} variant="default" className="p-3 flex flex-col justify-between group">
            <div>
              <div
                onClick={() => setPreviewAsset(asset)}
                className="relative h-32 w-full rounded-lg overflow-hidden bg-black/60 mb-2 cursor-pointer group-hover:border group-hover:border-[var(--accent-color)] transition-all"
              >
                <img src={asset.fileUrl} alt={asset.filename} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="space-y-0.5 text-[10px] text-gray-400 font-mono">
                <div className="truncate text-white font-bold">{asset.filename}</div>
                <div className="flex items-center justify-between">
                  <span>{(asset.sizeBytes / 1024).toFixed(1)} KB</span>
                  <span className="uppercase text-cyan-400 font-bold">{asset.category || 'general'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => handleCopyUrl(asset.fileUrl, asset.id)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1 text-[10px] cursor-pointer"
              >
                {copiedId === asset.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === asset.id ? 'Copied' : 'URL'}</span>
              </button>

              <button
                onClick={() => setDeleteTargetId(asset.id)}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-colors cursor-pointer"
                title="Delete Media Asset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Image Preview Modal */}
      {previewAsset && (
        <Modal isOpen={Boolean(previewAsset)} onClose={() => setPreviewAsset(null)} title={previewAsset.filename} maxWidth="2xl">
          <div className="space-y-4 font-mono">
            <div className="w-full max-h-96 rounded-xl overflow-hidden bg-black/80 flex items-center justify-center border border-white/10">
              <img src={previewAsset.fileUrl} alt={previewAsset.filename} className="max-h-96 object-contain" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-black/40 p-3 rounded-xl border border-white/10">
              <div>URL: <a href={previewAsset.fileUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline truncate block">{previewAsset.fileUrl}</a></div>
              <div>Size: <span className="text-white font-bold">{(previewAsset.sizeBytes / 1024).toFixed(1)} KB</span></div>
              <div>Category: <span className="text-emerald-400 font-bold uppercase">{previewAsset.category}</span></div>
              <div>Uploaded: <span className="text-gray-400">{new Date(previewAsset.createdAt).toLocaleString()}</span></div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={Boolean(deleteTargetId)} onClose={() => setDeleteTargetId(null)} title="Confirm Delete Media Asset">
        <div className="space-y-4 text-xs font-mono">
          <p className="text-gray-300">Are you sure you want to permanently delete this media asset and unlink the file from storage?</p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={() => setDeleteTargetId(null)} className="px-4 py-2 rounded-xl bg-white/5 text-gray-300">
              Cancel
            </button>
            <GlowButton variant="secondary" onClick={handleDeleteAsset} className="bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
              Delete File & Record
            </GlowButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
