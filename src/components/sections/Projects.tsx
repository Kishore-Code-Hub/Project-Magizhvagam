'use client';

import React, { useState } from 'react';
import { ProjectData } from '@/types';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { GithubIcon } from '@/components/ui/Icons';
import Link from 'next/link';

interface ProjectsProps {
  projects: ProjectData[];
}

export default function Projects({ projects }: ProjectsProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  return (
    <section id="projects" className="py-24 px-4 md:px-8 relative z-10">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-purple-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              FEATURED PROJECTS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Things <span className="text-gradient">I've Built</span>
            </h2>
          </div>

          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel text-xs font-semibold hover:translate-x-1 transition-all"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-4 h-4 text-purple-400" />
          </Link>
        </div>

        {/* Project Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              className="glass-panel p-7 flex flex-col justify-between space-y-6 group hover:-translate-y-1.5 transition-all"
            >
              {/* Card Preview Window */}
              <div className="relative w-full h-56 rounded-xl bg-gradient-to-br from-purple-950/40 via-gray-900/60 to-black/80 border border-purple-500/30 overflow-hidden flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="w-full h-full rounded-lg bg-[#0a0a10] border border-purple-500/30 p-4 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[10px] text-purple-400 font-mono tracking-wider">
                      {project.tags[0] || 'APP'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white tracking-wide">{project.title}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{project.description}</p>
                  </div>

                  <div className="flex gap-2">
                    {project.tags.slice(0, 3).map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold group-hover:text-purple-300 transition-colors">
                    {project.title}
                  </h3>
                  <button
                    onClick={() => setSelectedProject(project)}
                    aria-label={`View details for ${project.title}`}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium underline underline-offset-4"
                  >
                    Details
                  </button>
                </div>

                <p className="text-sm text-gray-400 leading-relaxed">{project.description}</p>

                {/* Tech Tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {project.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-xs rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Links */}
              <div className="flex items-center gap-3 pt-3 border-t border-purple-500/20">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg glass-panel text-xs font-semibold hover:scale-105 transition-all"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>Code</span>
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold hover:scale-105 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Live Demo</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel max-w-2xl w-full p-8 space-y-6 relative border-purple-500/50 shadow-2xl">
            <button
              onClick={() => setSelectedProject(null)}
              aria-label="Close modal"
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 text-lg"
            >
              ✕
            </button>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-purple-400 font-semibold">
                PROJECT OVERVIEW
              </span>
              <h3 className="text-2xl font-bold">{selectedProject.title}</h3>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              {selectedProject.longDescription || selectedProject.description}
            </p>

            <div className="space-y-2">
              <span className="text-xs text-gray-400 font-medium">Technologies</span>
              <div className="flex flex-wrap gap-2">
                {selectedProject.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-xs rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-purple-500/20">
              {selectedProject.githubUrl && (
                <a
                  href={selectedProject.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel text-xs font-semibold"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub Repository</span>
                </a>
              )}
              {selectedProject.liveUrl && (
                <a
                  href={selectedProject.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch Project</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
