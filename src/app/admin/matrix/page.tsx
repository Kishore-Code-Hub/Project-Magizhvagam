'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import {
  Terminal,
  Play,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Sliders,
  Sparkles,
  Layers,
  Palette,
  Wind,
} from 'lucide-react';
import {
  MatrixSettings,
  DEFAULT_SETTINGS,
  PRESETS,
  MatrixPreset,
  CharacterMode,
  RainDirection,
  WindMode,
} from '@/components/background/store/matrixStore';
import { useMatrixSettings } from '@/components/background/hooks/useMatrixSettings';

export default function AdminMatrixPage() {
  const { settings, updateSettings, applyPreset } = useMatrixSettings();
  const [localSettings, setLocalSettings] = useState<MatrixSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize local settings when hook settings update
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = (key: keyof MatrixSettings, value: any) => {
    const updated = { ...localSettings, [key]: value, preset: 'Custom' as MatrixPreset };
    setLocalSettings(updated);
    updateSettings({ [key]: value, preset: 'Custom' });
  };

  const handleSelectPreset = (presetName: MatrixPreset) => {
    const presetOverrides = PRESETS[presetName];
    if (presetOverrides) {
      const updated = { ...localSettings, ...presetOverrides, preset: presetName };
      setLocalSettings(updated);
      applyPreset(presetName);
    }
  };

  const handleSaveToDB = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matrixSpeed: localSettings.rainSpeed,
          matrixDensity: localSettings.density / 45,
          matrixColor: localSettings.primaryColor,
          glassBlur: localSettings.glowStrength,
          enableParticles: localSettings.enabled,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || `HTTP ${res.status}: Save failed`);

      setMessage({ type: 'success', text: 'Matrix Engine configuration persisted to database!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save matrix configuration' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-left max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Terminal className="w-6 h-6 text-[var(--accent-color)]" /> Matrix Engine Studio & Live Preview
          </h1>
          <p className="text-xs text-gray-400">
            Real-time customization of character sets, fall physics, glow, density, colors, and presets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GlowButton
            variant="outline"
            size="sm"
            onClick={() => handleSelectPreset('Classic Matrix')}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset Preset
          </GlowButton>
          <GlowButton
            variant="primary"
            size="sm"
            isLoading={saving}
            onClick={handleSaveToDB}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save to Database
          </GlowButton>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Controls Panel */}
        <div className="lg:col-span-6 space-y-6 max-h-[80vh] overflow-y-auto pr-2 no-scrollbar">
          {/* Preset Chips */}
          <GlassCard variant="glow" className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--accent-color)]" /> Engine Presets
            </h3>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRESETS) as MatrixPreset[]).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectPreset(name)}
                  className={`px-3 py-1.5 text-xs rounded-xl border transition-all cursor-pointer ${
                    localSettings.preset === name
                      ? 'bg-[var(--accent-color)] text-black font-bold border-[var(--accent-color)] shadow-[var(--shadow-accent-glow)]'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Character Source */}
          <GlassCard variant="default" className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" /> Character Source & Sets
            </h3>

            <div>
              <label className="block text-[11px] text-gray-400 mb-1">CHARACTER MODE</label>
              <select
                value={localSettings.characterMode}
                onChange={(e) => handleSettingChange('characterMode', e.target.value as CharacterMode)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)] cursor-pointer"
              >
                <option value="binary">Binary (0 1)</option>
                <option value="katakana">Katakana (ｱ ｲ ｳ...)</option>
                <option value="hex">Hexadecimal (0-9 A-F)</option>
                <option value="cyber">Cyber Symbols (⚡ ⚙ ⌘ ⌬)</option>
                <option value="ascii">Random ASCII (! @ # $ %)</option>
                <option value="keywords">Cyber Keywords (ROOT, SHELL, KERNEL)</option>
                <option value="languages">Programming Languages (Python, TS, Rust)</option>
                <option value="networking">Networking (TCP, UDP, DNS, SSH)</option>
                <option value="linux">Linux Commands (sudo, grep, nmap)</option>
                <option value="sql">SQL Commands (SELECT, JOIN, WHERE)</option>
                <option value="custom">Custom Text / Keywords</option>
                <option value="mixed">Mixed Hybrid Set</option>
              </select>
            </div>

            {localSettings.characterMode === 'custom' && (
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">CUSTOM KEYWORDS / TEXT (SPACE SEPARATED)</label>
                <input
                  type="text"
                  value={localSettings.customText || ''}
                  onChange={(e) => handleSettingChange('customText', e.target.value)}
                  placeholder="KENTUCKY PYTHON FASTAPI SOC AI LINUX CYBERSECURITY"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
                />
              </div>
            )}
          </GlassCard>

          {/* Animation & Speed Controls */}
          <GlassCard variant="default" className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" /> Animation & Density Sliders
            </h3>

            {/* Rain Speed */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Rain Fall Speed</span>
                <span className="text-[var(--accent-color)] font-bold">{localSettings.rainSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="4.0"
                step="0.1"
                value={localSettings.rainSpeed}
                onChange={(e) => handleSettingChange('rainSpeed', parseFloat(e.target.value))}
                className="w-full accent-[var(--accent-color)] cursor-pointer"
              />
            </div>

            {/* Stream Density */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Stream Density</span>
                <span className="text-[var(--accent-color)] font-bold">{localSettings.density}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={localSettings.density}
                onChange={(e) => handleSettingChange('density', parseInt(e.target.value))}
                className="w-full accent-[var(--accent-color)] cursor-pointer"
              />
            </div>

            {/* Trail Length */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Trail Length</span>
                <span className="text-[var(--accent-color)] font-bold">{localSettings.trailLength} chars</span>
              </div>
              <input
                type="range"
                min="8"
                max="40"
                step="1"
                value={localSettings.trailLength}
                onChange={(e) => handleSettingChange('trailLength', parseInt(e.target.value))}
                className="w-full accent-[var(--accent-color)] cursor-pointer"
              />
            </div>

            {/* Font Size */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Font Size</span>
                <span className="text-[var(--accent-color)] font-bold">{localSettings.fontSize} px</span>
              </div>
              <input
                type="range"
                min="10"
                max="28"
                step="1"
                value={localSettings.fontSize}
                onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                className="w-full accent-[var(--accent-color)] cursor-pointer"
              />
            </div>

            {/* Column Spacing */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Column Spacing</span>
                <span className="text-[var(--accent-color)] font-bold">{localSettings.columnSpacing} px</span>
              </div>
              <input
                type="range"
                min="16"
                max="64"
                step="4"
                value={localSettings.columnSpacing}
                onChange={(e) => handleSettingChange('columnSpacing', parseInt(e.target.value))}
                className="w-full accent-[var(--accent-color)] cursor-pointer"
              />
            </div>
          </GlassCard>

          {/* Visual FX & Glow */}
          <GlassCard variant="default" className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-purple-400" /> Visual FX & Color Palette
            </h3>

            {/* Opacity */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Overall Canvas Opacity</span>
                <span className="text-[var(--accent-color)] font-bold">{Math.round(localSettings.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={localSettings.opacity}
                onChange={(e) => handleSettingChange('opacity', parseFloat(e.target.value))}
                className="w-full accent-[var(--accent-color)] cursor-pointer"
              />
            </div>

            {/* Glow Strength */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Glow Intensity (Blur)</span>
                <span className="text-[var(--accent-color)] font-bold">{localSettings.glowStrength} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={localSettings.glowStrength}
                onChange={(e) => handleSettingChange('glowStrength', parseInt(e.target.value))}
                className="w-full accent-[var(--accent-color)] cursor-pointer"
              />
            </div>

            {/* Background Darkness */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Trail Fade Opacity</span>
                <span className="text-[var(--accent-color)] font-bold">{localSettings.backgroundDarkness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.45"
                step="0.01"
                value={localSettings.backgroundDarkness}
                onChange={(e) => handleSettingChange('backgroundDarkness', parseFloat(e.target.value))}
                className="w-full accent-[var(--accent-color)] cursor-pointer"
              />
            </div>
          </GlassCard>
        </div>

        {/* Right Live Interactive Preview Canvas */}
        <div className="lg:col-span-6 sticky top-6">
          <GlassCard variant="glow" className="p-4 relative">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" /> LIVE STREAM PREVIEW
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                60 FPS ACTIVE
              </span>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full h-[520px] rounded-xl overflow-hidden bg-[#020202] border border-[var(--border-accent)]">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-center max-w-xs">
                  <h4 className="text-sm font-bold text-white uppercase mb-1">Portfolio Canvas HUD</h4>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Mode: <span className="text-[var(--accent-color)] font-bold">{localSettings.characterMode}</span>
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
