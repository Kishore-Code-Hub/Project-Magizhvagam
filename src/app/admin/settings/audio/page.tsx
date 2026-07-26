'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Upload, Save, RefreshCw, Music, Check, Shield, Sliders } from 'lucide-react';

export default function AdminAudioSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audio settings state
  const [trackTitle, setTrackTitle] = useState('Cyber Operations Ambient Soundtrack');
  const [trackUrl, setTrackUrl] = useState('/audio/cyber-ambient.mp3');
  const [enabled, setEnabled] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [loop, setLoop] = useState(true);
  const [volume, setVolume] = useState(50);
  const [fadeInDuration, setFadeInDuration] = useState(1.5);
  const [fadeOutDuration, setFadeOutDuration] = useState(1.5);
  const [defaultMute, setDefaultMute] = useState(false);

  // Preview player state
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/admin/audio')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setTrackTitle(data.trackTitle || 'Cyber Operations Ambient Soundtrack');
          setTrackUrl(data.trackUrl || '/audio/cyber-ambient.mp3');
          setEnabled(typeof data.enabled === 'boolean' ? data.enabled : true);
          setAutoplay(typeof data.autoplay === 'boolean' ? data.autoplay : true);
          setLoop(typeof data.loop === 'boolean' ? data.loop : true);
          setVolume(typeof data.volume === 'number' ? data.volume : 50);
          setFadeInDuration(typeof data.fadeInDuration === 'number' ? data.fadeInDuration : 1.5);
          setFadeOutDuration(typeof data.fadeOutDuration === 'number' ? data.fadeOutDuration : 1.5);
          setDefaultMute(typeof data.defaultMute === 'boolean' ? data.defaultMute : false);
        }
      })
      .catch((err) => console.error('Failed to load audio settings:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (audioElem) {
        audioElem.pause();
      }
    };
  }, [audioElem]);

  const togglePreviewPlay = () => {
    if (!trackUrl) return;
    if (isPreviewPlaying && audioElem) {
      audioElem.pause();
      setIsPreviewPlaying(false);
    } else {
      const audio = audioElem || new Audio(trackUrl);
      audio.volume = volume / 100;
      audio.loop = loop;
      audio
        .play()
        .then(() => {
          setAudioElem(audio);
          setIsPreviewPlaying(true);
        })
        .catch((err) => console.error('Preview playback failed:', err));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio') && !file.name.endsWith('.mp3')) {
      setMessage({ type: 'error', text: 'Invalid file format. Please upload an MP3 or audio file.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'audio');

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audio upload failed');

      setTrackUrl(data.url || data.fileUrl);
      setTrackTitle(file.name.replace(/\.[^/.]+$/, ''));
      setMessage({ type: 'success', text: `Audio uploaded: ${file.name}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/audio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle,
          trackUrl,
          enabled,
          autoplay,
          loop,
          volume: Number(volume),
          fadeInDuration: Number(fadeInDuration),
          fadeOutDuration: Number(fadeOutDuration),
          defaultMute,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save audio settings');

      setMessage({ type: 'success', text: 'Audio CMS settings saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 font-mono text-emerald-400 text-xs flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
        <span>LOADING_AUDIO_CMS_MODULE...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 sm:p-8 max-w-5xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2.5 tracking-tight uppercase">
            <Music className="w-6 h-6 text-emerald-400" /> DYNAMIC AUDIO CMS
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Configure background soundtrack, autoplay behavior, fade durations, and visitor audio defaults.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-extrabold text-xs font-mono tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)] flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'SAVING...' : 'SAVE AUDIO CMS'}</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-mono flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4 shrink-0 text-emerald-400" /> : <Shield className="w-4 h-4 shrink-0 text-rose-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Track Selector & Live Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl glass-panel border-emerald-500/30 space-y-5">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-emerald-500/20 pb-3">
              <Sliders className="w-4 h-4 text-emerald-400" /> SOUNDTRACK SOURCE &amp; PREVIEW
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-300 uppercase tracking-wider block">
                Track Title
              </label>
              <input
                type="text"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                placeholder="Cyber Operations Ambient Soundtrack"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-300 uppercase tracking-wider block">
                Track URL / Asset Path
              </label>
              <input
                type="text"
                value={trackUrl}
                onChange={(e) => setTrackUrl(e.target.value)}
                placeholder="/audio/cyber-ambient.mp3"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono"
              />
            </div>

            {/* Audio Upload Box */}
            <div className="p-4 rounded-xl bg-black/50 border border-emerald-500/20 space-y-3">
              <span className="text-xs font-mono text-emerald-400 font-bold block uppercase">
                Upload New MP3 Soundtrack
              </span>
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-emerald-500/40 hover:border-emerald-500 text-xs font-mono text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{uploading ? 'UPLOADING MP3...' : 'CHOOSE MP3 FILE'}</span>
                <input
                  type="file"
                  accept="audio/mp3,audio/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Live Audio Preview Controller */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePreviewPlay}
                  className="p-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.4)]"
                >
                  {isPreviewPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <div>
                  <span className="text-xs font-mono font-bold text-white block">{trackTitle}</span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {isPreviewPlaying ? 'PLAYING PREVIEW' : 'CLICK TO PREVIEW SOUNDTRACK'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>{volume}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Audio Rules & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl glass-panel border-emerald-500/30 space-y-5">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-emerald-500/20 pb-3">
              PLAYBACK ENGINE CONTROLS
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div>
                <span className="text-xs font-mono font-bold text-white block">Enable Audio Engine</span>
                <span className="text-[10px] text-gray-400 font-mono">Master toggle for background soundtrack</span>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div>
                <span className="text-xs font-mono font-bold text-white block">Autoplay Soundtrack</span>
                <span className="text-[10px] text-gray-400 font-mono">Respects browser autoplay permissions</span>
              </div>
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(e) => setAutoplay(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div>
                <span className="text-xs font-mono font-bold text-white block">Loop Soundtrack</span>
                <span className="text-[10px] text-gray-400 font-mono">Repeat track infinitely</span>
              </div>
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-emerald-500/20">
              <div>
                <span className="text-xs font-mono font-bold text-white block">Default Muted</span>
                <span className="text-[10px] text-gray-400 font-mono">Start muted for new visitors</span>
              </div>
              <input
                type="checkbox"
                checked={defaultMute}
                onChange={(e) => setDefaultMute(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-300 font-bold uppercase">Master Volume ({volume}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-gray-400 uppercase block">Fade In (Sec)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={fadeInDuration}
                  onChange={(e) => setFadeInDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-gray-400 uppercase block">Fade Out (Sec)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={fadeOutDuration}
                  onChange={(e) => setFadeOutDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
