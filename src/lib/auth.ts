import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';
import crypto from 'crypto';

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-cyber-key-change-this-in-production-2026'
);

const COOKIE_NAME = 'admin_session_token';

export async function createAdminSession(userId: string, email: string) {
  const token = await new SignJWT({ userId, email, role: 'ADMIN' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET_KEY);

  // Store hashed session token in DB
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const verified = await jwtVerify(token, JWT_SECRET_KEY);
    const payload = verified.payload as { userId: string; email: string };

    // Verify session still exists in DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await db.session.findUnique({
      where: { tokenHash },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

export async function destroyAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await db.session.deleteMany({ where: { tokenHash } });
    }

    cookieStore.delete(COOKIE_NAME);
  } catch (err) {
    console.error('Logout error:', err);
  }
}
