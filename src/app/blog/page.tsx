import { prisma } from '@/lib/prisma';
import { liveNow } from '@/lib/site-health';
import { ainosBlogWhere } from '@/lib/ainos-blog';
import { SITE_URL } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import BlogListClient, { type BlogPost } from './BlogListClient';

// Rendered on the server so every guide is a real link in the HTML that crawlers
// and answer engines can follow without executing JavaScript.
export const dynamic = 'force-dynamic';

export default async function PublicBlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'published', AND: [ainosBlogWhere, liveNow()] },
    orderBy: { publishedAt: 'desc' },
    take: 60,
    select: {
      id: true, title: true, slug: true, content: true, excerpt: true,
      featuredImage: true, category: true, publishedAt: true, tags: true, createdAt: true,
    },
  });

  const items = JSON.parse(JSON.stringify(posts)) as BlogPost[];

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'AINOS Blog',
    url: `${SITE_URL}/blog`,
    description:
      'Practical guides from the AINOS team on GST billing, CRM, SEO, AEO and AI automation for small and growing businesses in India.',
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#organization` },
    blogPost: items.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.publishedAt || post.createdAt,
      articleSection: post.category || 'General',
    })),
  };

  return (
    <>
      <JsonLd data={blogJsonLd} />
      <BlogListClient posts={items} />
    </>
  );
}
