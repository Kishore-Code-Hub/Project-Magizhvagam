import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const skills = await db.skill.findMany({
      orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(skills);
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
    const skill = await db.skill.create({
      data: body,
    });

    await db.auditLog.create({
      data: {
        action: 'CREATE_SKILL',
        actor: session.email,
        details: skill.name,
      },
    });

    revalidatePath('/');
    return NextResponse.json(skill, { status: 201 });
  } catch (error: any) {
    console.error('[API /api/admin/skills POST Error]:', error);
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
    const updated = await db.skill.update({
      where: { id },
      data,
    });

    revalidatePath('/');
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[API /api/admin/skills PUT Error]:', error);
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

    if (!id) return NextResponse.json({ error: 'Missing skill ID' }, { status: 400 });

    await db.skill.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        action: 'DELETE_SKILL',
        actor: session.email,
        details: id,
      },
    });

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API /api/admin/skills DELETE Error]:', error);
    return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
  }
}
