import React from 'react';
import Navbar from '@/components/nav/Navbar';
import Footer from '@/components/sections/Footer';
import ProjectsClient from '@/components/sections/ProjectsClient';
import { db } from '@/lib/db';
import { INITIAL_PROJECTS, INITIAL_PROFILE } from '@/lib/initial-data';
import { ProjectData } from '@/types';

export const revalidate = 0;

function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    const parsed = JSON.parse(jsonString);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export default async function ProjectsPage() {
  let projects: ProjectData[] = INITIAL_PROJECTS;
  let profile = INITIAL_PROFILE;

  try {
    const dbProjects = await db.project.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
    });
    if (dbProjects.length > 0) {
      projects = dbProjects.map((p) => ({
        id: p.id,
        title: p.title || 'Untitled Project',
        description: p.description || '',
        longDescription: p.longDescription || null,
        image: p.image || '/images/project-placeholder.svg',
        tags: safeJsonParse<string[]>(p.tags, []),
        githubUrl: p.githubUrl || null,
        liveUrl: p.liveUrl || null,
        featured: p.featured ?? true,
        order: p.order ?? 0,
        published: p.published ?? true,
      }));
    }
  } catch (e) {
    console.error(e);
  }

  return (
    <main className="min-h-screen bg-[#08080b] text-[#f5f5f7]">
      <Navbar resumeUrl={profile.resumeUrl} />
      <div className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto space-y-12">
        <div className="space-y-4 text-center sm:text-left">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-semibold">
            COMPLETE ARCHIVE
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white">
            All <span className="text-gradient">Projects</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-xl">
            Explore the full collection of software systems, AI models, and security tools I have developed.
          </p>
        </div>

        <ProjectsClient initialProjects={projects} />
      </div>
      <Footer profile={profile} />
    </main>
  );
}
