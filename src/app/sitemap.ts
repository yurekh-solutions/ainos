import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { liveNow } from '@/lib/site-health';
import { SITE_URL } from '@/lib/seo';
import { ainosBlogWhere } from '@/lib/ainos-blog';
import { SEO_SUITES } from '@/lib/seo-catalog';
import { MARKETING_ROUTES } from '@/lib/site-content';

// Rebuilt on request so newly published blog posts appear without a deploy.
export const dynamic = 'force-dynamic';

// Google ignores lastmod values that change on every fetch, so static pages carry
// the date their content last changed. Bump these when the copy is edited.
const MARKETING_UPDATED = new Date('2026-11-28');
const LEGAL_UPDATED = new Date('2026-11-20');

/**
 * One English edition serves every market, so each URL declares itself as the
 * en-IN, en and x-default version instead of competing with a duplicate.
 */
const languages = (path: string) => ({
  languages: { 'en-IN': path, en: path, 'x-default': path },
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: MARKETING_UPDATED, changeFrequency: 'weekly', priority: 1, alternates: languages('/') },
    { url: `${SITE_URL}/features`, lastModified: MARKETING_UPDATED, changeFrequency: 'weekly', priority: 0.9, alternates: languages('/features') },
    ...MARKETING_ROUTES.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: MARKETING_UPDATED,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: languages(route.path),
    })),
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.9, alternates: languages('/blog') },
    { url: `${SITE_URL}/auth/register`, lastModified: MARKETING_UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/auth/signin`, lastModified: MARKETING_UPDATED, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: LEGAL_UPDATED, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const featurePages: MetadataRoute.Sitemap = SEO_SUITES.flatMap(suite => [
    {
      url: `${SITE_URL}/features/${suite.slug}`,
      lastModified: MARKETING_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      alternates: languages(`/features/${suite.slug}`),
    },
    ...suite.tools.map(tool => {
      const path = `/features/${suite.slug}/${tool.slug}`;
      return {
        url: `${SITE_URL}${path}`,
        lastModified: MARKETING_UPDATED,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: languages(path),
      };
    }),
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
      alternates: languages(`/blog/${post.slug}`),
    }));
  } catch (error) {
    console.error('sitemap: blog posts unavailable', error);
  }

  return [...staticPages, ...featurePages, ...blogPages];
}
