import { db } from './db';

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

export async function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  try {
    const bucket = await db.rateLimitBucket.findUnique({
      where: { key },
    });

    if (!bucket || bucket.expiresAt < now) {
      await db.rateLimitBucket.upsert({
        where: { key },
        update: {
          count: 1,
          windowStart: now,
          expiresAt,
        },
        create: {
          key,
          count: 1,
          windowStart: now,
          expiresAt,
        },
      });

      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetMs: windowMs,
      };
    }

    if (bucket.count >= limit) {
      const resetMs = Math.max(0, bucket.expiresAt.getTime() - now.getTime());
      return {
        success: false,
        limit,
        remaining: 0,
        resetMs,
      };
    }

    const updated = await db.rateLimitBucket.update({
      where: { key },
      data: {
        count: { increment: 1 },
      },
    });

    const resetMs = Math.max(0, bucket.expiresAt.getTime() - now.getTime());
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - updated.count),
      resetMs,
    };
  } catch (error) {
    console.error('Rate limiting database error:', error);
    // Fallback to allow request on DB failure to avoid breaking app availability
    return {
      success: true,
      limit,
      remaining: 1,
      resetMs: windowMs,
    };
  }
}
