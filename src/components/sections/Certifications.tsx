'use client';

import React from 'react';
import { CertificationData } from '@/types';
import { Award, ShieldCheck, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { CyberAudio } from '@/lib/CyberAudio';
import { useTheme } from '@/components/theme/ThemeProvider';

interface CertificationsProps {
  certifications: CertificationData[];
}

export default function Certifications({ certifications }: CertificationsProps) {
  const { audioMuted } = useTheme();

  return (
    <section id="certifications" className="py-24 px-4 md:px-8 relative z-10 circuit-grid font-mono">
      <div className="max-w-7xl mx-auto space-y-10 pl-0 lg:pl-16">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
            <span className="pulse-dot" />
            // DIGITAL CREDENTIAL VAULT
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            VERIFIED CREDENTIALS & <br />
            <span className="text-gradient">SECURITY CERTIFICATIONS</span>
          </h2>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="glass-panel p-6 border-accent/40 bg-[#040705]/95 rounded-2xl hover:border-accent hover:-translate-y-1 transition-all space-y-5 shadow-2xl relative overflow-hidden group"
            >
              {/* Holographic Verification Badge Header */}
              <div className="flex items-center justify-between border-b border-accent/25 pb-3">
                <div className="flex items-center gap-2 text-accent font-bold text-xs">
                  <Award className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                  <span>ENCRYPTED CREDENTIAL</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED
                </span>
              </div>

              {/* Title & Issuer */}
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-white group-hover:text-accent transition-colors leading-snug">
                  {cert.title}
                </h3>
                <p className="text-xs text-gray-300 font-sans">
                  Issued by: <span className="font-mono text-accent font-bold">{cert.issuer}</span>
                </p>
              </div>

              {/* Issue Date & Seal */}
              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-accent/15 pt-3">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  <span>{cert.issueDate}</span>
                </div>

                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => CyberAudio.playKeyClick(audioMuted)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                  >
                    <span>VERIFY &gt;</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
