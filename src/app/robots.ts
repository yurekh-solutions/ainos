import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Everything behind sign-in is useless to a crawler (it only sees a redirect to
// /auth/signin), so the app surface is disallowed and crawl budget goes to the
// public marketing, feature and blog pages.
const PRIVATE_PREFIXES = [
  '/api/', '/dashboard', '/onboarding', '/test-auth', '/qa-pdf', '/admin', '/settings', '/company',
  '/billing', '/tools', '/ai/', '/crm', '/inventory', '/manufacturing', '/hr', '/planning', '/support',
  '/projects', '/calendar', '/team', '/automations', '/reports', '/approvals', '/compliance',
  '/invoices', '/customers', '/products', '/finance', '/marketing', '/ecommerce', '/pos',
  '/operations', '/rental', '/services', '/websites', '/auth/reset-password', '/auth/error', '/e/', '/s/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/blog-rss', '/api/blog-sitemap'],
        disallow: PRIVATE_PREFIXES,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
