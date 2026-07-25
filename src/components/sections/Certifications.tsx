'use client';

import React from 'react';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { CertificateCard, CertificationItem } from '@/components/ui/CertificateCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface CertificationsProps {
  certifications: CertificationItem[];
}

export default function Certifications({ certifications = [] }: CertificationsProps) {
  return (
    <SectionWrapper id="certifications">
      <SectionTitle
        title="CERTIFICATIONS"
        subtitle="Professional Certifications & Verified Engineering Accomplishments"
        badgeText="CREDENTIALS"
      />

      {certifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert) => (
            <CertificateCard key={cert.id} cert={cert} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Certifications Listed"
          description="Verified credentials will be displayed here as they are acquired."
        />
      )}
    </SectionWrapper>
  );
}
