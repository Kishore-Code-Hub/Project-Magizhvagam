'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { CyberBadge } from './CyberBadge';
import { GlowButton } from './GlowButton';
import { ExternalLink, BookOpen, Layers, Star, Download, Eye } from 'lucide-react';
import { GithubIcon } from './Icons';
import { normalizeImageUrl } from '@/lib/image-utils';

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  longDescription?: string | null;
  image: string;
  gallery?: string;
  videoUrl?: string | null;
  githubUrl?: string | null;
  liveUrl?: string | null;
  documentationUrl?: string | null;
  architectureDiagram?: string | null;
  features?: string;
  challenges?: string | null;
  solutions?: string | null;
  tags: string;
  category: string;
  status: string;
  metrics?: string;
  featured: boolean;
  order: number;
}

interface ProjectCardProps {
  project: ProjectItem;
  onSelect?: (project: ProjectItem) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  const normalizedImage = normalizeImageUrl(project.image, 'projects') || '/project-placeholder.jpg';
  const parsedTags: string[] = React.useMemo(() => {
    try {
      return JSON.parse(project.tags);
    } catch {
      return [];
    }
  }, [project.tags]);

  const parsedMetrics = React.useMemo(() => {
    try {
      return JSON.parse(project.metrics || '{}');
    } catch {
      return {};
    }
  }, [project.metrics]);

  return (
    <GlassCard variant="interactive" className="group flex flex-col justify-between h-full p-0 overflow-hidden">
      {/* Cover Image Container */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-black/40">
        <img
          src={normalizedImage}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <CyberBadge variant="green" size="sm">
            {project.category}
          </CyberBadge>
          {project.featured && (
            <CyberBadge variant="amber" size="sm" icon={<Star className="w-3 h-3 fill-amber-400" />}>
              Featured
            </CyberBadge>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono rounded bg-black/70 border border-white/10 text-gray-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" />
            {project.status}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-[var(--accent-color)] transition-colors mb-2">
            {project.title}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-4">
            {project.description}
          </p>

          {/* Tech Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {parsedTags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs font-mono rounded bg-white/5 text-gray-300 border border-white/10"
              >
                #{tag}
              </span>
            ))}
            {parsedTags.length > 4 && (
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-white/5 text-gray-400">
                +{parsedTags.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[var(--accent-color)] border border-white/10 transition-colors"
                title="GitHub Repository"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[var(--accent-color)] border border-white/10 transition-colors"
                title="Live Demonstration"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <GlowButton
            variant="outline"
            size="sm"
            onClick={() => onSelect && onSelect(project)}
            rightIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Details
          </GlowButton>
        </div>
      </div>
    </GlassCard>
  );
};
