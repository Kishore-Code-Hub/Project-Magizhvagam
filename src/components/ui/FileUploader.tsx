'use client';

import React, { useState } from 'react';
import { Upload, X, Check, Image as ImageIcon, FileText } from 'lucide-react';

interface FileUploaderProps {
  onUploadComplete: (url: string) => void;
  category?: string;
  accept?: string;
  label?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  category = 'uploads',
  accept = 'image/*,.pdf',
  label = 'Upload File or Drag & Drop',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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

  return (
    <div className="relative w-full">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-accent)] rounded-xl cursor-pointer bg-[var(--bg-glass)] hover:border-[var(--accent-color)] transition-colors p-4 text-center">
        {isUploading ? (
          <div className="flex items-center gap-2 text-sm font-mono text-[var(--accent-color)]">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Uploading & Compressing...
          </div>
        ) : preview ? (
          <div className="flex items-center gap-3">
            <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-white/20" />
            <div className="text-left text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Upload Complete
              </span>
              <p className="text-gray-400 text-[10px] truncate max-w-[180px]">{preview}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-[var(--accent-color)]" />
            <span className="text-xs font-mono text-gray-300">{label}</span>
            <span className="text-[10px] font-mono text-gray-500">Formats: JPG, PNG, WEBP, SVG, PDF</span>
          </div>
        )}
        <input type="file" className="hidden" accept={accept} onChange={handleFileChange} disabled={isUploading} />
      </label>

      {error && <p className="mt-2 text-xs font-mono text-red-400">{error}</p>}
    </div>
  );
};
