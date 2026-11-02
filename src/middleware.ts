import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { verticalForPath } from '@/lib/verticals';

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
    try {
      const { canAccessVertical } = await import('@/lib/access');
      const allowed = await canAccessVertical(token.email as string, vertical.key);
      if (!allowed) {
        // Send the user back to the shared dashboard with a reason flag.
        const dashUrl = new URL('/dashboard', request.url);
        dashUrl.searchParams.set('no_access', vertical.key);
        return NextResponse.redirect(dashUrl);
      }
    } catch (error) {
      console.error('Middleware vertical access check error:', error);
      // On error, allow access (fail-open for now, can change to fail-closed)
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
