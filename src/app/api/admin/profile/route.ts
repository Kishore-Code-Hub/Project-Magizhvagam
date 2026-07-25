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
    const mergedStatsStr = JSON.stringify({ ...existingStatsObj, ...incomingStatsObj });

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.headline !== undefined) updateData.headline = body.headline;
    if (body.taglines !== undefined) updateData.taglines = taglinesStr;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.professionalIdentity !== undefined) updateData.professionalIdentity = body.professionalIdentity;
    if (body.personalBio !== undefined) updateData.personalBio = body.personalBio;
    if (body.currentFocus !== undefined) updateData.currentFocus = body.currentFocus;
    if (body.techPhilosophy !== undefined) updateData.techPhilosophy = body.techPhilosophy;
    if (body.availability !== undefined) updateData.availability = body.availability;
    if (body.resumeUrl !== undefined) updateData.resumeUrl = body.resumeUrl;
    if (body.socials !== undefined) updateData.socials = socialsStr;
    if (body.stats !== undefined) updateData.stats = mergedStatsStr;

    const updated = await db.profile.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        name: body.name || 'Soundkish',
        headline: body.headline || 'Securing Systems. Building Trust.',
        taglines: taglinesStr,
        bio: body.bio || '',
        professionalIdentity: body.professionalIdentity || 'Software Engineer & Cybersecurity Researcher',
        personalBio: body.personalBio || body.bio || '',
        currentFocus: body.currentFocus || '',
        techPhilosophy: body.techPhilosophy || '',
        availability: body.availability || 'Open to Internships',
        resumeUrl: body.resumeUrl || '',
        socials: socialsStr,
        stats: mergedStatsStr,
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
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[API /api/admin/profile Error]:', err);
    return NextResponse.json({ error: `Database Error: ${err.message}` }, { status: 500 });
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await db.profile.findFirst();
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  return handleProfileUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleProfileUpdate(req);
}
