import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auditLogs = await db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const activeSessions = await db.session.findMany({
      include: {
        user: {
          select: { email: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      auditLogs,
      activeSessions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const terminateAll = searchParams.get('all') === 'true';

    if (terminateAll) {
      await db.session.deleteMany({});
      return NextResponse.json({ success: true, message: 'All active sessions terminated.' });
    }

    if (sessionId) {
      await db.session.delete({ where: { id: sessionId } });
      return NextResponse.json({ success: true, message: 'Session terminated.' });
    }

    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
