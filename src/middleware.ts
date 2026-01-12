import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('Middleware checking:', pathname);

  // 1. Define paths that are always public (skip middleware)
  // Note: /api/auth is public. /api/admin is protected.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/auth') || // Allow auth API
    pathname.startsWith('/api/public') || // Allow public API if any
    pathname === '/admin/login' ||
    pathname === '/login' ||
    pathname === '/' ||
    pathname.startsWith('/books') ||
    pathname.startsWith('/ebooks') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/recruitment')
  ) {
    return NextResponse.next();
  }

  // 2. Protect Admin Routes (Pages and APIs)
  // This covers /admin/* and /api/admin/* (since /api was removed from skip list above)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Check for refresh_token cookie which indicates an active session
    const hasToken = request.cookies.has('refresh_token');

    if (!hasToken) {
      // For API requests, return 401 instead of redirecting
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // For Page requests, redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/public|_next/static|_next/image|favicon.ico).*)',
  ],
};
