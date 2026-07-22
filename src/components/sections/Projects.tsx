'use client';

import React, { useState } from 'react';
import { ProjectData } from '@/types';
import {
  FolderGit2,
  ExternalLink,
  Maximize2,
  X,
  Terminal,
  Calendar,
  LayoutDashboard,
  Brain,
  CheckCircle2,
  Code2,
} from 'lucide-react';
import { GithubIcon } from '@/components/ui/Icons';
import { CyberAudio } from '@/lib/CyberAudio';
import { useTheme } from '@/components/theme/ThemeProvider';

interface ProjectsProps {
  projects: ProjectData[];
}

export default function Projects({ projects }: ProjectsProps) {
  const { audioMuted } = useTheme();
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  // Determine custom window personality based on project tags/title
  const getProjectPersonality = (p: ProjectData) => {
    const title = p.title.toLowerCase();
    const tags = p.tags.map((t) => t.toLowerCase()).join(' ');

    if (title.includes('erp') || title.includes('enterprise') || tags.includes('dashboard')) {
      return {
        label: 'ENTERPRISE DASHBOARD OS',
        icon: LayoutDashboard,
        accent: 'border-accent/40 bg-accent/5',
        themeBadge: 'ENTERPRISE SYSTEM',
      };
    } else if (title.includes('timetable') || title.includes('schedule') || tags.includes('calendar')) {
      return {
        label: 'SCHEDULING GRID UI',
        icon: Calendar,
        accent: 'border-accent/40 bg-accent/5',
        themeBadge: 'UNIVERSITY SUITE',
      };
    } else if (title.includes('ai') || title.includes('neural') || title.includes('mangomate')) {
      return {
        label: 'NEURAL MATRIX INSPECTOR',
        icon: Brain,
        accent: 'border-accent/40 bg-accent/5',
        themeBadge: 'AI / MACHINE LEARNING',
      };
    } else {
      return {
        label: 'SOC COMMAND APPLICATION',
        icon: Terminal,
        accent: 'border-accent/40 bg-accent/5',
        themeBadge: 'CYBERSECURITY TOOL',
      };
    }
  };

  const handleProjectClick = (p: ProjectData) => {
    CyberAudio.playKeyClick(audioMuted);
    setSelectedProject(p);
  };

  return (
    <section id="projects" className="py-24 px-4 md:px-8 relative z-10 circuit-grid font-mono">
      <div className="max-w-7xl mx-auto space-y-10 pl-0 lg:pl-16">
        
        {/* Section Title Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/30">
            <span className="pulse-dot" />
            // SOFTWARE LAB & VIRTUAL APPLICATIONS
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            PRODUCTION SYSTEMS & <br />
            <span className="text-gradient">DESKTOP SOFTWARE SHOWCASE</span>
          </h2>
        </div>

        {/* Projects Desktop Application Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project) => {
            const personality = getProjectPersonality(project);
            const AppIcon = personality.icon;

            return (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="glass-panel p-0 border-accent/40 bg-[#040705]/95 rounded-2xl overflow-hidden hover:border-accent hover:-translate-y-1 transition-all cursor-pointer group shadow-2xl flex flex-col justify-between"
              >
                {/* Virtual Desktop Application Window Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#070c08] border-b border-accent/25 text-xs">
                  <div className="flex items-center gap-2">
                    <AppIcon className="w-4 h-4 text-accent" />
                    <span className="font-bold text-white tracking-wide">{personality.label}</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-accent/15 border border-accent/30 text-accent font-extrabold">
                    {personality.themeBadge}
                  </span>
                </div>

                {/* Project Image Banner */}
                <div className="relative h-48 sm:h-56 w-full bg-[#020403] overflow-hidden group-hover:opacity-95 transition-opacity">
                  <img
                    src={project.image || '/images/project-placeholder.svg'}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040705] via-transparent to-transparent" />
                  
                  <button className="absolute top-3 right-3 p-2 rounded-xl bg-[#050505]/80 border border-accent/40 text-accent backdrop-blur-md hover:bg-accent hover:text-[#050505] transition-all">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Project Info Panel */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-white group-hover:text-accent transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-gray-300 font-sans leading-relaxed line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  {/* Technology Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {project.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-accent/10 border border-accent/30 text-[10px] font-bold text-accent"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Link Footer */}
                  <div className="flex items-center justify-between border-t border-accent/20 pt-4 text-xs font-bold">
                    <span className="text-accent group-hover:underline flex items-center gap-1 text-[11px]">
                      OPEN FULL SHOWCASE &gt;
                    </span>
                    <div className="flex items-center gap-2">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg border border-accent/40 text-gray-300 hover:text-accent hover:border-accent"
                        >
                          <GithubIcon className="w-4 h-4" />
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg border border-accent/40 text-gray-300 hover:text-accent hover:border-accent"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- FULLSCREEN PROJECT SHOWCASE MODAL --- */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-[#030504]/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="max-w-3xl w-full glass-panel p-6 border-accent/60 bg-[#040805] rounded-2xl space-y-6 shadow-[0_0_80px_rgba(0,255,102,0.3)] relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-accent/30 pb-3">
              <div className="flex items-center gap-2 text-accent font-bold text-base">
                <FolderGit2 className="w-5 h-5 text-accent" />
                <span>PROJECT SHOWCASE // {selectedProject.title.toUpperCase()}</span>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-lg border border-accent/30 text-gray-400 hover:text-accent hover:border-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Project Image */}
            <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-accent/30 relative bg-black">
              <img
                src={selectedProject.image}
                alt={selectedProject.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Modal Details Body */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-white">{selectedProject.title}</h3>
                <p className="text-sm text-gray-300 font-sans leading-relaxed">
                  {selectedProject.longDescription || selectedProject.description}
                </p>
              </div>

              {/* Technologies Used */}
              <div className="space-y-2">
                <h4 className="text-xs text-accent font-bold uppercase">// TECHNOLOGIES & STACK</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/40 text-xs font-bold text-accent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Security & System Architecture Integrity */}
              <div className="bg-[#020403] p-4 rounded-xl border border-accent/30 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> PRODUCTION READY ARCHITECTURE
                </div>
                <p className="text-gray-400 font-sans text-xs">
                  Hardened authentication logic, optimized database indexing, responsive client layout, and strict input validation.
                </p>
              </div>
            </div>

            {/* Modal Footer Links */}
            <div className="pt-3 border-t border-accent/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {selectedProject.githubUrl && (
                  <a
                    href={selectedProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-accent text-accent font-bold hover:bg-accent hover:text-[#050505] transition-all"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>VIEW GITHUB REPO</span>
                  </a>
                )}
                {selectedProject.liveUrl && (
                  <a
                    href={selectedProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-[#050505] font-bold hover:bg-white transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>LAUNCH DEMO</span>
                  </a>
                )}
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2.5 rounded-xl border border-accent/40 text-gray-300 font-bold hover:text-accent hover:border-accent"
              >
                CLOSE SHOWCASE
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
