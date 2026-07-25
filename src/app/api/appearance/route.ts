import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.appearanceSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await db.appearanceSettings.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
