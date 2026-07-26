'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SiLeetcode } from 'react-icons/si';

import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';

import {
  Send,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Terminal,
} from 'lucide-react';

import { ProfileData } from '@/types';

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

  const safeResumeUrl =
    profile.resumeUrl || 'https://drive.google.com';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || 'Failed to submit message'
        );
      }

      setSuccess(true);

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Submission error'
      );
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 xl:gap-8 items-stretch">

        {/* ================= LEFT COLUMN ================= */}

        <div className="lg:col-span-5 flex flex-col">

          <GlassCard
            variant="glow"
            className="w-full h-full flex flex-col justify-between p-5 sm:p-6 xl:p-7">

            {/* Top & Middle Content Container */}
            <div className="flex flex-col space-y-5 sm:space-y-6">

              {/* Header */}
              <div>

                <h4
                  className="font-bold uppercase tracking-wide text-white"
                  style={{ fontSize: 'clamp(1.25rem, 1.8vw, 1.5rem)' }}
                >
                  DIRECT CHANNELS
                </h4>

                <div className="mt-3 flex items-center gap-3">

                  <span className="relative flex h-3 w-3 shrink-0">

                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-color)] opacity-75"></span>

                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--accent-color)]"></span>

                  </span>

                  <p
                    className="font-mono leading-relaxed text-[var(--accent-color)]"
                    style={{ fontSize: 'clamp(0.8125rem, 1.1vw, 0.9375rem)' }}
                  >
                    {profile.availability || "Open for Engineering Opportunities"}
                  </p>

                </div>

              </div>

              {/* Contact Cards */}

              <div className="space-y-3.5 sm:space-y-4">

                {/* Email */}

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-4.5">

                  <div className="flex items-center gap-4">

                    <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--accent-color)] shrink-0" />

                    <div className="min-w-0 flex-1">

                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-300 font-mono">
                        Primary Email
                      </div>

                      <a
                        href={`mailto:${profile.socials?.email ??
                          'kishorenarayanankarthikeyan@gmail.com'
                          }`}
                        className="mt-1 block text-xs sm:text-sm text-gray-100 break-all hover:text-[var(--accent-color)] transition-colors"
                        style={{ fontSize: 'clamp(0.8125rem, 1.1vw, 0.9375rem)' }}
                      >
                        {profile.socials?.email?.replace(
                          'mailto:',
                          ''
                        ) ??
                          'kishorenarayanankarthikeyan@gmail.com'}
                      </a>

                    </div>

                  </div>

                </div>

                {/* Location */}

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-4.5">

                  <div className="flex items-center gap-4">

                    <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 shrink-0" />

                    <div className="flex-1">

                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-300 font-mono">
                        Location
                      </div>

                      <p
                        className="mt-1 text-xs sm:text-sm text-gray-100"
                        style={{ fontSize: 'clamp(0.8125rem, 1.1vw, 0.9375rem)' }}
                      >
                        Chennai, Tamil Nadu, India
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* Bottom Section */}

            <div className="mt-6 border-t border-white/10 pt-5 space-y-5">

              <div className="flex flex-wrap gap-2.5 sm:gap-3">

                {profile.socials?.github && (

                  <a
                    href={profile.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-300 transition-all duration-300 hover:border-[var(--accent-color)] hover:bg-white/10 hover:text-[var(--accent-color)]"
                  >

                    <GithubIcon className="h-5 w-5" />

                    <span>GitHub</span>

                  </a>

                )}

                {profile.socials?.linkedin && (

                  <a
                    href={profile.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-300 transition-all duration-300 hover:border-[var(--accent-color)] hover:bg-white/10 hover:text-[var(--accent-color)]"
                  >

                    <LinkedinIcon className="h-5 w-5" />

                    <span>LinkedIn</span>

                  </a>

                )}

                {profile.socials?.leetcode && (

                  <a
                    href={profile.socials.leetcode}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-300 transition-all duration-300 hover:border-[var(--accent-color)] hover:bg-white/10 hover:text-[var(--accent-color)]"
                  >

                    <SiLeetcode className="h-5 w-5" />

                    <span>LeetCode</span>

                  </a>

                )}

              </div>

              {/* Resume */}

              <div>

                <h3 className="mb-2.5 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-gray-400 font-mono">
                  Looking For My Resume
                </h3>

                <GlowButton
                  variant="outline"
                  size="lg"
                  className="h-11 sm:h-12 w-full text-xs sm:text-sm font-semibold"
                  leftIcon={<FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
                  onClick={() =>
                    window.open(safeResumeUrl, "_blank")
                  }
                >
                  Download Official Resume
                </GlowButton>

              </div>

            </div>

          </GlassCard>

        </div>

        {/* ================= RIGHT COLUMN ================= */}

        <div className="lg:col-span-7 flex flex-col">

          <GlassCard
            variant="default"
            className="w-full h-full flex flex-col justify-between p-5 sm:p-6 xl:p-7"
          >

            <h4
              className="mb-4 sm:mb-5 flex items-center gap-2 font-bold uppercase tracking-wider text-white"
              style={{ fontSize: 'clamp(1.25rem, 1.8vw, 1.5rem)' }}
            >

              <Terminal className="h-5 w-5 text-[var(--accent-color)] shrink-0" />

              Send Message

            </h4>
            {success ? (

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 sm:p-10 text-center my-auto"
              >

                <CheckCircle2 className="mb-4 h-12 w-12 sm:h-14 sm:w-14 text-emerald-400 animate-bounce" />

                <h5 className="mb-2 text-xl sm:text-2xl font-bold text-white">
                  Message Sent Successfully
                </h5>

                <p className="mb-6 max-w-md text-xs sm:text-sm font-mono leading-relaxed text-gray-300">
                  Your message has been securely delivered to my inbox.
                  I'll review it shortly and get back to you as soon as possible.
                </p>

                <GlowButton
                  variant="outline"
                  size="md"
                  onClick={() => setSuccess(false)}
                >
                  Send Another Message
                </GlowButton>

              </motion.div>

            ) : (

              <form
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col space-y-4 sm:space-y-4.5 justify-between"
              >

                {/* Name & Email */}

                <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2">

                  <div>

                    <label className="mb-1.5 block text-[11px] sm:text-xs font-mono uppercase tracking-wider text-gray-400">
                      Your Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Anonymous"
                      className="h-11 sm:h-12 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 sm:px-4 font-mono text-xs sm:text-sm text-white placeholder:text-gray-500 transition-all focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:outline-none"
                    />

                  </div>

                  <div>

                    <label className="mb-1.5 block text-[11px] sm:text-xs font-mono uppercase tracking-wider text-gray-400">
                      Your Email *
                    </label>

                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="anonymous@domain.com"
                      className="h-11 sm:h-12 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 sm:px-4 font-mono text-xs sm:text-sm text-white placeholder:text-gray-500 transition-all focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:outline-none"
                    />

                  </div>

                </div>

                {/* Subject */}

                <div>

                  <label className="mb-1.5 block text-[11px] sm:text-xs font-mono uppercase tracking-wider text-gray-400">
                    Subject *
                  </label>

                  <div className="mb-2 flex flex-wrap gap-1.5 sm:gap-2">

                    {subjectPresets.map((preset) => (

                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            subject: preset,
                          }))
                        }
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] sm:text-xs font-mono transition-all ${formData.subject === preset
                          ? "border-[var(--accent-color)] bg-[var(--accent-color)] font-bold text-black"
                          : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:text-white"
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
                    className="h-11 sm:h-12 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 sm:px-4 font-mono text-xs sm:text-sm text-white placeholder:text-gray-500 transition-all focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:outline-none"
                  />

                </div>

                {/* Message */}

                <div className="flex-1 flex flex-col min-h-[140px] sm:min-h-[160px]">

                  <label className="mb-1.5 block text-[11px] sm:text-xs font-mono uppercase tracking-wider text-gray-400">
                    Message *
                  </label>

                  <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell me about your project, internship opportunity, research collaboration, or simply say hello..."
                    className="flex-1 w-full rounded-xl border border-white/10 bg-black/40 p-3.5 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed text-white placeholder:text-gray-500 transition-all duration-300 resize-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:outline-none"
                  />
                </div>

                {/* Error Message */}

                {errorMessage && (

                  <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 sm:p-4">

                    <AlertCircle className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-red-400" />

                    <span className="font-mono text-xs sm:text-sm text-red-300">
                      {errorMessage}
                    </span>

                  </div>

                )}

                {/* Submit Button */}

                <GlowButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="h-11 sm:h-12 w-full text-xs sm:text-sm font-semibold"
                  isLoading={isSubmitting}
                  rightIcon={<Send className="h-4 w-4 sm:h-5 sm:w-5" />}
                >
                  {isSubmitting
                    ? "Sending..."
                    : "Send Message"}
                </GlowButton>

              </form>

            )}

          </GlassCard>

        </div>
      </div>

    </SectionWrapper>
  );
}