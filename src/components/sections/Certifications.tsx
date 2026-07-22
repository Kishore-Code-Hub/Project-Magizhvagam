'use client';

import React from 'react';
import { CertificationData } from '@/types';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface CertificationsProps {
  certifications: CertificationData[];
}

export default function Certifications({ certifications }: CertificationsProps) {
  return (
    <section id="certifications" className="py-24 px-4 md:px-8 relative z-10 circuit-grid">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-purple-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            VERIFIED CREDENTIALS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            Certifications & <span className="text-gradient">Badges</span>
          </h2>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="glass-panel p-6 flex flex-col justify-between space-y-5 group hover:-translate-y-1 transition-all"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:border-purple-400 transition-all">
                  <ShieldCheck className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold group-hover:text-purple-300 transition-colors">
                    {cert.title}
                  </h3>
                  <p className="text-xs text-purple-400 font-semibold">{cert.issuer}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-purple-500/20 text-xs">
                <span className="text-gray-400">{cert.issueDate}</span>

                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    <span>Verify</span>
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
