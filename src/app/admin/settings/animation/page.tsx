'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { Sparkles, Save, CheckCircle2, AlertCircle, Play, Eye, Sliders, Shield } from 'lucide-react';

export default function AdminAnimationSettingsPage() {
  const [formData, setFormData] = useState({
    loadingDuration: 5.0,
    enableLoader: true,
    skipLoaderForReturning: false,
    enableScrollReveal: true,
    repeatScrollReveal: false,
    waitForCriticalAssets: true,
    fadeDuration: 0.7,
    accessGrantedHoldTime: 2.0,
    welcomeScreenHoldTime: 2.0,
    bootMsgOffsetX: 0,
    bootMsgOffsetY: -40,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings/animation')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setFormData({
            loadingDuration: data.loadingDuration ?? 5.0,
            enableLoader: data.enableLoader ?? true,
            skipLoaderForReturning: data.skipLoaderForReturning ?? false,
            enableScrollReveal: data.enableScrollReveal ?? true,
            repeatScrollReveal: data.repeatScrollReveal ?? false,
            waitForCriticalAssets: data.waitForCriticalAssets ?? true,
            fadeDuration: data.fadeDuration ?? 0.7,
            accessGrantedHoldTime: data.accessGrantedHoldTime ?? 2.0,
            welcomeScreenHoldTime: data.welcomeScreenHoldTime ?? 2.0,
            bootMsgOffsetX: data.bootMsgOffsetX ?? 0,
            bootMsgOffsetY: data.bootMsgOffsetY ?? -40,
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setSaving(true);
      setMessage(null);

      try {
        const res = await fetch('/api/admin/settings/animation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save animation settings');

        setIsDirty(false);
        setLastSaved(new Date().toLocaleTimeString());
        setMessage({ type: 'success', text: 'Animation & Session Loader settings saved successfully!' });
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Save error' });
      } finally {
        setSaving(false);
      }
    },
    [formData]
  );

  const handlePreviewLoader = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('soc_session_booted');
      window.open('/?boot=true', '_blank');
    }
  };

  const handlePreviewReveal = () => {
    if (typeof window !== 'undefined') {
      window.open('/#about', '_blank');
    }
  };

  // Keyboard Ctrl+S shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return (
    <div className="space-y-8 font-mono text-left max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--accent-color)]" /> Animation & Session Loader Settings
          </h1>
          <p className="text-xs text-gray-400">Configure startup boot loader duration, GPU scroll reveal animations, and motion preferences.</p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-[10px] text-amber-400 font-bold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
              Unsaved Changes
            </span>
          )}
          {lastSaved && <span className="text-[10px] text-gray-400">Last saved: {lastSaved}</span>}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Session Loader Configuration Card */}
        <GlassCard variant="default" className="space-y-4">
          <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2 border-b border-white/10 pb-2">
            <Sliders className="w-4 h-4 text-emerald-400" /> Startup Session Loader Engine
          </h4>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-300 uppercase">
                Loading Boot Duration ({formData.loadingDuration.toFixed(1)} seconds)
              </label>
              <span className="text-xs text-[var(--accent-color)] font-bold">{formData.loadingDuration.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="0.5"
              value={formData.loadingDuration}
              onChange={(e) => handleFieldChange('loadingDuration', parseFloat(e.target.value))}
              className="w-full accent-[var(--accent-color)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>1s (Instant)</span>
              <span>5s (Default)</span>
              <span>10s</span>
              <span>15s (Cinematic)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-emerald-400 uppercase">
                  Access Granted Hold Time ({formData.accessGrantedHoldTime.toFixed(1)} seconds)
                </label>
                <span className="text-xs text-emerald-400 font-bold">{formData.accessGrantedHoldTime.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={formData.accessGrantedHoldTime}
                onChange={(e) => handleFieldChange('accessGrantedHoldTime', parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>0.5s</span>
                <span>2.0s (Default)</span>
                <span>5s</span>
                <span>10.0s</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-cyan-400 uppercase">
                  Welcome Screen Hold Time ({(formData.welcomeScreenHoldTime || 2.0).toFixed(1)} seconds)
                </label>
                <span className="text-xs text-cyan-400 font-bold">{(formData.welcomeScreenHoldTime || 2.0).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={formData.welcomeScreenHoldTime || 2.0}
                onChange={(e) => handleFieldChange('welcomeScreenHoldTime', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>0.5s</span>
                <span>2.0s (Default)</span>
                <span>5s</span>
                <span>10.0s</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-cyan-400 uppercase">
                    Message Horizontal Offset ({formData.bootMsgOffsetX}px)
                  </label>
                  <span className="text-xs text-cyan-400 font-bold">{formData.bootMsgOffsetX}px</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  step="5"
                  value={formData.bootMsgOffsetX}
                  onChange={(e) => handleFieldChange('bootMsgOffsetX', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-amber-400 uppercase">
                    Message Vertical Offset ({formData.bootMsgOffsetY}px)
                  </label>
                  <span className="text-xs text-amber-400 font-bold">{formData.bootMsgOffsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  step="5"
                  value={formData.bootMsgOffsetY}
                  onChange={(e) => handleFieldChange('bootMsgOffsetY', parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
              <input
                type="checkbox"
                id="enableLoader"
                checked={formData.enableLoader}
                onChange={(e) => handleFieldChange('enableLoader', e.target.checked)}
                className="accent-[var(--accent-color)] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="enableLoader" className="text-xs text-gray-200 font-bold cursor-pointer">
                Enable Startup Boot Screen
              </label>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
              <input
                type="checkbox"
                id="waitForCriticalAssets"
                checked={formData.waitForCriticalAssets}
                onChange={(e) => handleFieldChange('waitForCriticalAssets', e.target.checked)}
                className="accent-[var(--accent-color)] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="waitForCriticalAssets" className="text-xs text-emerald-400 font-bold cursor-pointer">
                Wait for Critical Assets (100% Preload)
              </label>
            </div>
          </div>
        </GlassCard>

        {/* Scroll Reveal Configuration Card */}
        <GlassCard variant="default" className="space-y-4">
          <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2 border-b border-white/10 pb-2">
            <Eye className="w-4 h-4 text-cyan-400" /> GPU-Accelerated Scroll Reveal Animations
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
              <input
                type="checkbox"
                id="enableScrollReveal"
                checked={formData.enableScrollReveal}
                onChange={(e) => handleFieldChange('enableScrollReveal', e.target.checked)}
                className="accent-[var(--accent-color)] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="enableScrollReveal" className="text-xs text-gray-200 font-bold cursor-pointer">
                Enable Scroll Reveal Animations
              </label>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
              <input
                type="checkbox"
                id="repeatScrollReveal"
                checked={formData.repeatScrollReveal}
                onChange={(e) => handleFieldChange('repeatScrollReveal', e.target.checked)}
                className="accent-[var(--accent-color)] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="repeatScrollReveal" className="text-xs text-gray-200 font-bold cursor-pointer">
                Repeat Animations on Re-entry
              </label>
            </div>
          </div>
        </GlassCard>

        {message && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <GlowButton type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Save Configuration (Ctrl+S)
          </GlowButton>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePreviewLoader}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono border border-white/10 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Preview Loader</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
