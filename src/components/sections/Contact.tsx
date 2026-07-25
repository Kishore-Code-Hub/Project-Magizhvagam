'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { CyberBadge } from '@/components/ui/CyberBadge';
import { ProfileData } from '@/types';
import {
  Send,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Terminal,
  Code2,
  ShieldAlert,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';

interface ContactProps {
  profile: ProfileData;
}

export default function Contact({ profile }: ContactProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const safeResumeUrl = profile.resumeUrl || 'https://drive.google.com';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit message');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectPresets = [
    'Internship Opportunity',
    'Software Engineer Position',
    'Research Collaboration',
    'Freelance Project',
    'General Inquiry',
  ];

  return (
    <SectionWrapper id="contact">
      <SectionTitle
        title="GET IN TOUCH"
        subtitle="I'm actively looking for Software Engineering, Cybersecurity and AI Internship opportunities. If you're hiring interns, collaborating on research or building innovative products, I'd love to connect."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Links & Status HUD */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard variant="glow">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-3 h-3 rounded-full bg-[var(--accent-color)] animate-ping" />
              <div>
                <h4 className="text-lg font-bold text-white uppercase">Direct Channels</h4>
                <p className="text-xs font-mono text-[var(--accent-color)]">
                  {profile.availability || 'Open for Engineering Opportunities'}
                </p>
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs sm:text-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                <Mail className="w-5 h-5 text-[var(--accent-color)] shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-gray-500 uppercase">Primary Email</div>
                  <a href={`mailto:${profile.socials?.email || 'kishorenarayanankarthikeyan@gmail.com'}`} className="hover:text-[var(--accent-color)] text-gray-200 truncate block">
                    {profile.socials?.email?.replace('mailto:', '') || 'kishorenarayanankarthikeyan@gmail.com'}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Location</div>
                  <span className="text-gray-200">Chennai</span>
                </div>
              </div>
            </div>

            {/* Social & Coding Profiles */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h5 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">
                Looking For my Resume
              </h5>
              <div className="flex flex-wrap gap-2">
                {profile.socials?.github && (
                  <a
                    href={profile.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[var(--accent-color)] border border-white/10 transition-colors"
                  >
                    <GithubIcon className="w-4 h-4" /> GitHub
                  </a>
                )}
                {profile.socials?.linkedin && (
                  <a
                    href={profile.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[var(--accent-color)] border border-white/10 transition-colors"
                  >
                    <LinkedinIcon className="w-4 h-4" /> LinkedIn
                  </a>
                )}
                {profile.socials?.leetcode && (
                  <a
                    href={profile.socials.leetcode}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[var(--accent-color)] border border-white/10 transition-colors"
                  >
                    <Code2 className="w-4 h-4" /> LeetCode
                  </a>
                )}
                {profile.socials?.tryhackme && (
                  <a
                    href={profile.socials.tryhackme}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[var(--accent-color)] border border-white/10 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4" /> TryHackMe
                  </a>
                )}
              </div>
            </div>

            {/* Resume Button */}
            <div className="mt-6">
              <GlowButton
                variant="outline"
                size="md"
                className="w-full"
                leftIcon={<FileText className="w-4 h-4" />}
                onClick={() => window.open(safeResumeUrl, '_blank')}
              >
                Download Official Resume
              </GlowButton>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Contact Message Form */}
        <div className="lg:col-span-7">
          <GlassCard variant="default">
            <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[var(--accent-color)]" />
              Send Message
            </h4>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center rounded-xl bg-emerald-500/10 border border-emerald-500/30"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
                <h5 className="text-xl font-bold text-white mb-2">Message Sent</h5>
                <p className="text-xs font-mono text-gray-300 mb-4">
                  Your message has been logged in the inbox. I will review and respond promptly.
                </p>
                <GlowButton variant="outline" size="sm" onClick={() => setSuccess(false)}>
                  Send Another Message
                </GlowButton>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">YOUR NAME *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Anonymous"
                      className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">YOUR EMAIL *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="anonymous@domain.com"
                      className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1">SUBJECT *</label>
                  {/* Preset Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {subjectPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, subject: preset }))}
                        className={`px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-all cursor-pointer ${formData.subject === preset
                          ? 'bg-[var(--accent-color)] text-black border-[var(--accent-color)] font-bold'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                          }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Select preset above or type subject..."
                    className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1">MESSAGE *</label>
                  <textarea
                    name="message"
                    rows={5}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Provide Your Message Here ..."
                    className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-color)] transition-colors resize-none"
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <GlowButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full"
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Send Message
                </GlowButton>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </SectionWrapper>
  );
}
