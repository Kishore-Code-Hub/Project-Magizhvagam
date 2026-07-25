'use client';

import React from 'react';
import { GlassCard } from './GlassCard';
import { CyberBadge } from './CyberBadge';
import { GlowButton } from './GlowButton';
import { Modal } from './Modal';
import { Award, ExternalLink, Calendar, CheckCircle, FileText, Maximize2 } from 'lucide-react';

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  organizationLogo?: string | null;
  issueDate: string;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  pdfUrl?: string | null;
  skillsCovered: string;
  description?: string | null;
  featured: boolean;
}

interface CertificateCardProps {
  cert: CertificationItem;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({ cert }) => {
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const parsedSkills = React.useMemo(() => {
    try {
      return JSON.parse(cert.skillsCovered || '[]');
    } catch {
      return [];
    }
  }, [cert.skillsCovered]);

  const certificateImg = cert.pdfUrl || (cert.organizationLogo?.startsWith('/uploads/') ? cert.organizationLogo : null);

  return (
    <>
      <GlassCard variant="interactive" className="group flex flex-col justify-between h-full p-6 sm:p-7 rounded-3xl border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300">
        <div className="space-y-4">
          {/* Recruiter-Friendly Equal Height Banner Container (h-52) */}
          <div
            onClick={() => setIsPreviewOpen(true)}
            className="w-full h-52 sm:h-56 overflow-hidden rounded-2xl bg-black/80 border border-emerald-500/30 relative group-hover:border-emerald-500/70 transition-all duration-300 cursor-pointer shadow-lg"
          >
            {certificateImg ? (
              <img
                src={certificateImg}
                alt={cert.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              /* Cyberpunk Vector Placeholder Banner for Certificates without uploaded image */
              <div className="w-full h-full bg-gradient-to-br from-emerald-950/40 via-black to-cyan-950/30 flex flex-col items-center justify-center p-6 relative">
                <div className="absolute inset-0 bg-[radial-gradient(#00ff66_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_15px_rgba(0,255,102,0.3)] group-hover:scale-110 transition-transform">
                  <Award className="w-8 h-8" />
                </div>
                <h4 className="font-mono text-xs font-bold text-emerald-400 text-center tracking-wider uppercase line-clamp-1">
                  {cert.issuer}
                </h4>
                <p className="font-extrabold text-sm text-white text-center line-clamp-2 mt-1 px-2">
                  {cert.title}
                </p>
                <div className="mt-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                  VERIFIED CERTIFICATION • {cert.issueDate}
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/80 text-emerald-400 border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/60 border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-color)] group-hover:scale-105 transition-transform shrink-0">
                {cert.organizationLogo && !cert.organizationLogo.startsWith('/uploads/') ? (
                  <img src={cert.organizationLogo} alt={cert.issuer} className="w-6 h-6 object-contain" />
                ) : (
                  <Award className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-[var(--accent-color)] transition-colors leading-tight">
                  {cert.title}
                </h3>
                <p className="text-xs font-mono text-gray-400 mt-0.5">{cert.issuer}</p>
              </div>
            </div>
            {cert.featured && (
              <CyberBadge variant="amber" size="sm">
                Featured
              </CyberBadge>
            )}
          </div>

          {cert.description && (
            <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 font-sans">
              {cert.description}
            </p>
          )}

          <div className="space-y-1 text-xs font-mono text-gray-400 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Issue Date:</span>
              <span className="text-gray-200 font-bold">{cert.issueDate}</span>
            </div>
            {cert.credentialId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Credential ID:</span>
                <span className="text-[var(--accent-color)] font-mono text-[11px] truncate max-w-[170px]">
                  {cert.credentialId}
                </span>
              </div>
            )}
          </div>

          {parsedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {parsedSkills.map((skill: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center gap-2 mt-4">
          {cert.credentialUrl && (
            <GlowButton
              variant="secondary"
              size="sm"
              className="w-full text-xs py-2.5"
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => window.open(cert.credentialUrl!, '_blank')}
            >
              Verify Credential
            </GlowButton>
          )}
          {cert.pdfUrl && (
            <GlowButton
              variant="outline"
              size="sm"
              className="p-2.5"
              onClick={() => window.open(cert.pdfUrl!, '_blank')}
              title="Download Certificate PDF"
            >
              <FileText className="w-4 h-4" />
            </GlowButton>
          )}
        </div>
      </GlassCard>

    {certificateImg && (
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`${cert.title} — Verified Credential Preview`}
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden bg-black/80 border border-emerald-500/30 flex items-center justify-center max-h-[75vh]">
            <img
              src={certificateImg}
              alt={cert.title}
              className="max-h-[75vh] w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-gray-300">
            <div>Issuer: <span className="text-emerald-400 font-bold">{cert.issuer}</span></div>
            {cert.credentialUrl && (
              <GlowButton
                variant="primary"
                size="sm"
                onClick={() => window.open(cert.credentialUrl!, '_blank')}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Verify Credential URL
              </GlowButton>
            )}
          </div>
        </div>
      </Modal>
    )}
    </>
  );
};
