import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth-token');

  const { pathname } = request.nextUrl;

  // If user is trying to access the login page but is already authenticated, redirect to home
  if (authToken && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is trying to access any page other than login and is not authenticated, redirect to login
  if (!authToken && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
