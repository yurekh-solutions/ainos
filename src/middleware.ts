import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { verticalForPath } from '@/lib/verticals';

// Short-lived in-memory cache of the last GOOD vertical-access decision, keyed by
// email + vertical. It lets the access check fail CLOSED on an error without
// locking everyone out during a transient DB/dependency blip: on error we honor a
// fresh cached decision if we have one, otherwise we deny. Node runtime keeps this
// Map across requests within the same server process.
const ACCESS_CACHE_TTL_MS = 60_000;
const ACCESS_CACHE_MAX = 5000;
const accessCache = new Map<string, { allowed: boolean; ts: number }>();

function cachedAllow(cacheKey: string): boolean | null {
  const hit = accessCache.get(cacheKey);
  if (!hit || Date.now() - hit.ts >= ACCESS_CACHE_TTL_MS) return null;
  return hit.allowed;
}

function rememberAccess(cacheKey: string, allowed: boolean): void {
  if (accessCache.size >= ACCESS_CACHE_MAX) accessCache.clear();
  accessCache.set(cacheKey, { allowed, ts: Date.now() });
}

function denyToVertical(request: NextRequest, verticalKey: string): NextResponse {
  const dashUrl = new URL('/dashboard', request.url);
  dashUrl.searchParams.set('no_access', verticalKey);
  return NextResponse.redirect(dashUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (no auth required)
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/register',
    '/auth/register-company',
    '/error',
    '/billing',
    '/pricing',
    '/api/auth',
    '/api/billing',
  ];

  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check authentication
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // Redirect to sign-in page
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check if user has companyId (Google OAuth users might not have one)
  if (!token.companyId) {
    return NextResponse.redirect(new URL('/auth/setup-company', request.url));
  }

  // Vertical workspace protection: every route owned by a vertical
  // requires the two-layer access (company ∩ user grants) from lib/access.
  const vertical = verticalForPath(pathname);
  if (vertical) {
    const email = token.email as string;
    const cacheKey = `${email}:${vertical.key}`;
    try {
      const { canAccessVertical } = await import('@/lib/access');
      const allowed = await canAccessVertical(email, vertical.key);
      rememberAccess(cacheKey, allowed);
      if (!allowed) {
        // Send the user back to the shared dashboard with a reason flag.
        return denyToVertical(request, vertical.key);
      }
    } catch (error) {
      console.error('Middleware vertical access check error:', error);
      // Fail-closed: deny unless a fresh cached decision says this user was
      // allowed, so a transient dependency blip does not lock out active users
      // but an unknown decision never silently grants access.
      const lastKnown = cachedAllow(cacheKey);
      if (lastKnown !== true) {
        return denyToVertical(request, vertical.key);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/crm/:path*',
    '/inventory/:path*',
    '/manufacturing/:path*',
    '/hr/:path*',
    '/planning/:path*',
    '/support/:path*',
    '/projects/:path*',
    '/calendar/:path*',
    '/team/:path*',
    '/automations/:path*',
    '/reports/:path*',
    '/approvals/:path*',
    '/compliance/:path*',
    '/invoices/:path*',
    '/customers/:path*',
    '/products/:path*',
    '/finance/:path*',
    '/marketing/:path*',
    '/ecommerce/:path*',
    '/pos/:path*',
    '/operations/:path*',
    '/rental/:path*',
  ],
};
