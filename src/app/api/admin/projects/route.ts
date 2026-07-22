import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await db.project.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const created = await db.project.create({
      data: {
        title: body.title,
        description: body.description,
        longDescription: body.longDescription || null,
        image: body.image || '/images/project-placeholder.svg',
        tags: JSON.stringify(body.tags || []),
        githubUrl: body.githubUrl || null,
        liveUrl: body.liveUrl || null,
        featured: body.featured ?? true,
        order: body.order ?? 0,
        published: body.published ?? true,
      },
    });

    await db.auditLog.create({
      data: {
        action: 'CREATE_PROJECT',
        actor: session.email,
        details: `Created project ${created.title}`,
      },
    });

    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await db.project.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      action: 'DELETE_PROJECT',
      actor: session.email,
      details: `Deleted project ID ${id}`,
    },
  });

  return NextResponse.json({ success: true });
}
