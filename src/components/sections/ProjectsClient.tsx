'use client';

import React, { useState } from 'react';
import { ProjectData } from '@/types';
import { ExternalLink, Filter } from 'lucide-react';
import { GithubIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

export default function ProjectsClient({ initialProjects }: { initialProjects: ProjectData[] }) {
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const safeProjects = Array.isArray(initialProjects) ? initialProjects : [];

  // Extract all unique tags safely
  const allTags = [
    'All',
    ...Array.from(new Set(safeProjects.flatMap((p) => (Array.isArray(p?.tags) ? p.tags : [])))),
  ];

  const filteredProjects =
    selectedTag === 'All'
      ? safeProjects
      : safeProjects.filter((p) => Array.isArray(p?.tags) && p.tags.includes(selectedTag));

  return (
    <div className="space-y-8">
      {/* Tag Filters */}
      <div className="flex flex-wrap gap-2 items-center bg-white/[0.03] p-2 rounded-2xl border border-white/10 w-fit backdrop-blur-md">
        <Filter className="w-4 h-4 text-purple-400 ml-2 mr-1" />
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-xl transition-all',
              selectedTag === tag
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="glass-panel p-6 flex flex-col justify-between space-y-6 group hover:border-purple-500/60 transition-all hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-purple-400 font-mono uppercase tracking-wider">
                  {project.tags?.[0] || 'APP'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                {project.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">{project.description}</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex flex-wrap gap-1.5">
                {(project.tags ?? []).map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                  >
                    <GithubIcon className="w-4 h-4" />
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
