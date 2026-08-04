import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate Limiting: Max 5 attempts per 5 minutes per IP
    const rateLimit = await checkRateLimit({
      key: `gateway_verify:${ipAddress}`,
      limit: 5,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Gateway verification locked temporarily.' },
        {
          status: 429,
          headers: { 'Retry-After': Math.ceil(rateLimit.resetMs / 1000).toString() },
        }
      );
    }

    const { gatewayKey } = await req.json();
    const expectedKey = process.env.ADMIN_SECURITY_GATEWAY_KEY || 'CYBER_GATEWAY_2026';

    if (!gatewayKey || typeof gatewayKey !== 'string') {
      return NextResponse.json({ error: 'Security Access Key is required.' }, { status: 400 });
    }

    // Timing-attack safe string comparison
    const inputBuf = Buffer.from(gatewayKey.trim());
    const expectedBuf = Buffer.from(expectedKey.trim());
    const isMatch = inputBuf.length === expectedBuf.length && crypto.timingSafeEqual(inputBuf, expectedBuf);

    if (!isMatch) {
      await db.auditLog.create({
        data: {
          action: 'GATEWAY_KEY_REJECTED',
          actor: 'anonymous',
          ipAddress,
        },
      });

      return NextResponse.json(
        { error: 'UNAUTHORIZED: Security Access Key rejected. Incident logged.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ACCESS GRANTED: Security Gateway Unlocked.',
    });
  } catch (err: any) {
    console.error('[Gateway Verify Error]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
