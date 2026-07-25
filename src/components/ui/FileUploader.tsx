'use client';

import React, { useState, useEffect } from 'react';
import { Upload, X, Check, Image as ImageIcon, FolderOpen, Search } from 'lucide-react';
import { Modal } from './Modal';

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
  const [preview, setPreview] = useState<string | null>(value || null);

  useEffect(() => {
    if (value) {
      setPreview(value);
    }
  }, [value]);

  // Media Library Picker Modal State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setPreview(data.fileUrl);
      onUploadComplete(data.fileUrl);
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
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
    setPreview(url);
    onUploadComplete(url);
    setIsLibraryOpen(false);
  };

  const filteredAssets = libraryAssets.filter((a) =>
    a.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.fileUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full space-y-2">
      <div className="flex items-center gap-2">
        <label className="flex-1 flex flex-col items-center justify-center h-28 border-2 border-dashed border-[var(--border-accent)] rounded-xl cursor-pointer bg-[var(--bg-glass)] hover:border-[var(--accent-color)] transition-colors p-3 text-center">
          {isUploading ? (
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-color)]">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Uploading & Compressing...
            </div>
          ) : preview ? (
            <div className="flex items-center gap-3">
              <img src={preview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-white/20" />
              <div className="text-left text-xs font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Selected
                </span>
                <p className="text-gray-400 text-[10px] truncate max-w-[180px]">{preview}</p>
              </div>
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
