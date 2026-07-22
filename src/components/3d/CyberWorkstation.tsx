'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Shield, Radio, Terminal, Cpu, CheckCircle2, Activity, Wifi } from 'lucide-react';

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

    setTilt({
      rx: -y * 10,
      ry: x * 12,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  if (!mounted) {
    return (
      <div className="w-full h-[520px] flex items-center justify-center">
        <div className="w-72 h-72 rounded-3xl bg-accent/5 border border-accent/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-[520px] sm:h-[600px] relative flex items-center justify-center perspective-1000 select-none py-4"
    >
      {/* 3D Scene Interactive Container */}
      <div
        className="relative w-full max-w-2xl h-[500px] transition-transform duration-300 ease-out flex items-center justify-center"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Soft Volumetric Background Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full bg-accent/15 blur-[130px] animate-pulse" />
        </div>

        {/* --- DESK MAT & WORKSTATION SURFACE --- */}
        <div
          className="absolute -bottom-10 w-[580px] sm:w-[680px] h-36 rounded-3xl bg-[#030604] border border-accent/30 shadow-[0_35px_80px_rgba(0,0,0,0.95)] flex items-end justify-between px-8 pb-3 overflow-hidden"
          style={{ transform: 'translateZ(-40px) rotateX(65deg)' }}
        >
          {/* Cyber Perimeter RGB Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-accent shadow-[0_0_25px_var(--accent-color)] animate-pulse" />

          <div className="flex items-center gap-2 text-[9px] font-mono text-accent">
            <Radio className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span>KISHORE WORKSTATION DESK // LED ACTIVE</span>
          </div>

          <div className="text-[9px] font-mono text-gray-500">
            RGB DESK MAT // REALISTIC CGI RENDER MATRIX
          </div>
        </div>

        {/* --- REALISTIC GAMING LAPTOP --- */}
        <div
          className="absolute z-20 w-[340px] sm:w-[440px] h-[260px] sm:h-[300px] glass-panel border-accent/60 p-4 shadow-2xl flex flex-col justify-between bg-[#040705]/95 rounded-2xl"
          style={{ transform: 'translateZ(60px)' }}
        >
          {/* Laptop Screen Window Bar */}
          <div className="flex items-center justify-between border-b border-accent/25 pb-2 px-1 font-mono text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-accent font-bold tracking-widest uppercase flex items-center gap-1">
              <Terminal className="w-3 h-3 text-accent" /> root@kishore-soc:~# docker compose up
            </span>
          </div>

          {/* Screen Output Terminal Canvas Display */}
          <div className="bg-[#020403] rounded-xl p-3 font-mono text-[10px] text-accent space-y-1.5 overflow-hidden flex-1 my-2 border border-accent/30 shadow-inner">
            <div className="text-gray-400 flex justify-between text-[9px]">
              <span>[SOC ENVIRONMENT LOGS v3.6]</span>
              <span className="text-emerald-400 font-bold animate-pulse">● PORTFOLIO ACTIVE</span>
            </div>

            <div className="text-emerald-400 font-bold text-[9px]">&gt; docker compose up -d</div>
            <div className="text-gray-300 text-[9px]">&gt; Starting postgresql_database... DONE</div>
            <div className="text-gray-300 text-[9px]">&gt; Connecting Prisma Client ORM... READY</div>
            <div className="text-accent text-[9px]">&gt; FastAPI Cyber AI Subsystem... RUNNING</div>
            <div className="text-accent text-[9px]">&gt; Next.js 16 SOC Workstation... LISTENING ON 0.0.0.0:3000</div>

            <div className="text-emerald-400 text-[9px] flex items-center gap-1.5 pt-1 border-t border-accent/15">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span>System Integrity Check: 100% OK. Security Rules Enforced.</span>
            </div>
          </div>

          {/* Mechanical Keyboard Deck with Breathing RGB LED */}
          <div className="h-7 rounded-lg bg-[#070d09] border border-accent/40 flex items-center justify-between px-3 text-[9px] font-mono shadow-[0_0_15px_rgba(var(--accent-rgb),0.25)]">
            <span className="text-accent font-bold flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-accent animate-pulse" />
              <span>MECHANICAL KEYBOARD BREATHING</span>
            </span>
            <span className="text-emerald-400 font-bold">CYBER GREEN RGB</span>
          </div>
        </div>

        {/* --- HUD MONITOR CARD 1: SYSTEM INTEGRITY --- */}
        <div
          className="absolute -top-6 -right-2 sm:right-0 z-30 w-[210px] sm:w-[250px] glass-panel border-accent/50 p-3 shadow-2xl space-y-2 bg-[#040705]/90 rounded-xl"
          style={{ transform: 'translateZ(100px) rotateY(-10deg)' }}
        >
          <div className="flex items-center justify-between border-b border-accent/20 pb-1 text-[10px] font-mono">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-accent" /> SYSTEM INTEGRITY
            </span>
            <span className="text-accent font-bold">100%</span>
          </div>

          <div className="space-y-1.5 text-[9px] font-mono text-gray-300">
            <div className="flex justify-between items-center">
              <span>Firewall Subsystem</span>
              <span className="text-accent font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-accent" /> ACTIVE
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Intrusion Defense</span>
              <span className="text-accent font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-accent" /> ACTIVE
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>FastAPI AI Engine</span>
              <span className="text-accent font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-accent" /> ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* --- HUD MONITOR CARD 2: NETWORK STATUS --- */}
        <div
          className="absolute top-10 -left-6 sm:left-0 z-30 w-[180px] sm:w-[210px] glass-panel border-accent/50 p-3 shadow-2xl space-y-2 bg-[#040705]/90 rounded-xl"
          style={{ transform: 'translateZ(95px) rotateY(12deg)' }}
        >
          <div className="flex items-center justify-between border-b border-accent/20 pb-1 text-[10px] font-mono">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-accent" /> NETWORK HUD
            </span>
            <span className="text-emerald-400 font-bold">ENCRYPTED</span>
          </div>

          <div className="space-y-1 text-[9px] font-mono text-gray-400">
            <div className="flex justify-between">
              <span>Protocol:</span>
              <span className="text-accent font-bold">TLS 1.3</span>
            </div>
            <div className="flex justify-between">
              <span>Cipher:</span>
              <span className="text-accent font-bold">AES-256-GCM</span>
            </div>
            <div className="flex justify-between">
              <span>Bandwidth:</span>
              <span className="text-emerald-400 font-bold">1.2 Gbps</span>
            </div>
          </div>
        </div>

        {/* --- MOUSE & MAT REFLECTION --- */}
        <div
          className="absolute -bottom-6 left-10 sm:left-16 z-40 w-11 h-14 rounded-2xl glass-panel border-accent/50 p-2 flex flex-col items-center justify-center shadow-2xl font-mono text-[9px] bg-[#040705]"
          style={{ transform: 'translateZ(110px)' }}
        >
          <div className="w-3.5 h-5 rounded-full border border-accent flex items-center justify-center text-accent mb-0.5">
            <div className="w-1 h-1.5 bg-accent rounded-full animate-pulse" />
          </div>
          <span className="text-[7px] text-accent font-bold">RGB MOUSE</span>
        </div>
      </div>
    </div>
  );
}
