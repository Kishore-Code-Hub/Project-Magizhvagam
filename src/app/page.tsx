import React from 'react';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Skills from '@/components/sections/Skills';
import Projects from '@/components/sections/Projects';
import Certifications from '@/components/sections/Certifications';
import Timeline from '@/components/sections/Timeline';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/sections/Footer';

import { db } from '@/lib/db';
import { seedDatabaseIfEmpty } from '@/lib/seed-db';
import {
  INITIAL_PROFILE,
  INITIAL_PROJECTS,
  INITIAL_SKILLS,
  INITIAL_CERTIFICATIONS,
  INITIAL_TIMELINE,
} from '@/lib/initial-data';
import { ProfileData, ProjectData, SkillData, CertificationData, TimelineData } from '@/types';

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

export default async function HomePage() {
  // Ensure DB has seed data
  await seedDatabaseIfEmpty();

  let profile: ProfileData = INITIAL_PROFILE;
  let skills: SkillData[] = INITIAL_SKILLS;
  let projects: ProjectData[] = INITIAL_PROJECTS;
  let certifications: CertificationData[] = INITIAL_CERTIFICATIONS;
  let timeline: TimelineData[] = INITIAL_TIMELINE;

  try {
    const dbProfile = await db.profile.findFirst();
    if (dbProfile) {
      const parsedTaglines = safeJsonParse<string[]>(dbProfile.taglines, INITIAL_PROFILE.taglines);
      const parsedSocials = safeJsonParse<any>(dbProfile.socials, INITIAL_PROFILE.socials);
      const parsedStats = safeJsonParse<any>(dbProfile.stats, INITIAL_PROFILE.stats);

      profile = {
        id: dbProfile.id ?? 'default',
        name: dbProfile.name || INITIAL_PROFILE.name,
        headline: dbProfile.headline || INITIAL_PROFILE.headline,
        taglines: Array.isArray(parsedTaglines) && parsedTaglines.length > 0 ? parsedTaglines : INITIAL_PROFILE.taglines,
        bio: dbProfile.bio || INITIAL_PROFILE.bio,
        resumeUrl: dbProfile.resumeUrl || INITIAL_PROFILE.resumeUrl,
        socials: {
          github: parsedSocials?.github || INITIAL_PROFILE.socials.github,
          linkedin: parsedSocials?.linkedin || INITIAL_PROFILE.socials.linkedin,
          email: parsedSocials?.email || INITIAL_PROFILE.socials.email,
        },
        stats: {
          yearsLearning: parsedStats?.yearsLearning || INITIAL_PROFILE.stats.yearsLearning,
          projects: parsedStats?.projects || INITIAL_PROFILE.stats.projects,
          certifications: parsedStats?.certifications || INITIAL_PROFILE.stats.certifications,
          curiosity: parsedStats?.curiosity || INITIAL_PROFILE.stats.curiosity,
        },
      };
    }

    const dbSkills = await db.skill.findMany({ orderBy: { order: 'asc' } });
    if (dbSkills.length > 0) {
      skills = dbSkills.map((s) => ({
        id: s.id,
        name: s.name || 'Skill',
        category: s.category || 'Languages',
        icon: s.icon || 'code',
        order: s.order ?? 0,
      }));
    }

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

    const dbCerts = await db.certification.findMany({ orderBy: { order: 'asc' } });
    if (dbCerts.length > 0) {
      certifications = dbCerts.map((c) => ({
        id: c.id,
        title: c.title || 'Certification',
        issuer: c.issuer || '',
        issueDate: c.issueDate || '',
        credentialUrl: c.credentialUrl || null,
        logoUrl: c.logoUrl || null,
        order: c.order ?? 0,
      }));
    }

    const dbTimeline = await db.timelineEntry.findMany({ orderBy: { order: 'asc' } });
    if (dbTimeline.length > 0) {
      timeline = dbTimeline.map((t) => ({
        id: t.id,
        year: t.year || '',
        title: t.title || '',
        subtitle: t.subtitle || null,
        description: t.description || '',
        category: t.category || 'Education',
        order: t.order ?? 0,
      }));
    }
  } catch (err) {
    console.error('Error fetching database records, using fallbacks:', err);
  }

  return (
    <main className="relative min-h-screen bg-transparent text-[#f5f5f7]">
      <Hero profile={profile} />
      <About profile={profile} />
      <Skills skills={skills} />
      <Projects projects={projects} />
      <Certifications certifications={certifications} />
      <Timeline timeline={timeline} />
      <Contact />
      <Footer profile={profile} />
    </main>
  );
}
