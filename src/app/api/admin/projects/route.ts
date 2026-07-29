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
        image: body.image || '/hero-hacker.png',
        gallery: normalizeJsonField(body.gallery, []),
        videoUrl: body.videoUrl || null,
        githubUrl: body.githubUrl || null,
        liveUrl: body.liveUrl || null,
        documentationUrl: body.documentationUrl || null,
        architectureDiagram: body.architectureDiagram || null,
        features: normalizeJsonField(body.features, []),
        challenges: body.challenges || null,
        solutions: body.solutions || null,
        tags: normalizeJsonField(body.tags, []),
        category: body.category || 'Web Engineering',
        status: body.status || 'Completed',
        metrics: normalizeJsonField(body.metrics, {}),
        featured: body.featured ?? true,
        order: body.order ?? 0,
        published: body.published ?? true,
        seoSlug: body.seoSlug || null,
      },
    });

    await db.auditLog.create({
      data: {
        action: 'CREATE_PROJECT',
        actor: session.email,
        details: `Created project ${created.title}`,
      },
    });

    revalidatePath('/');
    return NextResponse.json(created);
  } catch (err: any) {
    console.error('[API /api/admin/projects POST Error]:', err);
    return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, ...body } = await req.json();

    if (!id) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.longDescription !== undefined) updateData.longDescription = body.longDescription;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.gallery !== undefined) updateData.gallery = normalizeJsonField(body.gallery, []);
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
    if (body.githubUrl !== undefined) updateData.githubUrl = body.githubUrl;
    if (body.liveUrl !== undefined) updateData.liveUrl = body.liveUrl;
    if (body.features !== undefined) updateData.features = normalizeJsonField(body.features, []);
    if (body.challenges !== undefined) updateData.challenges = body.challenges;
    if (body.solutions !== undefined) updateData.solutions = body.solutions;
    if (body.tags !== undefined) updateData.tags = normalizeJsonField(body.tags, []);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.published !== undefined) updateData.published = body.published;

    const updated = await db.project.update({
      where: { id },
      data: updateData,
    });

    await db.auditLog.create({
      data: {
        action: 'UPDATE_PROJECT',
        actor: session.email,
        details: `Updated project ${updated.title}`,
      },
    });

    revalidatePath('/');
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[API /api/admin/projects PUT Error]:', err);
    return NextResponse.json({ error: 'Failed to update project.' }, { status: 500 });
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

  revalidatePath('/');
  return NextResponse.json({ success: true });
}
