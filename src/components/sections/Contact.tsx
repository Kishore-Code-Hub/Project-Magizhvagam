'use client';

import React, { useState } from 'react';
import { Send, ShieldCheck, Terminal, CheckCircle2, Lock, Radio, AlertCircle } from 'lucide-react';
import { CyberAudio } from '@/lib/CyberAudio';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function Contact() {
  const { audioMuted } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '',
  });

  const [status, setStatus] = useState<'idle' | 'encrypting' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const transmissionSteps = [
    '[1/5] Constructing Encrypted Data Payload...',
    '[2/5] Establishing TLS 1.3 Secure Tunnel to SOC Server...',
    '[3/5] Encrypting Packet via AES-256-GCM...',
    '[4/5] Routing Secure Packet through Anti-Spam Firewall...',
    '[5/5] Transmission Complete: Delivered to Kishore SOC Console.',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setErrorMessage('All terminal parameters are required.');
      return;
    }

    setStatus('encrypting');
    setLogs([]);
    setErrorMessage('');

    // Step by step realistic transmission terminal sequence
    let current = 0;
    const interval = setInterval(() => {
      if (current < transmissionSteps.length) {
        setLogs((prev) => [...prev, transmissionSteps[current]]);
        CyberAudio.playPacketPing(audioMuted);
        current++;
      } else {
        clearInterval(interval);
        // Execute real API request
        sendApiRequest();
      }
    }, 350);
  };

  const sendApiRequest = async () => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to deliver packet.');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '', honeypot: '' });
      CyberAudio.playBootChime(audioMuted);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Transmission failed.');
    }
  };

  return (
    <section id="contact" className="py-24 px-4 md:px-8 relative z-10 circuit-grid font-mono">
      <div className="max-w-7xl mx-auto space-y-12 pl-0 lg:pl-16">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
            <span className="pulse-dot" />
            // ENCRYPTED COMMUNICATION CONSOLE
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            TRANSMIT ENCRYPTED PACKET & <br />
            <span className="text-gradient">CONNECT WITH KISHORE</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Terminal Form (7 cols) */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-8 border-accent/40 bg-[#040705]/95 rounded-2xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-accent/25 pb-3 text-xs">
              <span className="flex items-center gap-2 font-bold text-accent">
                <Lock className="w-4 h-4 text-accent" /> ENCRYPTED PACKET SENDER
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> SOC SERVER ONLINE
              </span>
            </div>

            {status === 'success' ? (
              <div className="p-8 rounded-xl bg-accent/10 border border-accent text-center space-y-4 font-mono">
                <div className="w-14 h-14 rounded-full bg-accent/20 border border-accent text-accent flex items-center justify-center mx-auto shadow-[0_0_20px_var(--accent-color)]">
                  <CheckCircle2 className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-white">PACKET TRANSMITTED SUCCESSFULLY!</h3>
                <p className="text-xs text-gray-300 font-sans max-w-md mx-auto">
                  Your message has been encrypted and safely dispatched into Kishore's SOC console. I will respond to your transmission promptly.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-6 py-2.5 rounded-xl border border-accent text-accent font-bold text-xs hover:bg-accent hover:text-[#050505] transition-all"
                >
                  SEND ANOTHER TRANSMISSION
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot anti-spam */}
                <input
                  type="text"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">SENDER NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Mercer"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl glass-input text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">SENDER EMAIL *</label>
                    <input
                      type="email"
                      required
                      placeholder="alex@enterprise.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">TRANSMISSION SUBJECT *</label>
                  <input
                    type="text"
                    required
                    placeholder="Project Inquiry / Cybersecurity Opportunity"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">PAYLOAD MESSAGE *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Enter your message transmission details..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-input text-xs font-mono resize-none"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Encryption Terminal Log Sequence Output */}
                {status === 'encrypting' && (
                  <div className="bg-[#020403] p-4 rounded-xl border border-accent/30 space-y-1.5 text-xs text-accent font-mono">
                    <div className="text-gray-400 font-bold border-b border-accent/20 pb-1 flex justify-between">
                      <span>[TRANSMISSION LOG]</span>
                      <span className="animate-pulse">ENCRYPTING...</span>
                    </div>
                    {logs.map((log, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-emerald-400 text-[10px]">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'encrypting'}
                  className="w-full py-4 rounded-xl border border-accent text-accent font-extrabold text-xs hover:bg-accent hover:text-[#050505] shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <Send className="w-4 h-4" />
                  <span>TRANSMIT ENCRYPTED PACKET</span>
                </button>
              </form>
            )}
          </div>

          {/* Direct Communication Channels Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 border-accent/40 bg-[#040705]/90 rounded-2xl shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-accent font-bold text-xs border-b border-accent/20 pb-3">
                <Terminal className="w-4 h-4" />
                <span>SOC DIRECT CHANNELS</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 space-y-1">
                  <span className="text-gray-400 text-[10px]">EMAIL ADDRESS:</span>
                  <p className="font-bold text-white">contact@soundkish.dev</p>
                </div>

                <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 space-y-1">
                  <span className="text-gray-400 text-[10px]">LOCATION:</span>
                  <p className="font-bold text-accent">India // Global Remote Available</p>
                </div>

                <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 space-y-1">
                  <span className="text-gray-400 text-[10px]">ENCRYPTION KEY:</span>
                  <p className="font-bold text-emerald-400">PGP Key ID: 0x4A82F109</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
