import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

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
        { status: 429, headers: { 'Retry-After': '3600' } }
      );
    }

    const body = await req.json();
    const validatedData = contactSchema.parse(body);

    const sanitizedName = sanitizeText(validatedData.name);
    const sanitizedSubject = sanitizeText(validatedData.subject);
    const sanitizedMessage = sanitizeText(validatedData.message);

    const savedMessage = await db.message.create({
      data: {
        name: sanitizedName,
        email: validatedData.email.trim().toLowerCase(),
        subject: sanitizedSubject,
        message: sanitizedMessage,
        ipAddress,
        userAgent: req.headers.get('user-agent') || undefined,
        country: req.headers.get('cf-ipcountry') || undefined,
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

    // Automated SMTP Email Notification Dispatch
    try {
      const smtp = await db.sMTPSettings.findUnique({ where: { id: 'default' } });
      if (smtp && smtp.enabled && smtp.smtpUser) {
        const { decryptText } = await import('@/lib/crypto');
        const nodemailer = (await import('nodemailer')).default;
        const decryptedPass = decryptText(smtp.encryptedSmtpPass);

        const host = smtp.smtpHost?.includes('@') ? 'smtp.gmail.com' : (smtp.smtpHost || 'smtp.gmail.com');
        const port = smtp.smtpPort || 587;

        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user: smtp.smtpUser, pass: decryptedPass },
        });

        await transporter.sendMail({
          from: `"${validatedData.name}" <${smtp.senderEmail}>`,
          to: smtp.recipientEmail,
          replyTo: validatedData.email,
          subject: `📩 New Contact Form Message: ${validatedData.subject}`,
          html: `
            <div style="font-family: monospace; background: #050505; color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #00ff66;">
              <h2 style="color: #00ff66;">[NEW PORTFOLIO INQUIRY]</h2>
              <p><strong>Name:</strong> ${validatedData.name}</p>
              <p><strong>Email:</strong> ${validatedData.email}</p>
              <p><strong>Subject:</strong> ${validatedData.subject}</p>
              <hr style="border-color: rgba(255,255,255,0.1);" />
              <p style="white-space: pre-wrap; color: #dddddd;">${validatedData.message}</p>
              <hr style="border-color: rgba(255,255,255,0.1);" />
              <p style="font-size: 11px; color: #888888;">IP: ${ipAddress} | Date: ${new Date().toISOString()}</p>
            </div>
          `,
        });
      }
    } catch (mailErr) {
      console.error('Contact email dispatch failed:', mailErr);
    }

    return NextResponse.json({ success: true, id: savedMessage.id }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
