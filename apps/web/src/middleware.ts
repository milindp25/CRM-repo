import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for Next.js Frontend
 * Note: Authentication is now handled by the standalone NestJS API
 * This middleware only handles client-side route protection
 */

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
];

const PUBLIC_PREFIXES = [
  '/_next',
  '/api', // Will be removed once we migrate fully to standalone API
  '/favicon.ico',
  '/images',
  '/fonts',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${request.method} ${pathname}`);
  }

  // Allow all public paths
  if (PUBLIC_PATHS.includes(pathname)) {  
    return NextResponse.next();
  }

  // Allow all public prefixes
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Check for session: `has_session` flag cookie (set by frontend)
  // or `access_token` httpOnly cookie (set by API)
  const hasSession = request.cookies.has('has_session') || request.cookies.has('access_token');

  if (!hasSession) {
    // No token - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists - allow access
  // The React components will validate with the API
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
