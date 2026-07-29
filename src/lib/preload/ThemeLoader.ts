'use client';

export interface CMSInitialPayload {
  heroImage: string;
  profileImage: string;
  projectImages: string[];
  certLogos: string[];
  timelineIcons: string[];
  skillLogos: string[];
  loadingDuration: number;
}

export async function fetchCMSPayload(): Promise<CMSInitialPayload> {
  const payload: CMSInitialPayload = {
    heroImage: '/Hero-section-banner.webp',
    profileImage: '/hero-hacker.png',
    projectImages: [],
    certLogos: [],
    timelineIcons: [],
    skillLogos: [],
    loadingDuration: 5.0,
  };

  if (typeof window === 'undefined') return payload;

  try {
    const [profileRes, appearanceRes, projectsRes, certsRes, timelineRes, skillsRes] = await Promise.all([
      fetch('/api/admin/profile').catch(() => null),
      fetch('/api/appearance').catch(() => null),
      fetch('/api/admin/projects').catch(() => null),
      fetch('/api/admin/certificates').catch(() => null),
      fetch('/api/admin/timeline').catch(() => null),
      fetch('/api/admin/skills').catch(() => null),
    ]);

    if (profileRes?.ok) {
      const pData = await profileRes.json().catch(() => null);
      if (pData?.stats) {
        let statsObj: any = {};
        try {
          statsObj = typeof pData.stats === 'string' ? JSON.parse(pData.stats) : pData.stats;
        } catch {}
        if (statsObj.heroImage) payload.heroImage = statsObj.heroImage;
        if (statsObj.profileImage) payload.profileImage = statsObj.profileImage;
      }
    }

    if (appearanceRes?.ok) {
      const aData = await appearanceRes.json().catch(() => null);
      if (aData?.loadingDuration) payload.loadingDuration = aData.loadingDuration;
    }

    if (projectsRes?.ok) {
      const projects = await projectsRes.json().catch(() => []);
      if (Array.isArray(projects)) {
        payload.projectImages = projects.slice(0, 6).map((p: any) => p.image).filter(Boolean);
      }
    }

    if (certsRes?.ok) {
      const certs = await certsRes.json().catch(() => []);
      if (Array.isArray(certs)) {
        payload.certLogos = certs.slice(0, 6).map((c: any) => c.organizationLogo).filter(Boolean);
      }
    }

    if (timelineRes?.ok) {
      const timeline = await timelineRes.json().catch(() => []);
      if (Array.isArray(timeline)) {
        payload.timelineIcons = timeline.slice(0, 6).map((t: any) => t.iconUrl).filter(Boolean);
      }
    }

    if (skillsRes?.ok) {
      const skills = await skillsRes.json().catch(() => []);
      if (Array.isArray(skills)) {
        payload.skillLogos = skills.slice(0, 10).map((s: any) => s.officialLogo).filter(Boolean);
      }
    }
  } catch (err) {
    console.warn('[ThemeLoader] Fallback initialized on CMS fetch error:', err);
  }

  return payload;
}
