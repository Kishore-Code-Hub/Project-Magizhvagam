import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const totalViews = await db.analyticsLog.count({ where: { eventType: 'PAGE_VIEW' } });
    const projectClicks = await db.analyticsLog.count({ where: { eventType: 'PROJECT_CLICK' } });
    const resumeDownloads = await db.analyticsLog.count({ where: { eventType: 'RESUME_DOWNLOAD' } });
    const messagesCount = await db.message.count();

    const recentLogs = await db.analyticsLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      summary: {
        totalViews,
        projectClicks,
        resumeDownloads,
        messagesCount,
      },
      logs: recentLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
