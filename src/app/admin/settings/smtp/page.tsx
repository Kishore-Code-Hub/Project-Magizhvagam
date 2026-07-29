'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { Mail, Save, Send, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function AdminSMTPPage() {
  const [formData, setFormData] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    senderEmail: 'noreply@soundkish.dev',
    recipientEmail: 'admin@soundkish.dev',
    enabled: false,
    notifyMode: 'FIRST_VISIT',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings/smtp')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setFormData({
            smtpHost: data.smtpHost || 'smtp.gmail.com',
            smtpPort: data.smtpPort || 587,
            smtpUser: data.smtpUser || '',
            smtpPass: data.smtpPassMasked || '',
            senderEmail: data.senderEmail || 'noreply@soundkish.dev',
            recipientEmail: data.recipientEmail || 'admin@soundkish.dev',
            enabled: Boolean(data.enabled),
            notifyMode: data.notifyMode || 'FIRST_VISIT',
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
        const res = await fetch('/api/admin/settings/smtp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save SMTP configuration');

        setIsDirty(false);
        setLastSaved(new Date().toLocaleTimeString());
        setMessage({ type: 'success', text: 'SMTP & Email dispatch settings saved securely.' });
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Save error' });
      } finally {
        setSaving(false);
      }
    },
    [formData]
  );

  const handleTestEmail = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings/smtp', { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'SMTP Test Handshake Failed');

      setMessage({ type: 'success', text: data.message || 'Test email dispatched cleanly!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'SMTP Handshake Error' });
    } finally {
      setTesting(false);
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
            <Mail className="w-6 h-6 text-[var(--accent-color)]" /> SMTP & Email Notifications
          </h1>
          <p className="text-xs text-gray-400">Configure encrypted mailer credentials, contact alerts, and visit notifications.</p>
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
        <GlassCard variant="default" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> AES-256 Encrypted SMTP Server
              </span>
              <p className="text-[10px] text-gray-400">Turn this toggle on after filling out valid SMTP credentials to enable email alerts.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="smtpEnabled"
                checked={formData.enabled}
                onChange={(e) => handleFieldChange('enabled', e.target.checked)}
                className="accent-[var(--accent-color)] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="smtpEnabled" className="text-xs text-emerald-400 font-bold cursor-pointer">
                Enable SMTP
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">SMTP HOST *</label>
              <input
                type="text"
                required
                value={formData.smtpHost}
                onChange={(e) => handleFieldChange('smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
              />
              <p className="mt-1 text-[10px] text-gray-400">Example: <code className="text-emerald-400">smtp.gmail.com</code> — The outgoing mail server provided by your email service.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">SMTP PORT *</label>
              <input
                type="number"
                required
                value={formData.smtpPort}
                onChange={(e) => handleFieldChange('smtpPort', parseInt(e.target.value))}
                placeholder="587"
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
              />
              <p className="mt-1 text-[10px] text-gray-400">Example: <code className="text-emerald-400">587</code> (Use 587 for TLS, or 465 for SSL).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">SMTP USERNAME / EMAIL *</label>
              <input
                type="text"
                required
                value={formData.smtpUser}
                onChange={(e) => handleFieldChange('smtpUser', e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
              />
              <p className="mt-1 text-[10px] text-gray-400">Enter the email account used to authenticate & send emails (e.g. <code className="text-emerald-400">yourname@gmail.com</code>).</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">APP PASSWORD *</label>
              <input
                type="password"
                required
                value={formData.smtpPass}
                onChange={(e) => handleFieldChange('smtpPass', e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
              />
              <p className="mt-1 text-[10px] text-amber-400 font-mono">This is NOT your personal Gmail password. Generate a 16-character Google App Password.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">SENDER EMAIL ADDRESS</label>
              <input
                type="email"
                value={formData.senderEmail}
                onChange={(e) => handleFieldChange('senderEmail', e.target.value)}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
              />
              <p className="mt-1 text-[10px] text-gray-400">The email address from which your portfolio sends automated messages.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">ADMIN RECIPIENT EMAIL</label>
              <input
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => handleFieldChange('recipientEmail', e.target.value)}
                className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)]"
              />
              <p className="mt-1 text-[10px] text-gray-400">Whenever someone submits the contact form, this email address receives the inquiry.</p>
            </div>
          </div>

          {/* Need Help? Google App Password Guide Box */}
          <div className="p-4 rounded-xl bg-black/40 border border-amber-500/20 space-y-2">
            <details className="group">
              <summary className="text-xs font-bold text-amber-400 uppercase cursor-pointer flex items-center justify-between select-none">
                <span>Need Help? Click here to learn how to configure Gmail SMTP in 4 steps</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <ol className="mt-3 text-xs text-gray-300 space-y-1.5 list-decimal pl-4 font-mono leading-relaxed">
                <li>Log into your Google Account and go to <strong className="text-white">Security Settings</strong> (<code className="text-emerald-400">myaccount.google.com/security</code>).</li>
                <li>Ensure <strong className="text-white">2-Step Verification</strong> is enabled on your Google account.</li>
                <li>Search for <strong className="text-white">&quot;App Passwords&quot;</strong> or select <strong className="text-white">2-Step Verification ➔ App Passwords</strong>.</li>
                <li>Create an App Password named <strong className="text-emerald-400 font-bold">&quot;Portfolio CMS&quot;</strong>, copy the generated 16-character code, and paste it into the <strong className="text-white">App Password</strong> field above.</li>
              </ol>
            </details>
          </div>

          {/* Collapsible Advanced Settings */}
          <div className="pt-2 border-t border-white/10">
            <details className="group">
              <summary className="text-xs font-bold text-gray-400 uppercase cursor-pointer hover:text-white flex items-center gap-2 select-none">
                <span>Advanced Settings & Alert Frequency</span>
              </summary>
              <div className="pt-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase">Portfolio Visitor Alert Mode</label>
                  <select
                    value={formData.notifyMode}
                    onChange={(e) => handleFieldChange('notifyMode', e.target.value)}
                    className="w-full px-4 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 text-white"
                  >
                    <option value="FIRST_VISIT">First Visit Only (Debounced Session)</option>
                    <option value="EVERY_VISIT">Every Unique Visit</option>
                    <option value="DAILY_SUMMARY">Daily Digest Summary</option>
                    <option value="DISABLED">Disabled (Contact Forms Only)</option>
                  </select>
                </div>
              </div>
            </details>
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

        <div className="flex items-center justify-between gap-4">
          <GlowButton type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Save Configuration (Ctrl+S)
          </GlowButton>

          <GlowButton type="button" variant="secondary" isLoading={testing} onClick={handleTestEmail} leftIcon={<Send className="w-4 h-4" />}>
            Send Test Email
          </GlowButton>
        </div>
      </form>
    </div>
  );
}
