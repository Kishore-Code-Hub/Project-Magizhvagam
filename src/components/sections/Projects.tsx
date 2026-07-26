'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ProjectCard, ProjectItem } from '@/components/ui/ProjectCard';
import { Modal } from '@/components/ui/Modal';
import { ImageGallery } from '@/components/ui/ImageGallery';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlowButton } from '@/components/ui/GlowButton';
import { CyberBadge } from '@/components/ui/CyberBadge';
import { Search, ExternalLink, BookOpen, Layers, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { GithubIcon } from '@/components/ui/Icons';
import { DESIGN_SYSTEM } from '@/lib/design-system';

interface ProjectsProps {
  projects: ProjectItem[];
}

export default function Projects({ projects = [] }: ProjectsProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('All Projects');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  useEffect(() => {
    try {
      router.prefetch('/admin/login');
    } catch {}
  }, [router]);

  const categories = DESIGN_SYSTEM.categories.projects;

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All Projects' || p.category === selectedCategory;
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  const activeGalleryImages = useMemo(() => {
    if (!activeProject) return [];
    try {
      const parsed = JSON.parse(activeProject.gallery || '[]');
      return parsed.length > 0 ? parsed : [activeProject.image];
    } catch {
      return [activeProject.image];
    }
  }, [activeProject]);

  const activeFeatures = useMemo(() => {
    if (!activeProject) return [];
    try {
      return JSON.parse(activeProject.features || '[]');
    } catch {
      return [];
    }
  }, [activeProject]);

  const activeTags = useMemo(() => {
    if (!activeProject) return [];
    try {
      return JSON.parse(activeProject.tags || '[]');
    } catch {
      return [];
    }
  }, [activeProject]);

  return (
    <SectionWrapper id="projects">
      <SectionTitle
        title="FEATURED PROJECTS"
        subtitle="Software Engineering  • vibe_coding Projects • CyberSecurity • AI Solutions"
      />

      {/* Category Filter Bar */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-accent)] backdrop-blur-xl no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-xs font-mono rounded-xl border transition-all whitespace-nowrap cursor-pointer ${selectedCategory === cat
              ? 'bg-[var(--accent-color)] text-black font-bold border-[var(--accent-color)] shadow-[var(--shadow-accent-glow)]'
              : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:text-white'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={(p) => setActiveProject(p)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Projects Found"
          description="Try modifying your search or choosing another category."
        />
      )}

      {/* Detailed Architectural Modal */}
      <Modal
        isOpen={!!activeProject}
        onClose={() => setActiveProject(null)}
        title={activeProject?.title}
        maxWidth="4xl"
      >
        {activeProject && (
          <div className="space-y-6 text-left font-sans">
            {/* Gallery / Media */}
            <ImageGallery images={activeGalleryImages} alt={activeProject.title} />

            {/* Badges & Overview */}
            <div className="flex flex-wrap items-center gap-2">
              <CyberBadge variant="green">{activeProject.category}</CyberBadge>
              <CyberBadge variant="cyan">{activeProject.status}</CyberBadge>
              {activeTags.map((tag: string, i: number) => (
                <span key={i} className="px-2 py-0.5 text-xs font-mono rounded bg-white/5 text-gray-300 border border-white/10">
                  #{tag}
                </span>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-mono text-[var(--accent-color)] uppercase tracking-wider mb-1 font-bold">
                Project Overview
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed font-sans">
                {activeProject.longDescription || activeProject.description}
              </p>
            </div>

            {/* Features */}
            {activeFeatures.length > 0 && (
              <div>
                <h4 className="text-sm font-mono text-[var(--accent-color)] uppercase tracking-wider mb-2 font-bold">
                  Key System Features
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeFeatures.map((feat: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Challenges & Solutions */}
            {(activeProject.challenges || activeProject.solutions) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProject.challenges && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <h5 className="text-xs font-mono text-amber-400 font-bold uppercase flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Technical Challenges
                    </h5>
                    <p className="text-xs text-gray-300 leading-relaxed">{activeProject.challenges}</p>
                  </div>
                )}
                {activeProject.solutions && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <h5 className="text-xs font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5 mb-2">
                      <Shield className="w-4 h-4" /> Architectural Solutions
                    </h5>
                    <p className="text-xs text-gray-300 leading-relaxed">{activeProject.solutions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Links Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {activeProject.githubUrl && (
                  <GlowButton
                    variant="secondary"
                    size="sm"
                    leftIcon={<GithubIcon className="w-4 h-4" />}
                    onClick={() => window.open(activeProject.githubUrl!, '_blank')}
                  >
                    View Codebase
                  </GlowButton>
                )}
                {activeProject.liveUrl && (
                  <GlowButton
                    variant="primary"
                    size="sm"
                    rightIcon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => window.open(activeProject.liveUrl!, '_blank')}
                  >
                    Live Demo
                  </GlowButton>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </SectionWrapper>
  );
}
