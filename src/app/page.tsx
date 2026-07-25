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
  await seedDatabaseIfEmpty();

  let profileData: any = {
    id: 'default',
    name: 'Kishore Narayanan K',
    headline: 'Securing Systems. Building Trust.',
    taglines: ['Cybersecurity Researcher', 'AI Developer', 'Full-Stack Software Engineer'],
    bio: "I'm Kishore Narayanan K, a Computer Science & Engineering student passionate about Cybersecurity, AI, and building secure software solutions.",
    professionalIdentity: 'Software Engineer & Cybersecurity Researcher',
    personalBio: 'Deep interest in application security, penetration testing, full-stack systems architecture, and machine learning integration.',
    education: ['B.E. Computer Science & Engineering'],
    currentFocus: 'Building production-grade secure web apps & studying AI-driven threat detection.',
    values: ['Security First', 'Clean Code', 'Continuous Learning', 'User Privacy'],
    techPhilosophy: 'Build simple, resilient, and audit-ready systems with defence-in-depth architecture.',
    availability: 'Open for Internships & Full-Stack Roles',
    languages: ['English', 'Tamil'],
    resumeUrl: 'https://drive.google.com',
    socials: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      email: 'mailto:contact@soundkish.dev',
      leetcode: 'https://leetcode.com',
      tryhackme: 'https://tryhackme.com',
      hackthebox: 'https://hackthebox.com',
    },
    stats: {
      yearsLearning: '2+',
      projects: '15+',
      certifications: '10+',
      curiosity: '∞',
    },
  };

  let skillsData: any[] = [];
  let projectsData: any[] = [];
  let certsData: any[] = [];
  let timelineData: any[] = [];

  try {
    const dbProfile = await db.profile.findFirst();
    if (dbProfile) {
      profileData = {
        ...dbProfile,
        taglines: safeJsonParse<string[]>(dbProfile.taglines, profileData.taglines),
        socials: safeJsonParse<any>(dbProfile.socials, profileData.socials),
        stats: safeJsonParse<any>(dbProfile.stats, profileData.stats),
        values: safeJsonParse<string[]>(dbProfile.values, profileData.values),
        education: safeJsonParse<string[]>(dbProfile.education, profileData.education),
      };
    }

    const dbSkills = await db.skill.findMany({
      where: { published: true },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    });
    skillsData = dbSkills;

    const dbProjects = await db.project.findMany({
      where: { published: true },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    });
    projectsData = dbProjects;

    const dbCerts = await db.certification.findMany({
      where: { published: true },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    });
    certsData = dbCerts;

    const dbTimeline = await db.timelineEntry.findMany({
      orderBy: [{ order: 'asc' }, { year: 'desc' }],
    });
    timelineData = dbTimeline;
  } catch (err) {
    console.error('Database query fallback:', err);
  }

  return (
    <main className="relative min-h-screen bg-transparent text-[#f5f5f7]">
      <Hero profile={profileData} />
      <About profile={profileData} />
      <Skills skills={skillsData} />
      <Projects projects={projectsData} />
      <Certifications certifications={certsData} />
      <Timeline timeline={timelineData} />
      <Contact profile={profileData} />
      <Footer profile={profileData} />
    </main>
  );
}
