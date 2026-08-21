import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Redirect root path to sign-in page
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/ainos/auth/signin/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
