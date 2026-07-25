import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let seo = await db.sEOSettings.findUnique({
      where: { id: 'default' },
    });

    if (!seo) {
      seo = await db.sEOSettings.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json(seo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const updated = await db.sEOSettings.upsert({
      where: { id: 'default' },
      update: body,
      create: { id: 'default', ...body },
    });

    await db.auditLog.create({
      data: {
        action: 'UPDATE_SEO_SETTINGS',
        actor: session.email,
        details: JSON.stringify(body),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
