import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await db.profile.findFirst();
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const updated = await db.profile.upsert({
      where: { id: 'default' },
      update: {
        name: body.name,
        headline: body.headline,
        taglines: JSON.stringify(body.taglines || []),
        bio: body.bio,
        resumeUrl: body.resumeUrl,
        socials: JSON.stringify(body.socials || {}),
        stats: JSON.stringify(body.stats || {}),
      },
      create: {
        id: 'default',
        name: body.name || 'Soundkish',
        headline: body.headline || 'Securing Systems. Building Trust.',
        taglines: JSON.stringify(body.taglines || []),
        bio: body.bio || '',
        resumeUrl: body.resumeUrl || '',
        socials: JSON.stringify(body.socials || {}),
        stats: JSON.stringify(body.stats || {}),
      },
    });

    await db.auditLog.create({
      data: {
        action: 'UPDATE_PROFILE',
        actor: session.email,
        details: 'Updated profile bio & social settings',
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
