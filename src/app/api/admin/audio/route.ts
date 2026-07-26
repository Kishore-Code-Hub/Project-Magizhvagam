import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEFAULT_AUDIO_SETTINGS = {
  id: 'default',
  trackTitle: 'Cyber Ambient Soundtrack',
  trackUrl: '/uploads/music/webmusic.mp3',
  enabled: true,
  autoplay: true,
  loop: true,
  volume: 50,
  fadeInDuration: 1.5,
  fadeOutDuration: 1.5,
  defaultMute: false,
};

export async function GET() {
  try {
    const audioDb = (db as any).audioSettings;
    if (!audioDb) {
      return NextResponse.json(DEFAULT_AUDIO_SETTINGS);
    }

    let settings = await audioDb.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await audioDb.create({
        data: DEFAULT_AUDIO_SETTINGS,
      });
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error('API GET /api/admin/audio error:', err);
    return NextResponse.json(DEFAULT_AUDIO_SETTINGS);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const audioDb = (db as any).audioSettings;

    if (!audioDb) {
      return NextResponse.json(
        { error: 'AudioSettings database model not ready.' },
        { status: 500 }
      );
    }

    const updated = await audioDb.upsert({
      where: { id: 'default' },
      update: {
        trackTitle: body.trackTitle ?? DEFAULT_AUDIO_SETTINGS.trackTitle,
        trackUrl: body.trackUrl ?? DEFAULT_AUDIO_SETTINGS.trackUrl,
        enabled: typeof body.enabled === 'boolean' ? body.enabled : true,
        autoplay: typeof body.autoplay === 'boolean' ? body.autoplay : true,
        loop: typeof body.loop === 'boolean' ? body.loop : true,
        volume: typeof body.volume === 'number' ? Math.min(Math.max(body.volume, 0), 100) : 50,
        fadeInDuration: typeof body.fadeInDuration === 'number' ? body.fadeInDuration : 1.5,
        fadeOutDuration: typeof body.fadeOutDuration === 'number' ? body.fadeOutDuration : 1.5,
        defaultMute: typeof body.defaultMute === 'boolean' ? body.defaultMute : false,
      },
      create: {
        id: 'default',
        trackTitle: body.trackTitle || DEFAULT_AUDIO_SETTINGS.trackTitle,
        trackUrl: body.trackUrl || DEFAULT_AUDIO_SETTINGS.trackUrl,
        enabled: typeof body.enabled === 'boolean' ? body.enabled : true,
        autoplay: typeof body.autoplay === 'boolean' ? body.autoplay : true,
        loop: typeof body.loop === 'boolean' ? body.loop : true,
        volume: typeof body.volume === 'number' ? Math.min(Math.max(body.volume, 0), 100) : 50,
        fadeInDuration: typeof body.fadeInDuration === 'number' ? body.fadeInDuration : 1.5,
        fadeOutDuration: typeof body.fadeOutDuration === 'number' ? body.fadeOutDuration : 1.5,
        defaultMute: typeof body.defaultMute === 'boolean' ? body.defaultMute : false,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('API PUT /api/admin/audio error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update audio settings.' },
      { status: 500 }
    );
  }
}
