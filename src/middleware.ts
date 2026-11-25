import { NextResponse, type NextRequest } from 'next/server';

const REFRESH_COOKIE_NAME = 'bhs_refresh_token';
const PROTECTED_PREFIXES = ['/admin', '/teacher', '/parent', '/student'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const hasRefreshCookie = Boolean(request.cookies.get(REFRESH_COOKIE_NAME)?.value);

  if (!hasRefreshCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/parent/:path*', '/student/:path*'],
};
