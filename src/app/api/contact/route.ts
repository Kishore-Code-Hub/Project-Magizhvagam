import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Basic rate limit check: max 5 messages per hour per IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await db.message.count({
      where: {
        ipAddress,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= 5) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait an hour before submitting another message.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validatedData = contactSchema.parse(body);

    const savedMessage = await db.message.create({
      data: {
        ...validatedData,
        ipAddress,
      },
    });

    // Record Analytics Event
    await db.analyticsLog.create({
      data: {
        eventType: 'MESSAGE_SENT',
        ipAddress,
        path: '/#contact',
      },
    });

    return NextResponse.json({ success: true, id: savedMessage.id }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
