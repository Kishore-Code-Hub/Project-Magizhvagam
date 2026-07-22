'use client';

import React, { useState } from 'react';
import { SkillData } from '@/types';
import {
  Cpu,
  Shield,
  Server,
  BrainCircuit,
  Database,
  Network,
  X,
  Code2,
  CheckCircle2,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { CyberAudio } from '@/lib/CyberAudio';
import { useTheme } from '@/components/theme/ThemeProvider';

interface SkillsProps {
  skills: SkillData[];
}

export default function Skills({ skills }: SkillsProps) {
  const { audioMuted } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSkill, setSelectedSkill] = useState<SkillData | null>(null);

  const categories = ['ALL', 'Languages', 'Security Tools', 'Infra/DevOps', 'AI/ML'];

  const filteredSkills =
    selectedCategory === 'ALL'
      ? skills
      : skills.filter((s) => s.category?.toLowerCase() === selectedCategory.toLowerCase());

  // Category specific hardware identity styling & icons
  const getHardwareIdentity = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('security')) {
      return {
        type: 'SHIELD DEFENSE PCB',
        icon: Shield,
        badge: 'CYBER DEFENSE',
        bg: 'border-emerald-500/40 bg-emerald-950/20',
      };
    } else if (cat.includes('infra') || cat.includes('devops') || cat.includes('cloud')) {
      return {
        type: 'RACK SERVER BLADE',
        icon: Server,
        badge: 'INFRA STRUCTURE',
        bg: 'border-accent/40 bg-accent/5',
      };
    } else if (cat.includes('ai') || cat.includes('ml')) {
      return {
        type: 'NEURAL ACCELERATOR NPU',
        icon: BrainCircuit,
        badge: 'NEURAL ENGINE',
        bg: 'border-accent/40 bg-accent/5',
      };
    } else if (cat.includes('database') || cat.includes('storage')) {
      return {
        type: 'NVMe STORAGE MODULE',
        icon: Database,
        badge: 'DATA STORAGE',
        bg: 'border-accent/40 bg-accent/5',
      };
    } else if (cat.includes('network')) {
      return {
        type: 'SWITCH BOARD PCB',
        icon: Network,
        badge: 'NETWORK HUB',
        bg: 'border-accent/40 bg-accent/5',
      };
    } else {
      // Default / Languages
      return {
        type: 'MULTI-CORE CPU',
        icon: Cpu,
        badge: 'COMPUTE MATRIX',
        bg: 'border-accent/40 bg-accent/5',
      };
    }
  };

  const handleSkillClick = (skill: SkillData) => {
    CyberAudio.playKeyClick(audioMuted);
    setSelectedSkill(skill);
  };

  return (
    <section id="skills" className="py-24 px-4 md:px-8 relative z-10 circuit-grid font-mono">
      <div className="max-w-7xl mx-auto space-y-10 pl-0 lg:pl-16">
        
        {/* Section Title Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
            <span className="pulse-dot" />
            // HARDWARE TESTBED & SKILLS LAB
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            PCB HARDWARE MODULES & <br />
            <span className="text-gradient">TECHNICAL CAPABILITIES</span>
          </h2>
        </div>

        {/* Category Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                CyberAudio.playKeyClick(audioMuted);
              }}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all uppercase ${
                selectedCategory === cat
                  ? 'bg-accent text-[#050505] border-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]'
                  : 'bg-[#040705]/80 text-gray-400 border-accent/30 hover:border-accent hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* PCB Hardware Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => {
            const hw = getHardwareIdentity(skill.category);
            const HardwareIcon = hw.icon;

            return (
              <div
                key={skill.id}
                onClick={() => handleSkillClick(skill)}
                className="glass-panel p-5 border-accent/40 bg-[#040705]/90 rounded-2xl hover:border-accent hover:-translate-y-1 transition-all cursor-pointer group space-y-4 shadow-xl relative overflow-hidden"
              >
                {/* Micro Circuit Lines Header */}
                <div className="flex items-center justify-between border-b border-accent/20 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-accent">
                    <HardwareIcon className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                    <span>{hw.type}</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent font-bold">
                    {hw.badge}
                  </span>
                </div>

                {/* Skill Name & Hardware Pin Aesthetic */}
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white group-hover:text-accent transition-colors">
                    {skill.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-sans">
                    Category: <span className="text-gray-300 font-mono">{skill.category}</span>
                  </p>
                </div>

                {/* PCB Copper Pins Visual Indicator */}
                <div className="flex items-center justify-between border-t border-accent/15 pt-3 text-[10px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span>STATUS: ACTIVE</span>
                  </div>
                  <span className="text-accent group-hover:underline font-bold text-[9px]">
                    EXPAND SPEC &gt;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- DETAILED HARDWARE SPEC MODAL --- */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 bg-[#030504]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full glass-panel p-6 border-accent/60 bg-[#040805] rounded-2xl space-y-6 shadow-[0_0_60px_rgba(0,255,102,0.25)] relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-accent/30 pb-3">
              <div className="flex items-center gap-2 text-accent font-bold text-sm">
                <Code2 className="w-5 h-5 text-accent" />
                <span>HARDWARE SPEC SHEET // {selectedSkill.name.toUpperCase()}</span>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="p-1 rounded-lg border border-accent/30 text-gray-400 hover:text-accent hover:border-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spec Details */}
            <div className="space-y-4 text-xs">
              <div className="bg-[#020403] p-4 rounded-xl border border-accent/30 space-y-2">
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400">MODULE:</span>
                  <span className="font-bold text-accent">{selectedSkill.name}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400">CATEGORY:</span>
                  <span className="font-bold text-white">{selectedSkill.category}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400">PRACTICAL INTEGRATION:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PRODUCTION VERIFIED
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-gray-300 font-sans text-xs">
                <h4 className="font-mono text-accent font-bold uppercase text-[11px]">
                  // TECHNICAL DESCRIPTION & UTILIZATION
                </h4>
                <p className="leading-relaxed">
                  Extensively applied across security tools, backend API architectures, AI integrations, and full-stack software. Demonstrated competence in production projects, automated scripts, and system security testing.
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2 border-t border-accent/20 flex justify-end">
              <button
                onClick={() => setSelectedSkill(null)}
                className="px-5 py-2.5 rounded-xl border border-accent text-accent font-bold text-xs hover:bg-accent hover:text-[#050505] transition-all"
              >
                CLOSE SPECIFICATION
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
