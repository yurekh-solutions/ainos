import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

  // Tool-specific route protection mapping
  const toolRouteMap: Record<string, string> = {
    '/marketing/blog': 'autoBlog',
    '/marketing/blog-agent': 'autoBlog',
    '/marketing/email': 'emailMarketing',
    '/finance/invoices': 'invoiceGen',
    '/finance/quotes': 'invoiceGen',
    '/finance/sales-orders': 'invoiceGen',
    '/crm': 'crmAccess',
    '/inventory': 'inventoryMgmt',
    '/hr': 'hrPayroll',
    '/ai-assistant': 'aiAssistant',
    '/website-builder': 'websiteGen',
  };

  // Check if route requires tool access
  for (const [route, toolName] of Object.entries(toolRouteMap)) {
    if (pathname.startsWith(route)) {
      // Fetch company's tool access from database
      try {
        const { prisma } = await import('@/lib/prisma');
        const company = await prisma.company.findUnique({
          where: { id: token.companyId as string },
          select: {
            autoBlog: true,
            invoiceGen: true,
            crmAccess: true,
            inventoryMgmt: true,
            hrPayroll: true,
            emailMarketing: true,
            aiAssistant: true,
            websiteGen: true,
          },
        });

        if (!company || !(company as Record<string, boolean>)[toolName]) {
          // Redirect to billing page with required tool info
          const billingUrl = new URL('/billing', request.url);
          billingUrl.searchParams.set('required_tool', toolName);
          return NextResponse.redirect(billingUrl);
        }
      } catch (error) {
        console.error('Middleware tool check error:', error);
        // On error, allow access (fail-open for now, can change to fail-closed)
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/marketing/:path*',
    '/finance/:path*',
    '/crm/:path*',
    '/inventory/:path*',
    '/hr/:path*',
    '/ai-assistant/:path*',
    '/website-builder/:path*',
  ],
};
