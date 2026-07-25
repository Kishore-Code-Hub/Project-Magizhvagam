'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { CyberBadge } from '@/components/ui/CyberBadge';
import { Palette, Save, CheckCircle, Sliders, RefreshCw, Download, Upload } from 'lucide-react';
import { DESIGN_SYSTEM, ThemePreset } from '@/lib/design-system';

export default function AdminAppearancePage() {
  const [settings, setSettings] = useState({
    themePreset: 'cyber-green',
    primaryColor: '#00ff66',
    secondaryColor: '#00cc52',
    accentGlow: 'rgba(0, 255, 102, 0.35)',
    matrixSpeed: 1.0,
    matrixDensity: 1.0,
    matrixColor: '#00ff66',
    glassBlur: 20,
    borderRadius: 16,
    enableParticles: true,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/appearance')
      .then((res) => res.json())
      .then((data) => {
        if (data) setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch((err) => console.error(err));
  }, []);

  const handleExportTheme = () => {
    const jsonStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${settings.themePreset}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setSettings((prev) => ({ ...prev, ...imported }));
        setMessage('Theme imported successfully! Click Save to apply.');
      } catch {
        setMessage('Invalid JSON theme file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSelectPreset = (presetKey: ThemePreset) => {
    const preset = DESIGN_SYSTEM.colors.presets[presetKey];
    if (preset) {
      setSettings((prev) => ({
        ...prev,
        themePreset: presetKey,
        primaryColor: preset.primary,
        secondaryColor: preset.secondary,
        accentGlow: preset.accentGlow,
        matrixColor: preset.primary,
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Save failed');

      setMessage('Visual appearance settings updated!');
    } catch (err: any) {
      setMessage('Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-mono text-left max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Palette className="w-6 h-6 text-[var(--accent-color)]" /> Visual Theme & Canvas Editor
          </h1>
          <p className="text-xs text-gray-400">Live customization of Matrix rain, colors, glass blur, and glow accents.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Presets */}
        <GlassCard variant="default">
          <h4 className="text-sm font-bold text-white uppercase mb-3">Theme Color Presets</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(DESIGN_SYSTEM.colors.presets).map(([key, p]) => (
              <button
                type="button"
                key={key}
                onClick={() => handleSelectPreset(key as ThemePreset)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.themePreset === key
                    ? 'border-[var(--accent-color)] bg-[var(--bg-glass)] font-bold'
                    : 'border-white/10 hover:border-white/30 bg-black/40'
                }`}
              >
                <div className="w-full h-3 rounded mb-2" style={{ backgroundColor: p.primary }} />
                <div className="text-xs text-white truncate">{p.name}</div>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Sliders & Parameters */}
        <GlassCard variant="default" className="space-y-4">
          <h4 className="text-sm font-bold text-white uppercase mb-2 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[var(--accent-color)]" /> Theme Glass & Radius Settings
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                GLASS PANEL BLUR ({settings.glassBlur}px)
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={settings.glassBlur}
                onChange={(e) => setSettings({ ...settings, glassBlur: parseInt(e.target.value) })}
                className="w-full accent-[var(--accent-color)]"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                BORDER RADIUS ({settings.borderRadius}px)
              </label>
              <input
                type="range"
                min="4"
                max="24"
                value={settings.borderRadius}
                onChange={(e) => setSettings({ ...settings, borderRadius: parseInt(e.target.value) })}
                className="w-full accent-[var(--accent-color)]"
              />
            </div>
          </div>
        </GlassCard>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <GlowButton type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Save Appearance Configuration
          </GlowButton>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportTheme}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono border border-white/10 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Theme JSON</span>
            </button>

            <label className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono border border-white/10 flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Import Theme JSON</span>
              <input type="file" accept=".json" onChange={handleImportTheme} className="hidden" />
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
