import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(2, 'Subject must be at least 2 characters').max(150),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  honeypot: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Honeypot check
    if (body.honeypot) {
      return NextResponse.json({ success: true, message: 'Message received' });
    }

    // 2. Input validation
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 3. Database Persistent Storage
    await db.message.create({
      data: {
        name,
        email,
        subject,
        message,
        ipAddress: ip,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Message delivered & securely stored.',
    });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: 'Server error processing contact request.' },
      { status: 500 }
    );
  }
}
