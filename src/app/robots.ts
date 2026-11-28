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
  // A customer's pay link is a private URL even though it needs no login: the
  // token in it is the whole credential, so it must never reach an index.
  '/pay/',
];

// Answer engines that power AI Overviews, ChatGPT search, Perplexity and Claude.
// They get the same public surface as normal crawlers, so AINOS guides can be
// quoted with a citation instead of being summarised from a competitor's page.
const AI_ANSWER_ENGINES = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'Google-Extended',
  'Bingbot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/blog-rss', '/api/blog-sitemap', '/llms.txt', '/llms-full.txt'],
        disallow: PRIVATE_PREFIXES,
      },
      // Answer engines (AI Overviews, ChatGPT search, Perplexity, Claude) are
      // welcome on the public pages so AINOS guides can be quoted with a citation.
      ...AI_ANSWER_ENGINES.map((userAgent) => ({
        userAgent,
        allow: ['/', '/api/blog-rss', '/api/blog-sitemap', '/llms.txt', '/llms-full.txt'],
        disallow: PRIVATE_PREFIXES,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
