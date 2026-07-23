'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';

interface WorkstationProps {
  heroImage?: string;
  mediaMode?: 'image' | 'video' | '3d' | 'lottie';
  fitMode?: 'contain' | 'cover' | 'fill';
  brightness?: number;
  contrast?: number;
  glowIntensity?: number;
}

export default function CyberWorkstation({
  heroImage = '/Hero-section-banner.jfif',
  mediaMode = 'image',
  fitMode = 'cover',
  brightness = 100,
  contrast = 100,
  glowIntensity = 100,
}: WorkstationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Subtle 3D mouse parallax constrained to +-3 deg max
    setTilt({
      rx: -y * 6,
      ry: x * 6,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
  };

  const objectFitClass = fitMode === 'contain' ? 'object-contain' : fitMode === 'fill' ? 'object-fill' : 'object-cover';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full max-w-[92vw] sm:max-w-xl lg:max-w-2xl flex items-center justify-center perspective-1000 select-none py-2 transition-all duration-700 ease-out animate-in fade-in zoom-in-95 duration-1000 mx-auto"
    >
      {/* 3D Premium Display Frame with subtle float and hover scale */}
      <div
        className={`relative w-full rounded-[28px] glass-panel border border-accent/40 bg-[#040705] p-2.5 sm:p-3.5 transition-all duration-300 ease-out animate-[float_6s_ease-in-out_infinite] will-change-transform ${
          isHovered
            ? 'shadow-[0_0_80px_rgba(0,255,102,0.35)] -translate-y-1 scale-[1.01]'
            : 'shadow-[0_0_60px_rgba(0,255,102,0.25)]'
        }`}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(0px)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Soft Volumetric Rim Glow Layer Behind */}
        <div
          className={`absolute -inset-4 bg-accent/20 rounded-[36px] blur-3xl pointer-events-none -z-10 transition-opacity duration-300 ${
            isHovered ? 'opacity-90 animate-pulse' : 'opacity-70'
          }`}
          style={{ opacity: (glowIntensity / 100) * (isHovered ? 0.95 : 0.75) }}
        />

        {/* Photorealistic Workstation Artwork Frame */}
        <div className="relative w-full h-[340px] sm:h-[440px] lg:h-[480px] rounded-[22px] overflow-hidden bg-[#020403] border border-accent/30 shadow-2xl">
          {heroImage ? (
            <Image
              src={heroImage}
              alt="Kishore Cybersecurity SOC Workstation Artwork"
              fill
              priority
              loading="eager"
              quality={95}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 720px"
              className={`${objectFitClass} object-center transition-transform duration-700 ease-out ${
                isHovered ? 'scale-[1.02]' : 'scale-100'
              }`}
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 font-mono text-xs gap-2">
              <span className="text-accent font-bold">No Hero Image Uploaded</span>
              <span>Upload artwork in Admin CMS Media Library</span>
            </div>
          )}

          {/* Panning Glass Reflection Sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-40 animate-[pulse_8s_infinite]" />

          {/* Soft Ambient Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#040705]/80 via-transparent to-[#040705]/30 pointer-events-none" />

          {/* Green Rim Lighting Glow Edge */}
          <div className="absolute inset-0 rounded-[22px] border border-accent/40 pointer-events-none shadow-[inset_0_0_30px_rgba(0,255,102,0.25)]" />
        </div>
      </div>
    </div>
  );
}

