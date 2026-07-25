import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.appearanceSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await db.appearanceSettings.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json(settings);
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

    const updated = await db.appearanceSettings.upsert({
      where: { id: 'default' },
      update: body,
      create: { id: 'default', ...body },
    });

    // Record Audit Log
    await db.auditLog.create({
      data: {
        action: 'UPDATE_APPEARANCE_SETTINGS',
        actor: session.email,
        details: JSON.stringify(body),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
