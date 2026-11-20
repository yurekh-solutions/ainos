import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { liveNow } from '@/lib/site-health';
import { SITE_URL } from '@/lib/seo';
import { ainosBlogWhere } from '@/lib/ainos-blog';
import { SEO_SUITES } from '@/lib/seo-catalog';

// Rebuilt on request so newly published blog posts appear without a deploy.
export const dynamic = 'force-dynamic';

// Google ignores lastmod values that change on every fetch, so static pages carry
// the date their content last changed. Bump these when the copy is edited.
const MARKETING_UPDATED = new Date('2026-11-19');
const LEGAL_UPDATED = new Date('2026-11-20');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: MARKETING_UPDATED, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/features`, lastModified: MARKETING_UPDATED, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/auth/register`, lastModified: MARKETING_UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/auth/signin`, lastModified: MARKETING_UPDATED, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const featurePages: MetadataRoute.Sitemap = SEO_SUITES.flatMap(suite => [
    { url: `${SITE_URL}/features/${suite.slug}`, lastModified: MARKETING_UPDATED, changeFrequency: 'monthly' as const, priority: 0.8 },
    ...suite.tools.map(tool => ({
      url: `${SITE_URL}/features/${suite.slug}/${tool.slug}`,
      lastModified: MARKETING_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]);

  // A database blip must not take the whole sitemap down with it; the static and
  // feature URLs are still worth serving on their own.
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published', ...ainosBlogWhere, ...liveNow() },
      select: { slug: true, publishedAt: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
    });
    blogPages = posts.map(post => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('sitemap: blog posts unavailable', error);
  }

  return [...staticPages, ...featurePages, ...blogPages];
}
