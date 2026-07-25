'use client';

import React from 'react';
import { GlassCard } from './GlassCard';
import { CyberBadge } from './CyberBadge';
import { GlowButton } from './GlowButton';
import { Award, ExternalLink, Calendar, CheckCircle, FileText } from 'lucide-react';

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
  const parsedSkills = React.useMemo(() => {
    try {
      return JSON.parse(cert.skillsCovered || '[]');
    } catch {
      return [];
    }
  }, [cert.skillsCovered]);

  return (
    <GlassCard variant="interactive" className="group flex flex-col justify-between h-full">
      <div>
        {/* Certificate Preview Image Banner if uploaded */}
        {(cert.pdfUrl || (cert.organizationLogo && cert.organizationLogo.length > 50)) && (
          <div className="w-full h-40 overflow-hidden rounded-xl mb-4 bg-black/60 border border-emerald-500/30 relative group-hover:border-emerald-500/60 transition-colors">
            <img
              src={cert.pdfUrl || cert.organizationLogo || ''}
              alt={cert.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--accent-color)] group-hover:scale-105 transition-transform shrink-0">
              {cert.organizationLogo && !cert.organizationLogo.startsWith('/uploads/') ? (
                <img src={cert.organizationLogo} alt={cert.issuer} className="w-6 h-6 object-contain" />
              ) : (
                <Award className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-[var(--accent-color)] transition-colors">
                {cert.title}
              </h3>
              <p className="text-xs font-mono text-gray-400">{cert.issuer}</p>
            </div>
          </div>
          {cert.featured && (
            <CyberBadge variant="amber" size="sm">
              Featured
            </CyberBadge>
          )}
        </div>

        {cert.description && (
          <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">
            {cert.description}
          </p>
        )}

        <div className="space-y-1.5 text-xs font-mono text-gray-400 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Issue Date:</span>
            <span className="text-gray-300">{cert.issueDate}</span>
          </div>
          {cert.credentialId && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Credential ID:</span>
              <span className="text-[var(--accent-color)] font-mono text-[11px] truncate max-w-[150px]">
                {cert.credentialId}
              </span>
            </div>
          )}
        </div>

        {parsedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
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

      <div className="pt-3 border-t border-white/5 flex items-center gap-2">
        {cert.credentialUrl && (
          <GlowButton
            variant="secondary"
            size="sm"
            className="w-full text-xs"
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
            className="p-2"
            onClick={() => window.open(cert.pdfUrl!, '_blank')}
            title="Download Certificate PDF"
          >
            <FileText className="w-3.5 h-3.5" />
          </GlowButton>
        )}
      </div>
    </GlassCard>
  );
};
