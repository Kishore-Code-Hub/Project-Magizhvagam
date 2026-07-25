import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-cyber-key-change-this-in-production-2026'
);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();

  // OWASP Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), display-capture=()'
  );
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https:;"
  );

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // CSRF Origin & Method Protection on Mutating Admin API Routes
  if (pathname.startsWith('/api/admin') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: 'Forbidden: CSRF validation failed' }, { status: 403 });
      }
    }
  }

  // Protect Admin CMS Routes (/admin/* except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('admin_session_token')?.value;

    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, JWT_SECRET_KEY);
    } catch {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete('admin_session_token');
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
