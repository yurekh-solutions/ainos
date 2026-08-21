import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Check if user is authenticated
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: 'next-auth.session-token'
  });
  
  // Only redirect to sign-in if user is NOT authenticated
  if (request.nextUrl.pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/ainos/auth/signin/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
