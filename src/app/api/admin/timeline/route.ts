import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const timeline = await db.timelineEntry.findMany({
      orderBy: [{ order: 'asc' }, { year: 'desc' }],
    });
    return NextResponse.json(timeline);
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
    const entry = await db.timelineEntry.create({
      data: body,
    });

    await db.auditLog.create({
      data: {
        action: 'CREATE_TIMELINE_ENTRY',
        actor: session.email,
        details: entry.title,
      },
    });

    revalidatePath('/');
    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    console.error('[API /api/admin/timeline POST Error]:', error);
    return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...data } = await req.json();
    const updated = await db.timelineEntry.update({
      where: { id },
      data,
    });

    revalidatePath('/');
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[API /api/admin/timeline PUT Error]:', error);
    return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });

    await db.timelineEntry.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        action: 'DELETE_TIMELINE_ENTRY',
        actor: session.email,
        details: id,
      },
    });

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API /api/admin/timeline DELETE Error]:', error);
    return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
  }
}
