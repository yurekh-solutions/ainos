import NextAuth from 'next-auth';
import type { NextRequest } from 'next/server';
import { authOptions } from './auth-options';
import { pinNextAuthOrigin } from '@/lib/auth-origin';

const handler = NextAuth(authOptions);

// NextAuth builds every redirect it returns (Google callback, error page,
// secure-cookie prefix) from NEXTAUTH_URL before the handler runs, so the
// origin has to be corrected first. pinNextAuthOrigin() only acts when the
// configured value is a loopback URL answering a public request.
type RouteContext = { params: Promise<{ nextauth: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  pinNextAuthOrigin(request.headers);
  return handler(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  pinNextAuthOrigin(request.headers);
  return handler(request, context);
}
