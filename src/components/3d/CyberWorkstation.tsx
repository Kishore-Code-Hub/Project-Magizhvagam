'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Terminal, Cpu, Radio, ShieldCheck, Activity, Wifi, Lock } from 'lucide-react';

export default function CyberWorkstation() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Constrain maximum rotation to X +-4 deg, Y +-7 deg as required
    setTilt({
      rx: -y * 8, // Max +-4 deg rotation around X
      ry: x * 14, // Max +-7 deg rotation around Y
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  if (!mounted) {
    return (
      <div className="w-full h-[540px] sm:h-[620px] flex items-center justify-center">
        <div className="w-80 h-80 rounded-3xl bg-accent/5 border border-accent/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-[540px] sm:h-[640px] relative flex items-center justify-center perspective-1000 select-none py-4"
    >
      {/* 3D Scene Container with Constrained Tilt (X +-4 deg, Y +-7 deg) */}
      <div
        className="relative w-full max-w-2xl h-[520px] transition-transform duration-300 ease-out flex items-center justify-center"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Soft Volumetric Background Ambient Bloom */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[520px] h-[520px] rounded-full bg-accent/20 blur-[140px] animate-pulse" />
        </div>

        {/* --- MATTE BLACK DESK SURFACE & RGB DESK MAT --- */}
        <div
          className="absolute -bottom-10 w-[600px] sm:w-[720px] h-40 rounded-3xl bg-[#030604] border border-accent/40 shadow-[0_40px_100px_rgba(0,0,0,0.98)] flex items-end justify-between px-10 pb-4 overflow-hidden"
          style={{ transform: 'translateZ(-45px) rotateX(65deg)' }}
        >
          {/* Green Ambient LED Perimeter Strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-accent shadow-[0_0_30px_var(--accent-color)] animate-pulse" />

          <div className="flex items-center gap-2 text-[9px] font-mono text-accent font-bold">
            <Radio className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span>KISHORE SOC WORKSTATION // AMBIENT GREEN LED ACTIVE</span>
          </div>

          <div className="text-[9px] font-mono text-gray-500 font-bold">
            MATTE BLACK DESK // GLOSSY REFLECTION MATRIX
          </div>
        </div>

        {/* --- PHOTOREALISTIC GAMING LAPTOP --- */}
        <div
          className="absolute z-20 w-[350px] sm:w-[460px] h-[270px] sm:h-[320px] glass-panel border-accent/60 p-4 shadow-2xl flex flex-col justify-between bg-[#040705]/95 rounded-2xl"
          style={{ transform: 'translateZ(65px)' }}
        >
          {/* Laptop Screen Window Bar */}
          <div className="flex items-center justify-between border-b border-accent/25 pb-2 px-1 font-mono text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-accent font-bold tracking-widest uppercase flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-accent" /> root@kishore-soc:~# docker compose up
            </span>
          </div>

          {/* Live Terminal Display Output */}
          <div className="bg-[#020403] rounded-xl p-3 font-mono text-[10px] text-accent space-y-1 overflow-hidden flex-1 my-2 border border-accent/30 shadow-inner">
            <div className="text-gray-400 flex justify-between text-[9px]">
              <span>[SOC ENVIRONMENT TERMINAL LOGS]</span>
              <span className="text-emerald-400 font-bold animate-pulse">● SOC STATUS: ACTIVE</span>
            </div>

            <div className="text-emerald-400 font-bold text-[9px]">&gt; docker compose up -d</div>
            <div className="text-gray-300 text-[9px]">&gt; FastAPI Server Online... READY</div>
            <div className="text-gray-300 text-[9px]">&gt; Prisma Connected to Database... OK</div>
            <div className="text-gray-300 text-[9px]">&gt; Next.js Ready on port 3000... LISTEN</div>
            <div className="text-accent text-[9px]">&gt; Portfolio Active... MOUNTED</div>
            <div className="text-accent text-[9px]">&gt; AI Engine Initialized... ONLINE</div>
            <div className="text-emerald-400 text-[9px]">&gt; TLS Tunnel Established... ENCRYPTED</div>
            <div className="text-accent text-[9px] font-bold animate-pulse">&gt; Monitoring Packets... ACTIVE</div>
          </div>

          {/* RGB Mechanical Keyboard Deck */}
          <div className="h-7.5 rounded-lg bg-[#070d09] border border-accent/50 flex items-center justify-between px-3 text-[9px] font-mono shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]">
            <span className="text-accent font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>RGB MECHANICAL KEYBOARD BREATHING</span>
            </span>
            <span className="text-emerald-400 font-bold">CYBER GREEN LED</span>
          </div>
        </div>

        {/* --- GAMING MOUSE & DESK ACCENT --- */}
        <div
          className="absolute -bottom-6 left-8 sm:left-14 z-40 w-12 h-16 rounded-2xl glass-panel border-accent/50 p-2 flex flex-col items-center justify-center shadow-2xl font-mono text-[9px] bg-[#040705]"
          style={{ transform: 'translateZ(115px)' }}
        >
          <div className="w-3.5 h-5.5 rounded-full border border-accent flex items-center justify-center text-accent mb-0.5">
            <div className="w-1 h-2 bg-accent rounded-full animate-pulse" />
          </div>
          <span className="text-[7px] text-accent font-bold">RGB MOUSE</span>
        </div>
      </div>
    </div>
  );
}
