import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

  const [total, messages] = await Promise.all([
    db.message.count(),
    db.message.findMany({
      skip,
      take: Math.max(1, limit),
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    messages,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / Math.max(1, limit)),
    },
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { id, isRead, isStarred, isArchived, replyMessage } = body;

    if (!id) return NextResponse.json({ error: 'Message ID required' }, { status: 400 });

    const updated = await db.message.update({
      where: { id },
      data: {
        ...(typeof isRead === 'boolean' && { isRead }),
        ...(typeof isStarred === 'boolean' && { isStarred }),
        ...(typeof isArchived === 'boolean' && { isArchived }),
        ...(replyMessage && { replyMessage, repliedAt: new Date() }),
      },
    });

    await db.auditLog.create({
      data: {
        action: 'UPDATE_MESSAGE',
        actor: session.email,
        details: `Updated message ID: ${id}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await db.message.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      action: 'DELETE_MESSAGE',
      actor: session.email,
      details: `Deleted message ID: ${id}`,
    },
  });

  return NextResponse.json({ success: true });
}
