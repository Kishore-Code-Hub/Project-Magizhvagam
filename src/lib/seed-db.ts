import { db } from './db';
import {
  INITIAL_PROFILE,
  INITIAL_PROJECTS,
  INITIAL_SKILLS,
  INITIAL_CERTIFICATIONS,
  INITIAL_TIMELINE,
} from './initial-data';
import bcrypt from 'bcryptjs';

export async function seedDatabaseIfEmpty() {
  try {
    // 1. Seed Profile
    const profileCount = await db.profile.count();
    if (profileCount === 0) {
      await db.profile.create({
        data: {
          id: INITIAL_PROFILE.id,
          name: INITIAL_PROFILE.name,
          headline: INITIAL_PROFILE.headline,
          taglines: JSON.stringify(INITIAL_PROFILE.taglines),
          bio: INITIAL_PROFILE.bio,
          resumeUrl: INITIAL_PROFILE.resumeUrl,
          socials: JSON.stringify(INITIAL_PROFILE.socials),
          stats: JSON.stringify(INITIAL_PROFILE.stats),
        },
      });
    }

    // 2. Seed Skills
    const skillCount = await db.skill.count();
    if (skillCount === 0) {
      for (const skill of INITIAL_SKILLS) {
        await db.skill.create({
          data: {
            name: skill.name,
            category: skill.category,
            icon: skill.icon,
            order: skill.order,
          },
        });
      }
    }

    // 3. Seed Projects
    const projectCount = await db.project.count();
    if (projectCount === 0) {
      for (const project of INITIAL_PROJECTS) {
        await db.project.create({
          data: {
            title: project.title,
            description: project.description,
            longDescription: project.longDescription,
            image: project.image,
            tags: JSON.stringify(project.tags),
            githubUrl: project.githubUrl,
            liveUrl: project.liveUrl,
            featured: project.featured,
            order: project.order,
            published: project.published,
          },
        });
      }
    }

    // 4. Seed Certifications
    const certCount = await db.certification.count();
    if (certCount === 0) {
      for (const cert of INITIAL_CERTIFICATIONS) {
        await db.certification.create({
          data: {
            title: cert.title,
            issuer: cert.issuer,
            issueDate: cert.issueDate,
            credentialUrl: cert.credentialUrl,
            logoUrl: cert.logoUrl,
            order: cert.order,
          },
        });
      }
    }

    // 5. Seed Timeline
    const timelineCount = await db.timelineEntry.count();
    if (timelineCount === 0) {
      for (const entry of INITIAL_TIMELINE) {
        await db.timelineEntry.create({
          data: {
            year: entry.year,
            title: entry.title,
            subtitle: entry.subtitle,
            description: entry.description,
            category: entry.category,
            order: entry.order,
          },
        });
      }
    }

    // 6. Seed Admin User
    const adminCount = await db.adminUser.count();
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@soundkish.dev';
      const rawPassword = process.env.ADMIN_PASSWORD || 'CyberSecurityAdmin2026!';
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      await db.adminUser.create({
        data: {
          email,
          passwordHash,
          name: 'Soundkish Admin',
          role: 'ADMIN',
        },
      });
    }
  } catch (err) {
    console.error('Seed database error:', err);
  }
}
