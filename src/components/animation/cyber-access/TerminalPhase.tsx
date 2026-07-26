'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Terminal, KeyRound, Cpu, Wifi, Monitor, Activity, Lock, Globe } from 'lucide-react';

export interface VisitorTelemetry {
  ip?: string;
  userAgent?: string;
  host?: string;
}

interface TerminalPhaseProps {
  onAuthorize: () => void;
  isAuthorizing: boolean;
  progress?: number;
  stageText?: string;
  telemetry?: VisitorTelemetry;
}

function parseOS(ua: string): string {
  if (!ua) return 'Windows 11 Workstation';
  if (ua.includes('Win')) return 'Windows 11 / 10 x64';
  if (ua.includes('Mac')) return 'macOS Darwin Kernel';
  if (ua.includes('Android')) return 'Android Linux Subsystem';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'Apple iOS Kernel';
  if (ua.includes('Linux')) return 'GNU/Linux x86_64';
  return 'CYBER-OS ARCH';
}

function parseBrowser(ua: string): string {
  if (!ua) return 'Chromium V8 Engine';
  if (ua.includes('Edg/')) return 'MS Edge / Blink';
  if (ua.includes('Chrome/')) return 'Google Chrome / V8';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Apple Safari / WebKit';
  if (ua.includes('Firefox/')) return 'Mozilla Firefox / Gecko';
  return 'Custom Web Engine';
}

function detectGPU(): string {
  if (typeof window === 'undefined') return 'Accelerated Graphics Unit';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (renderer) {
          // Clean up string like "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)"
          if (renderer.includes('NVIDIA')) return 'NVIDIA GeForce GPU';
          if (renderer.includes('AMD') || renderer.includes('Radeon')) return 'AMD Radeon GPU';
          if (renderer.includes('Apple')) return 'Apple M-Series GPU';
          if (renderer.includes('Intel')) return 'Intel Iris / UHD Graphics';
          return renderer.split('(')[0].trim() || 'Hardware Accelerated GPU';
        }
      }
    }
  } catch {}
  return 'Hardware Accelerated GPU';
}

