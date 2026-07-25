import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

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

    const updated = await db.appearanceSettings.upsert({
      where: { id: 'default' },
      update: {
        loadingDuration: parseFloat(body.loadingDuration) || 5.0,
        enableLoader: Boolean(body.enableLoader),
        skipLoaderForReturning: Boolean(body.skipLoaderForReturning),
        enableScrollReveal: Boolean(body.enableScrollReveal),
        repeatScrollReveal: Boolean(body.repeatScrollReveal),
        waitForCriticalAssets: Boolean(body.waitForCriticalAssets),
        fadeDuration: parseFloat(body.fadeDuration) || 0.7,
        accessGrantedHoldTime: parseFloat(body.accessGrantedHoldTime) || 2.0,
        welcomeScreenHoldTime: parseFloat(body.welcomeScreenHoldTime) || 2.0,
        bootMsgOffsetX: parseInt(body.bootMsgOffsetX) || 0,
        bootMsgOffsetY: parseInt(body.bootMsgOffsetY) ?? -40,
      },
      create: {
        id: 'default',
        loadingDuration: parseFloat(body.loadingDuration) || 5.0,
        enableLoader: Boolean(body.enableLoader),
        skipLoaderForReturning: Boolean(body.skipLoaderForReturning),
        enableScrollReveal: Boolean(body.enableScrollReveal),
        repeatScrollReveal: Boolean(body.repeatScrollReveal),
        waitForCriticalAssets: Boolean(body.waitForCriticalAssets),
        fadeDuration: parseFloat(body.fadeDuration) || 0.7,
        accessGrantedHoldTime: parseFloat(body.accessGrantedHoldTime) || 2.0,
        welcomeScreenHoldTime: parseFloat(body.welcomeScreenHoldTime) || 2.0,
        bootMsgOffsetX: parseInt(body.bootMsgOffsetX) || 0,
        bootMsgOffsetY: parseInt(body.bootMsgOffsetY) ?? -40,
      },
    });

    revalidatePath('/');
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
