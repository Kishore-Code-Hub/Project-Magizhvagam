'use client';

import React from 'react';

interface SectionWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  id,
  children,
  className = '',
  fullWidth = false,
}) => {
  return (
    <section
      id={id}
      className={`relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden scroll-mt-20 ${className}`}
    >
      {/* Background Circuit Grid overlay */}
      <div className="absolute inset-0 circuit-grid opacity-30 pointer-events-none" />

      {fullWidth ? (
        children
      ) : (
        <div className="relative z-10 max-w-7xl mx-auto">{children}</div>
      )}
    </section>
  );
};
