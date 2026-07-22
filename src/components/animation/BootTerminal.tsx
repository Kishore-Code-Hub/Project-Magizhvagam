'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle2, Shield, FastForward } from 'lucide-react';

const BOOT_STEPS = [
  { text: '> Initializing Secure Environment...', delay: 250 },
  { text: '> Verifying Encryption Keys [RSA-4096]...', delay: 300 },
  { text: '> Loading Threat Intelligence & Firewall Modules...', delay: 350 },
  { text: '> Access Granted: Identity Verified.', delay: 300 },
  { text: '> Welcome, Kishore. Command Center Online.', delay: 200 },
];

export default function BootTerminal({ onComplete }: { onComplete: () => void }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Check if already booted in this session
    const hasBooted = sessionStorage.getItem('portfolio_booted');
    if (hasBooted === 'true') {
      onComplete();
      return;
    }

    if (currentStepIndex < BOOT_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, BOOT_STEPS[currentStepIndex].delay);
      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(() => {
        sessionStorage.setItem('portfolio_booted', 'true');
        setCompleted(true);
        setTimeout(onComplete, 400);
      }, 500);
      return () => clearTimeout(finishTimer);
    }
  }, [currentStepIndex, onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem('portfolio_booted', 'true');
    setCompleted(true);
    onComplete();
  };

  if (completed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] text-white flex items-center justify-center p-4 transition-opacity duration-500">
      <div className="max-w-md w-full glass-panel p-6 border-accent/40 shadow-2xl relative space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-accent/20 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono tracking-widest text-accent uppercase font-semibold">
              KISHORE // SOC OS v3.6
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
          >
            <span>SKIP</span>
            <FastForward className="w-3 h-3 text-accent" />
          </button>
        </div>

        {/* Terminal Logs */}
        <div className="font-mono text-xs space-y-2 min-h-[140px] pt-1">
          {BOOT_STEPS.slice(0, currentStepIndex).map((step, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 ${
                idx === BOOT_STEPS.length - 1 ? 'text-accent font-semibold' : 'text-gray-300'
              }`}
            >
              <span>{step.text}</span>
              {idx < currentStepIndex - 1 && (
                <CheckCircle2 className="w-3.5 h-3.5 text-accent/80 ml-auto flex-shrink-0" />
              )}
            </div>
          ))}

          {currentStepIndex < BOOT_STEPS.length && (
            <div className="flex items-center gap-1.5 text-accent animate-pulse">
              <Terminal className="w-3.5 h-3.5" />
              <span className="w-2 h-4 bg-accent inline-block" />
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(currentStepIndex / BOOT_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
