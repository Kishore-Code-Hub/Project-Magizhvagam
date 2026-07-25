import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const startTime = Date.now();
  let dbStatus = 'Disconnected';
  let dbLatency = 0;
  let mediaCount = 0;
  let auditCount = 0;
  let failedSaves = 0;
  let lastSave: string | null = null;
  let appearance: any = null;

  try {
    const startDb = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - startDb;
    dbStatus = 'Connected';

    mediaCount = await db.mediaAsset.count();
    auditCount = await db.auditLog.count();

    const lastLog = await db.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (lastLog) {
      lastSave = lastLog.createdAt.toISOString();
    }

    appearance = await db.appearanceSettings.findUnique({ where: { id: 'default' } });
  } catch (err: any) {
    dbStatus = `Error: ${err.message}`;
  }

  const responseTime = Date.now() - startTime;

  return NextResponse.json({
    status: 'Healthy',
    environment: process.env.NODE_ENV || 'development',
    dbStatus,
    dbLatency: `${dbLatency}ms`,
    responseTime: `${responseTime}ms`,
    mediaCount,
    auditLogsCount: auditCount,
    failedSavesCount: failedSaves,
    lastSave,
    currentTheme: appearance?.themePreset || 'cyber-green',
    matrixEnabled: appearance?.enableParticles ?? true,
    prismaStatus: 'Initialized',
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
}
