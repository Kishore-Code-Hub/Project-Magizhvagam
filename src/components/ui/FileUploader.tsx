'use client';

import React, { useState, useEffect } from 'react';
import { Upload, X, Check, Image as ImageIcon, FolderOpen, Search, ExternalLink, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';
import { normalizeImageUrl } from '@/lib/image-utils';

interface FileUploaderProps {
  onUploadComplete: (url: string) => void;
  value?: string;
  category?: string;
  accept?: string;
  label?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  value,
  category = 'uploads',
  accept = 'image/*,.pdf',
  label = 'Upload File or Drag & Drop',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(normalizeImageUrl(value, category) || null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    setPreview(normalizeImageUrl(value, category) || null);
  }, [value, category]);

  // Media Library Picker Modal State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(false);

    // Instant local preview for immediate visual feedback
    if (file.type.startsWith('image/')) {
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      const normalizedUrl = normalizeImageUrl(data.fileUrl, category) || data.fileUrl;
      setPreview(normalizedUrl);
      onUploadComplete(normalizedUrl);
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreview(null);
    setImageError(false);
    onUploadComplete('');
  };

  const handleOpenLibrary = async () => {
    setIsLibraryOpen(true);
    setLibraryLoading(true);
    try {
      const res = await fetch('/api/admin/media/upload');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setLibraryAssets(data);
      }
    } catch (err) {
      console.error('Failed to load media library assets:', err);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleSelectAsset = (url: string) => {
    setImageError(false);
    const normalizedUrl = normalizeImageUrl(url, category) || url;
    setPreview(normalizedUrl);
    onUploadComplete(normalizedUrl);
    setIsLibraryOpen(false);
  };

  const filteredAssets = libraryAssets.filter((a) =>
    a.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.fileUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full space-y-2">
      {preview ? (
        <div className="relative w-full rounded-xl border border-[var(--border-accent)] bg-black/60 overflow-hidden p-3 transition-all">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-32 h-24 rounded-lg overflow-hidden border border-white/10 bg-black/40 flex-shrink-0 flex items-center justify-center">
              {preview.endsWith('.pdf') || preview.includes('pdf') ? (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <ImageIcon className="w-8 h-8 text-cyan-400" />
                  <span className="text-[10px] uppercase font-bold">PDF Document</span>
                </div>
              ) : !imageError ? (
                <img
                  src={preview}
                  alt="Asset Preview"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center text-xs font-mono text-amber-400">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px]">Preview Unavailable</span>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-left font-mono space-y-1.5 w-full">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Selected Asset
                </span>
              </div>
              <p className="text-gray-300 text-xs truncate max-w-full font-mono bg-white/5 px-2 py-1 rounded border border-white/10">{preview}</p>
              
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <label className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-[var(--accent-color)]" />
                  <span>Replace</span>
                  <input type="file" className="hidden" accept={accept} onChange={handleFileChange} disabled={isUploading} />
                </label>

                <button
                  type="button"
                  onClick={handleOpenLibrary}
                  className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <FolderOpen className="w-3 h-3" />
                  <span>Library</span>
                </button>

                <a
                  href={preview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>View</span>
                </a>

                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <label className="flex-1 flex flex-col items-center justify-center h-28 border-2 border-dashed border-[var(--border-accent)] rounded-xl cursor-pointer bg-[var(--bg-glass)] hover:border-[var(--accent-color)] transition-colors p-3 text-center">
            {isUploading ? (
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-color)]">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Uploading & Compressing...
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Upload className="w-5 h-5 text-[var(--accent-color)]" />
                <span className="text-xs font-mono text-gray-300">{label}</span>
                <span className="text-[10px] font-mono text-gray-500">Formats: JPG, PNG, WEBP, SVG, PDF</span>
              </div>
            )}
            <input type="file" className="hidden" accept={accept} onChange={handleFileChange} disabled={isUploading} />
          </label>

          <button
            type="button"
            onClick={handleOpenLibrary}
            className="h-28 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex flex-col items-center justify-center gap-2 font-mono text-xs cursor-pointer transition-colors"
          >
            <FolderOpen className="w-5 h-5 text-cyan-400" />
            <span>Choose from Library</span>
          </button>
        </div>
      )}

      {error && <p className="text-xs font-mono text-red-400">{error}</p>}

      {/* Media Library Asset Picker Modal */}
      <Modal isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} title="Select Asset from Media Library" maxWidth="4xl">
        <div className="space-y-4 font-mono">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search assets by filename or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>

          {libraryLoading ? (
            <div className="p-8 text-center text-xs text-gray-400">Loading library assets...</div>
          ) : filteredAssets.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-1">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset.fileUrl)}
                  className="group relative rounded-xl border border-white/10 hover:border-[var(--accent-color)] bg-black/40 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] p-2 flex flex-col justify-between"
                >
                  <div className="h-24 w-full flex items-center justify-center bg-black/60 rounded-lg overflow-hidden mb-2">
                    {asset.mimeType?.startsWith('image') || asset.fileUrl?.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i) ? (
                      <img src={asset.fileUrl} alt={asset.filename} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                  <div className="text-[10px] text-gray-300 truncate font-bold">{asset.filename}</div>
                  <div className="text-[9px] text-gray-500 uppercase">{asset.category || 'general'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-400">No media assets found in library.</div>
          )}
        </div>
      </Modal>
    </div>
  );
};
