import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

function normalizeJsonField(val: any, fallback: any = []): string {
  if (typeof val === 'string') {
    try {
      JSON.parse(val);
      return val;
    } catch {
      return JSON.stringify(val ? [val] : fallback);
    }
  }
  return JSON.stringify(val ?? fallback);
}

async function handleProfileUpdate(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    const taglinesStr = normalizeJsonField(body.taglines, []);
    const socialsStr = normalizeJsonField(body.socials, {});
    const aboutModulesStr = normalizeJsonField(body.aboutModules, {
      showEducation: true,
      showFocus: true,
      showRoadmap: true,
      showSpecializations: true,
      showStats: true,
    });
    const academicDegreeStr = normalizeJsonField(body.academicDegree, {
      degree: 'B.E. Computer Science & Engineering',
      college: 'SRM Valliammai Engineering College',
      year: '2024 – 2028',
      status: 'Active',
    });
    const focusChipsStr = normalizeJsonField(body.focusChips, [
      '✓ Cybersecurity',
      '✓ AI & Neural Nets',
      '✓ Backend Systems',
      '✓ Cloud Infrastructure',
      '✓ DevOps & Containers',
      '✓ Network Security',
    ]);
    const careerRoadmapStr = normalizeJsonField(body.careerRoadmap, [
      { year: '2024', title: 'Started CSE Engineering', description: 'Foundation in computer science & security principles', iconName: 'GraduationCap', colorToken: 'emerald' },
      { year: '2025', title: 'Full Stack & Security Projects', description: 'Building web systems and pentesting labs', iconName: 'Code2', colorToken: 'cyan' },
      { year: '2026', title: 'AI + Cyber Threat Detection', description: 'Advanced machine learning for network intrusion', iconName: 'Cpu', colorToken: 'amber' },
      { year: 'Goal', title: 'Security Software Engineer', description: 'Production engineering and defense-in-depth', iconName: 'ShieldCheck', colorToken: 'rose' },
    ]);
    const statsCardsStr = normalizeJsonField(body.statsCards, [
      { id: '1', value: '15+', label: 'Projects Built', colorToken: 'emerald', iconName: 'Rocket' },
      { id: '2', value: '10+', label: 'Certifications', colorToken: 'cyan', iconName: 'Award' },
      { id: '3', value: '2+', label: 'Years Learning', colorToken: 'emerald', iconName: 'Flame' },
      { id: '4', value: '∞', label: 'Curiosity', colorToken: 'amber', iconName: 'Sparkles' },
    ]);
    const specializationCardsStr = normalizeJsonField(body.specializationCards, [
      { id: '1', title: 'Cybersecurity', description: 'Application Security, Threat Detection & Vulnerability Analysis', iconName: 'ShieldCheck', colorToken: 'emerald' },
      { id: '2', title: 'AI Systems', description: 'Neural Networks, Computer Vision & Constraint Algorithms', iconName: 'Cpu', colorToken: 'cyan' },
      { id: '3', title: 'Cloud Infra', description: 'Scalable Microservices, Docker Containers & CI/CD Pipelines', iconName: 'Globe', colorToken: 'amber' },
      { id: '4', title: 'Networking', description: 'TCP/IP Architecture, Packet Analysis & Firewall Systems', iconName: 'Compass', colorToken: 'rose' },
      { id: '5', title: 'Backend Systems', description: 'FastAPI, Node.js, High-Throughput REST APIs & JWT Security', iconName: 'Code2', colorToken: 'purple' },
      { id: '6', title: 'Linux Kernel', description: 'Bash Scripting, System Administration & Access Controls', iconName: 'Terminal', colorToken: 'emerald' },
    ]);

    // Retrieve existing profile stats to merge intelligently
    const existingProfile = await db.profile.findUnique({ where: { id: 'default' } });
    let existingStatsObj = {};
    if (existingProfile?.stats) {
      try {
        existingStatsObj = typeof existingProfile.stats === 'string' ? JSON.parse(existingProfile.stats) : existingProfile.stats;
      } catch {}
    }
    let incomingStatsObj = {};
    if (body.stats) {
      try {
        incomingStatsObj = typeof body.stats === 'string' ? JSON.parse(body.stats) : body.stats;
      } catch {}
    }
    const imgUrl = body.profileImage || body.image;
    if (imgUrl) {
      (incomingStatsObj as any).profileImage = imgUrl;
    }
    const mergedStatsStr = JSON.stringify({ ...existingStatsObj, ...incomingStatsObj });

    const updateData: any = {};
    if (imgUrl) updateData.profileImage = imgUrl;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.headline !== undefined) updateData.headline = body.headline;
    if (body.taglines !== undefined) updateData.taglines = taglinesStr;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.professionalIdentity !== undefined) updateData.professionalIdentity = body.professionalIdentity;
    if (body.personalBio !== undefined) updateData.personalBio = body.personalBio;
    if (body.currentFocus !== undefined) updateData.currentFocus = body.currentFocus;
    if (body.availability !== undefined) updateData.availability = body.availability;
    if (body.resumeUrl !== undefined) updateData.resumeUrl = body.resumeUrl;
    if (body.socials !== undefined) updateData.socials = socialsStr;
    if (body.stats !== undefined || imgUrl) updateData.stats = mergedStatsStr;
    if (body.aboutModules !== undefined) updateData.aboutModules = aboutModulesStr;
    if (body.academicDegree !== undefined) updateData.academicDegree = academicDegreeStr;
    if (body.focusChips !== undefined) updateData.focusChips = focusChipsStr;
    if (body.careerRoadmap !== undefined) updateData.careerRoadmap = careerRoadmapStr;
    if (body.statsCards !== undefined) updateData.statsCards = statsCardsStr;
    if (body.specializationCards !== undefined) updateData.specializationCards = specializationCardsStr;

    const updated = await db.profile.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        name: body.name || 'Soundkish',
        headline: body.headline || 'Securing Systems. Building Trust.',
        profileImage: imgUrl || '/uploads/about/1784968630446-IMG_0307.JPG',
        taglines: taglinesStr,
        bio: body.bio || '',
        professionalIdentity: body.professionalIdentity || 'Software Engineer & Cybersecurity Researcher',
        personalBio: body.personalBio || body.bio || '',
        currentFocus: body.currentFocus || '',
        availability: body.availability || 'Open to Internships',
        resumeUrl: body.resumeUrl || '',
        socials: socialsStr,
        stats: mergedStatsStr,
        aboutModules: aboutModulesStr,
        academicDegree: academicDegreeStr,
        focusChips: focusChipsStr,
        careerRoadmap: careerRoadmapStr,
        statsCards: statsCardsStr,
        specializationCards: specializationCardsStr,
      },
    });

    await db.auditLog.create({
      data: {
        action: 'UPDATE_PROFILE',
        actor: session.email,
        details: 'Updated profile settings',
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/about');

    return NextResponse.json(updated, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[API /api/admin/profile Error]:', err);
    return NextResponse.json({ error: `Database Error: ${err.message}` }, { status: 500 });
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await db.profile.findFirst();
  return NextResponse.json(profile, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}

export async function PUT(req: NextRequest) {
  return handleProfileUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleProfileUpdate(req);
}
