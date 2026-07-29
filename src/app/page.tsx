import React from 'react';
import dynamic from 'next/dynamic';
import Hero from '@/components/sections/Hero';

const About = dynamic(() => import('@/components/sections/About'), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center font-mono text-[#00ff66]/40 text-xs tracking-widest animate-pulse">LOADING_ABOUT_MODULE...</div>,
});
const Skills = dynamic(() => import('@/components/sections/Skills'), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center font-mono text-[#00ff66]/40 text-xs tracking-widest animate-pulse">LOADING_SKILLS_MODULE...</div>,
});
const Projects = dynamic(() => import('@/components/sections/Projects'), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center font-mono text-[#00ff66]/40 text-xs tracking-widest animate-pulse">LOADING_PROJECTS_MODULE...</div>,
});
const Certifications = dynamic(() => import('@/components/sections/Certifications'), {
  loading: () => <div className="min-h-[300px] flex items-center justify-center font-mono text-[#00ff66]/40 text-xs tracking-widest animate-pulse">LOADING_CERTS_MODULE...</div>,
});
const Timeline = dynamic(() => import('@/components/sections/Timeline'), {
  loading: () => <div className="min-h-[300px] flex items-center justify-center font-mono text-[#00ff66]/40 text-xs tracking-widest animate-pulse">LOADING_TIMELINE_MODULE...</div>,
});
const Contact = dynamic(() => import('@/components/sections/Contact'), {
  loading: () => <div className="min-h-[300px] flex items-center justify-center font-mono text-[#00ff66]/40 text-xs tracking-widest animate-pulse">LOADING_CONTACT_MODULE...</div>,
});
const Footer = dynamic(() => import('@/components/sections/Footer'));

import { db } from '@/lib/db';
import { INITIAL_PROFILE } from '@/lib/initial-data';
import { getSocials } from '@/lib/social-utils';

export const revalidate = 60;

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
      email: 'mailto:kishorenarayanankarthikeyan@gmail.com',
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
    // Parallelize database requests to cut SSR TTFB latency by >80%
    const [dbProfile, dbSkills, dbProjects, dbCerts, dbTimeline] = await Promise.all([
      db.profile.findFirst(),
      db.skill.findMany({
        where: { published: true },
        orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      }),
      db.project.findMany({
        where: { published: true },
        orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      }),
      db.certification.findMany({
        where: { published: true },
        orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      }),
      db.timelineEntry.findMany({
        orderBy: [{ order: 'asc' }, { year: 'desc' }],
      }),
    ]);

    if (dbProfile) {
      const p: any = dbProfile;
      const parsedStats = safeJsonParse<any>(p.stats, profileData.stats);
      profileData = {
        ...p,
        image: parsedStats?.profileImage || '/hero-hacker.png',
        taglines: safeJsonParse<string[]>(p.taglines, profileData.taglines),
        socials: getSocials(safeJsonParse<any>(p.socials, profileData.socials)),
        stats: parsedStats,
        values: safeJsonParse<string[]>(p.values, profileData.values),
        education: safeJsonParse<string[]>(p.education, profileData.education),
        aboutModules: safeJsonParse<any>(p.aboutModules, INITIAL_PROFILE.aboutModules),
        academicDegree: safeJsonParse<any>(p.academicDegree, INITIAL_PROFILE.academicDegree),
        focusChips: safeJsonParse<string[]>(p.focusChips, INITIAL_PROFILE.focusChips || []),
        careerRoadmap: safeJsonParse<any[]>(p.careerRoadmap, INITIAL_PROFILE.careerRoadmap || []),
        statsCards: safeJsonParse<any[]>(p.statsCards, INITIAL_PROFILE.statsCards || []),
        specializationCards: safeJsonParse<any[]>(p.specializationCards, INITIAL_PROFILE.specializationCards || []),
      };
    }

    skillsData = dbSkills || [];
    projectsData = dbProjects || [];
    certsData = dbCerts || [];
    timelineData = dbTimeline || [];
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
