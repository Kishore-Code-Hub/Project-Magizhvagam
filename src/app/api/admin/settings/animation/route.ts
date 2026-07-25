import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settings = await db.appearanceSettings.findUnique({ where: { id: 'default' } });
    return NextResponse.json({
      loadingDuration: settings?.loadingDuration ?? 5.0,
      enableLoader: settings?.enableLoader ?? true,
      skipLoaderForReturning: settings?.skipLoaderForReturning ?? false,
      enableScrollReveal: settings?.enableScrollReveal ?? true,
      repeatScrollReveal: settings?.repeatScrollReveal ?? false,
      waitForCriticalAssets: (settings as any)?.waitForCriticalAssets ?? true,
      fadeDuration: (settings as any)?.fadeDuration ?? 0.7,
      accessGrantedHoldTime: settings?.accessGrantedHoldTime ?? 2.0,
      welcomeScreenHoldTime: settings?.welcomeScreenHoldTime ?? 2.0,
      bootMsgOffsetX: settings?.bootMsgOffsetX ?? 0,
      bootMsgOffsetY: settings?.bootMsgOffsetY ?? -40,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const loadingDuration = clamp(parseFloat(body.loadingDuration) || 5.0, 0.5, 15.0);
    const accessGrantedHoldTime = clamp(parseFloat(body.accessGrantedHoldTime) || 2.0, 0.5, 10.0);
    const welcomeScreenHoldTime = clamp(parseFloat(body.welcomeScreenHoldTime) || 2.0, 0.5, 10.0);

    const updated = await db.appearanceSettings.upsert({
      where: { id: 'default' },
      update: {
        loadingDuration,
        enableLoader: Boolean(body.enableLoader),
        skipLoaderForReturning: Boolean(body.skipLoaderForReturning),
        enableScrollReveal: Boolean(body.enableScrollReveal),
        repeatScrollReveal: Boolean(body.repeatScrollReveal),
        waitForCriticalAssets: Boolean(body.waitForCriticalAssets),
        fadeDuration: clamp(parseFloat(body.fadeDuration) || 0.7, 0.1, 5.0),
        accessGrantedHoldTime,
        welcomeScreenHoldTime,
        bootMsgOffsetX: clamp(parseInt(body.bootMsgOffsetX) || 0, -200, 200),
        bootMsgOffsetY: clamp(parseInt(body.bootMsgOffsetY) ?? -40, -200, 200),
      },
      create: {
        id: 'default',
        loadingDuration,
        enableLoader: Boolean(body.enableLoader),
        skipLoaderForReturning: Boolean(body.skipLoaderForReturning),
        enableScrollReveal: Boolean(body.enableScrollReveal),
        repeatScrollReveal: Boolean(body.repeatScrollReveal),
        waitForCriticalAssets: Boolean(body.waitForCriticalAssets),
        fadeDuration: clamp(parseFloat(body.fadeDuration) || 0.7, 0.1, 5.0),
        accessGrantedHoldTime,
        welcomeScreenHoldTime,
        bootMsgOffsetX: clamp(parseInt(body.bootMsgOffsetX) || 0, -200, 200),
        bootMsgOffsetY: clamp(parseInt(body.bootMsgOffsetY) ?? -40, -200, 200),
      },
    });

    await db.auditLog.create({
      data: {
        action: 'UPDATE_ANIMATION_SETTINGS',
        actor: session.email,
        details: `Updated animation durations (loading: ${loadingDuration}s, welcome: ${welcomeScreenHoldTime}s)`,
      },
    });

    revalidatePath('/');
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
