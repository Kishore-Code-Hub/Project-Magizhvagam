'use client';

import React from 'react';
import MatrixEngine from '@/components/background/MatrixEngine';

export default function AtmosphereLayers() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Full-Page Matrix Backdrop Engine */}
      <MatrixEngine />
    </div>
  );
}




