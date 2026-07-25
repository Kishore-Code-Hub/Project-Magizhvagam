import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const messages = await db.message.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(messages);
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

  return NextResponse.json({ success: true });
}