export default function TerminalPhase({
  onAuthorize,
  isAuthorizing,
  progress = 0,
  stageText = 'INITIALIZING_SYSTEM_KERNEL',
  telemetry,
}: TerminalPhaseProps) {
  const [ipText, setIpText] = useState(telemetry?.ip || '192.168.56.103');
  const [relayText, setRelayText] = useState('TRACING TARGET ENDPOINT...');
  const [buttonStage, setButtonStage] = useState<'idle' | 'granting' | 'granted'>('idle');

  // Diagnostic state metrics
  const [osName, setOsName] = useState('Windows 11 Workstation');
  const [browserEngine, setBrowserEngine] = useState('Chromium V8');
  const [cpuThreads, setCpuThreads] = useState('16 Threads');
  const [ramEst, setRamEst] = useState('16 GB RAM');
  const [gpuName, setGpuName] = useState('NVIDIA RTX Series');
  const [connType, setConnType] = useState('BROADBAND 5G/FIBER');
  const [tzName, setTzName] = useState('Asia/Kolkata');
  const [latencyMs, setLatencyMs] = useState(28);

  useEffect(() => {
    const ua = telemetry?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    setOsName(parseOS(ua));
    setBrowserEngine(parseBrowser(ua));

    if (typeof navigator !== 'undefined') {
      if (navigator.hardwareConcurrency) {
        setCpuThreads(`${navigator.hardwareConcurrency} Cores / Threads`);
      }
      if ((navigator as any).deviceMemory) {
        setRamEst(`~${(navigator as any).deviceMemory} GB System RAM`);
      }
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection?.effectiveType) {
        setConnType(`${connection.effectiveType.toUpperCase()} HIGH-SPEED NETWORK`);
      }
    }

    setGpuName(detectGPU());

    try {
      setTzName(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    } catch {}

    // Rapid IP scramble morphing algorithm over 0.8s
    const targetIp = telemetry?.ip || '192.168.56.103';
    const scrambleFrames = [
      '192.168.██.██',
      '10.0.4.12',
      '172.16.32.78',
      '192.168.56.██',
      targetIp,
    ];

    const relayFrames = [
      'TRACING TARGET ENDPOINT...',
      'INTERCEPTING SECURE ROUTE...',
      'HANDSHAKE VERIFIED // ENCRYPTED',
      `TARGET: ${targetIp} (SECURE)`,
    ];

    let frameIdx = 0;
    const interval = setInterval(() => {
      if (frameIdx < scrambleFrames.length) {
        setIpText(scrambleFrames[frameIdx]);
        setRelayText(relayFrames[Math.min(frameIdx, relayFrames.length - 1)]);
        frameIdx++;
      } else {
        clearInterval(interval);
      }
    }, 140);

    // Dynamic latency calculation simulation
    const startTime = performance.now();
    const timer = setTimeout(() => {
      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(Math.min(Math.max(elapsed, 16), 45));
    }, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [telemetry]);

  const handleGrantClick = () => {
    if (buttonStage !== 'idle' || isAuthorizing) return;
    setButtonStage('granting');

    setTimeout(() => {
      setButtonStage('granted');
      setTimeout(() => {
        onAuthorize();
      }, 200);
    }, 600);
  };

  return (
    <div className="relative w-[95vw] sm:w-[min(920px,85vw)] max-w-[1020px] h-[520px] sm:h-[540px] p-5 sm:p-7 rounded-2xl bg-[#030504]/95 border border-[#00ff66]/40 shadow-[0_0_80px_rgba(0,255,102,0.25)] backdrop-blur-xl text-left font-mono select-none flex flex-col justify-between overflow-hidden">
      {/* Scanline overlay pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 rounded-2xl overflow-hidden z-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.3) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.05), rgba(0, 255, 0, 0.03), rgba(0, 0, 255, 0.05))',
          backgroundSize: '100% 4px, 6px 100%',
        }}
      />

      {/* Security Level Header Bar */}
      <div className="flex items-center justify-between border-b border-[#00ff66]/30 pb-3 text-xs text-[#00ff66] uppercase tracking-widest z-20">
        <span className="flex items-center gap-2.5 font-bold">
          <Shield className="w-4 h-4 text-[#00ff66] animate-pulse" />
          <span>SOC COMMAND CENTER // TELEMETRY HUD</span>
        </span>
        <div className="flex items-center gap-2.5 text-[11px]">
          <span className="hidden sm:inline text-gray-400 font-mono">LATENCY: <span className="text-[#00f0ff] font-bold">{latencyMs} ms</span></span>
          <span className="px-2 py-0.5 rounded bg-[#00ff66]/20 border border-[#00ff66]/40 text-[#00ff66] font-bold">
            CLASSIFIED
          </span>
        </div>
      </div>

      {/* Real-time SOC Telemetry Dashboard Grid */}
      <div className="z-20 my-auto space-y-3 font-mono text-xs overflow-y-auto max-h-[360px] scrollbar-none pr-1">
        <div className="text-[#00ff66] font-bold tracking-wide flex items-center justify-between border-b border-[#00ff66]/20 pb-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Terminal className="w-4 h-4 text-[#00f0ff]" />
            <span>AUTHENTICATION NODE INITIALIZED</span>
          </div>
          <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
            {stageText}
          </span>
        </div>

        {/* Dynamic Telemetry Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-black/60 border border-[#00ff66]/20 space-y-0.5">
            <div className="text-gray-400 text-[10px] uppercase flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#00f0ff]" /> TARGET NODE
            </div>
            <div className="text-[#00ff66] font-bold truncate text-xs sm:text-sm">{ipText}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/60 border border-[#00ff66]/20 space-y-0.5">
            <div className="text-gray-400 text-[10px] uppercase flex items-center gap-1">
              <Monitor className="w-3 h-3 text-[#00f0ff]" /> PLATFORM OS
            </div>
            <div className="text-gray-200 font-bold truncate text-xs">{osName}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/60 border border-[#00ff66]/20 space-y-0.5">
            <div className="text-gray-400 text-[10px] uppercase flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#00f0ff]" /> CPU & RAM
            </div>
            <div className="text-gray-200 font-bold truncate text-xs">{cpuThreads}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/60 border border-[#00ff66]/20 space-y-0.5">
            <div className="text-gray-400 text-[10px] uppercase flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#00f0ff]" /> GPU HARDWARE
            </div>
            <div className="text-emerald-400 font-bold truncate text-xs">{gpuName}</div>
          </div>
        </div>

        {/* Secondary System Diagnostics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-300">
          <div className="flex items-center gap-1.5 p-2 rounded bg-black/40 border border-[#00ff66]/15">
            <Wifi className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">{connType}</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded bg-black/40 border border-[#00ff66]/15">
            <Globe className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">TZ: {tzName}</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded bg-black/40 border border-[#00ff66]/15">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>SESSION: <strong className="text-emerald-400">VERIFIED</strong></span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded bg-black/40 border border-[#00ff66]/15">
            <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>THREAT: <strong className="text-emerald-400">LOW [SECURE]</strong></span>
          </div>
        </div>

        {/* Real Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-ping inline-block" />
              SYSTEM MEMORY & DECODER BUFFER STATUS
            </span>
            <span className="text-[#00ff66] font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-black/80 border border-[#00ff66]/30 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#00ff66] to-[#00f0ff] transition-all duration-300 ease-out shadow-[0_0_15px_#00ff66]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="pt-0.5 flex items-center gap-2 text-xs text-amber-300 font-semibold animate-pulse">
          <KeyRound className="w-3.5 h-3.5" />
          <span>{progress >= 100 ? 'ASSETS 100% DECODED. READY FOR OPERATOR AUTHORIZATION.' : 'PRELOADING & DECODING CORE CYBER BUFFERS...'}</span>
        </div>
      </div>

      {/* Glowing Authorize Button & Keyboard Hints */}
      <div className="pt-3 border-t border-[#00ff66]/20 flex flex-col sm:flex-row items-center justify-between gap-3 z-20">
        <div className="text-[11px] text-gray-500 font-mono hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 rounded bg-black border border-gray-700 text-gray-300 text-[10px]">SPACE</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-black border border-gray-700 text-gray-300 text-[10px]">ENTER</kbd> to authorize
        </div>

        <button
          onClick={handleGrantClick}
          disabled={buttonStage !== 'idle' || isAuthorizing}
          className={`relative group px-8 py-3 rounded-lg text-xs sm:text-sm font-mono font-extrabold tracking-widest uppercase transition-all duration-300 w-full sm:w-auto ${
            buttonStage === 'granted'
              ? 'bg-[#00ff66] text-black border border-[#00ff66] shadow-[0_0_50px_#00ff66] scale-105'
              : buttonStage === 'granting'
              ? 'bg-[#00ff66]/40 text-[#00ff66] border border-[#00ff66] shadow-[0_0_35px_rgba(0,255,102,0.8)] opacity-90'
              : 'bg-[#00ff66]/15 hover:bg-[#00ff66]/30 text-[#00ff66] border border-[#00ff66]/80 hover:border-[#00ff66] shadow-[0_0_25px_rgba(0,255,102,0.25)] hover:shadow-[0_0_45px_rgba(0,255,102,0.6)] active:scale-95 cursor-pointer'
          }`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>
              {buttonStage === 'granted'
                ? '[ ACCESS GRANTED ]'
                : buttonStage === 'granting'
                ? '[ GRANTING ACCESS... ]'
                : '[ GRANT ACCESS ]'}
            </span>
            <span className="w-2 h-4 bg-current animate-pulse inline-block" />
          </span>
          <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00ff66]/0 via-[#00ff66]/30 to-[#00ff66]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </div>
  );
}

