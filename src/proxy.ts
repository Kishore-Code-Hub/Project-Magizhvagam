import { NextRequest, NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
  const response = NextResponse.next();

  // 1. Security Headers Pass (OWASP Mitigations)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // 2. Protect /admin/dashboard
  const url = req.nextUrl.clone();
  if (url.pathname.startsWith('/admin/dashboard')) {
    const token = req.cookies.get('admin_session_token')?.value;
    if (!token) {
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
