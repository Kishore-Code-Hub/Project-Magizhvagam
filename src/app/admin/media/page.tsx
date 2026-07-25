'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { FileUploader } from '@/components/ui/FileUploader';
import { Image as ImageIcon, Folder, Upload, Trash2, Copy, Check } from 'lucide-react';

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  return (
    <div className="space-y-8 font-mono text-left max-w-6xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[var(--accent-color)]" /> Media Assets Library
          </h1>
          <p className="text-xs text-gray-400">Upload, organize, and copy media asset URLs across portfolio modules.</p>
        </div>
      </div>

      <GlassCard variant="default">
        <h4 className="text-sm font-bold text-white uppercase mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-[var(--accent-color)]" /> Upload New Asset
        </h4>
        <FileUploader category="uploads" onUploadComplete={loadMedia} />
      </GlassCard>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {assets.map((asset) => (
          <GlassCard key={asset.id} variant="default" className="p-3 flex flex-col justify-between">
            <div className="relative h-32 w-full rounded-lg overflow-hidden bg-black/60 mb-2">
              <img src={asset.fileUrl} alt={asset.filename} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1 text-[10px] text-gray-400 font-mono">
              <div className="truncate text-white font-bold">{asset.filename}</div>
              <div>{(asset.sizeBytes / 1024).toFixed(1)} KB</div>
            </div>

            <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => handleCopyUrl(asset.fileUrl, asset.id)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1 text-[10px]"
              >
                {copiedId === asset.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === asset.id ? 'Copied' : 'URL'}</span>
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
