import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const admin = await db.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      // Record failed audit log
      await db.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          actor: email,
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        },
      });

      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    // Create session & httpOnly cookie
    await createAdminSession(admin.id, admin.email);

    // Record successful audit log
    await db.auditLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        actor: admin.email,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login route error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
