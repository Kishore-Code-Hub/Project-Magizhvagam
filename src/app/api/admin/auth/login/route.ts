import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createAdminSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate Limiting: Max 5 login attempts per 15 minutes per IP
    const rateLimit = await checkRateLimit({
      key: `login:${ipAddress}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimit.resetMs / 1000).toString(),
          },
        }
      );
    }

    const { email, password } = await req.json();

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const admin = await db.adminUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // Constant-time compare defense against timing attacks
    const dummyHash = '$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuuuuuuuuuuu';
    const hashToCompare = admin ? admin.passwordHash : dummyHash;
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!admin || !valid) {
      await db.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          actor: email || 'unknown',
          ipAddress,
        },
      });

      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    // Create session & httpOnly cookie
    await createAdminSession(admin.id, admin.email);

    await db.auditLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        actor: admin.email,
        ipAddress,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login route error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
