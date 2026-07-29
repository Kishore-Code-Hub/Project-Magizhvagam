'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Save, RefreshCw, Music, Check, Shield, Upload, FileAudio } from 'lucide-react';
import { useAudio } from '@/providers/AudioProvider';
import { MUSIC_PATH } from '@/lib/audio/constants';

export default function AdminAudioSettingsPage() {
  const {
    isPlaying: isGlobalPlaying,
    isMuted: isGlobalMuted,
    volume: globalVolume,
    enabled: globalEnabled,
    trackTitle: globalTrackTitle,
    trackUrl: globalTrackUrl,
    isAvailable,
    togglePlay: toggleGlobalPlay,
    toggleMute: toggleGlobalMute,
    setVolume: setGlobalVolume,
    refreshAudioSettings,
  } = useAudio();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings state
  const [trackTitle, setTrackTitle] = useState('Cyber Operations Ambient Soundtrack');
  const [trackUrl, setTrackUrl] = useState(MUSIC_PATH);
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(50);
  const [defaultMute, setDefaultMute] = useState(false);

  useEffect(() => {
    fetch('/api/admin/audio')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.trackTitle) setTrackTitle(data.trackTitle);
          if (data.trackUrl) setTrackUrl(data.trackUrl);
          setEnabled(typeof data.enabled === 'boolean' ? data.enabled : true);
          setVolume(typeof data.volume === 'number' ? data.volume : 50);
          setDefaultMute(typeof data.defaultMute === 'boolean' ? data.defaultMute : false);
        }
      })
      .catch((err) => console.error('Failed to load audio settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'music');

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload music file');

      if (data.fileUrl) {
        setTrackUrl(data.fileUrl);
        setTrackTitle(file.name.replace(/\.[^/.]+$/, ''));
        setMessage({ type: 'success', text: `Uploaded music track '${file.name}' successfully!` });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
          volume: Number(volume),
          defaultMute,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save audio settings');

      setGlobalVolume(Number(volume));
      await refreshAudioSettings();
      setMessage({ type: 'success', text: 'Audio settings and music track saved successfully!' });
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
        <span>LOADING_AUDIO_SETTINGS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 sm:p-8 max-w-4xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2.5 tracking-tight uppercase">
            <Music className="w-6 h-6 text-emerald-400" /> GLOBAL AUDIO SETTINGS
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Manage background music, upload custom audio tracks, volume levels, and playback rules.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-extrabold text-xs font-mono tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)] flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'SAVING...' : 'SAVE SETTINGS'}</span>
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
          {message.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <Shield className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Music Asset & File Upload */}
        <div className="p-6 rounded-2xl glass-panel border-emerald-500/30 space-y-5">
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-emerald-500/20 pb-3 flex items-center justify-between">
            <span>MUSIC TRACK & MEDIA ASSET</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              {isAvailable ? 'ACTIVE' : 'FILE NOT FOUND'}
            </span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-gray-300 font-bold block mb-1.5 uppercase">
                Track Title
              </label>
              <input
                type="text"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                placeholder="e.g. Cyber Ambient Operations"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-emerald-500/30 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-gray-300 font-bold block mb-1.5 uppercase">
                Track Audio URL / Path
              </label>
              <input
                type="text"
                value={trackUrl}
                onChange={(e) => setTrackUrl(e.target.value)}
                placeholder="/uploads/music/webmusic.mp3 or https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-emerald-500/30 text-xs font-mono text-emerald-400 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {/* Direct Music File Upload */}
            <div className="pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <Upload className="w-4 h-4 text-emerald-400" />
                )}
                <span>{uploading ? 'UPLOADING MUSIC...' : 'UPLOAD NEW MUSIC FILE (.MP3, .WAV)'}</span>
              </button>
            </div>
          </div>

          {/* Player preview controller */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleGlobalPlay}
                disabled={!isAvailable}
                className="p-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.4)] disabled:opacity-40"
              >
                {isGlobalPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              <div>
                <span className="text-xs font-mono font-bold text-white block truncate max-w-[200px]">
                  {trackTitle || 'Audio Track'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {isGlobalPlaying ? 'PLAYING SOUNDTRACK' : 'CLICK TEST PLAY TO PREVIEW'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleGlobalMute}
              className="p-2.5 rounded-lg bg-black/50 hover:bg-black/70 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            >
              {isGlobalMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Right Column: Audio Rules & Master Volume */}
        <div className="p-6 rounded-2xl glass-panel border-emerald-500/30 space-y-5">
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider border-b border-emerald-500/20 pb-3">
            PLAYBACK RULES & VOLUME
          </h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-emerald-500/20">
            <div>
              <span className="text-xs font-mono font-bold text-white block">Enable Background Music</span>
              <span className="text-[10px] text-gray-400 font-mono">Global toggle for website audio</span>
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
              <span className="text-xs font-mono font-bold text-white block">Default Muted for Visitors</span>
              <span className="text-[10px] text-gray-400 font-mono">Start muted on initial visitor load</span>
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
              onChange={(e) => {
                const val = Number(e.target.value);
                setVolume(val);
                setGlobalVolume(val);
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="text-[11px] font-mono text-gray-400 space-y-1.5 bg-black/40 p-3.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <FileAudio className="w-4 h-4" />
              <span>ACTIVE AUDIO INFO</span>
            </div>
            <div className="truncate">URL: <span className="text-white font-bold">{trackUrl}</span></div>
            <div>Status: <span className={isAvailable ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{isAvailable ? 'Ready for playback' : 'Audio file error / unplayable'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
