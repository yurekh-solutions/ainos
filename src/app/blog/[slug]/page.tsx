import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import { liveNow } from '@/lib/site-health';
import { ainosBlogWhere, isAinosPost, seoTitleFor } from '@/lib/ainos-blog';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/JsonLd';
import BlogArticleClient from './BlogArticleClient';

interface Props {
  params: Promise<{ slug: string }>;
}

/** Plain-text summary for meta tags: strips markdown and cuts on a word boundary. */
function summarize(text: string, max = 158): string {
  const plain = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, plain.lastIndexOf(' ', max - 1) || max - 1)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug, status: 'published' } });
  if (!post) return { title: 'Not Found' };

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const contentPreview = summarize(post.excerpt || post.content || post.title);
  // Search results cut titles at roughly 60 characters, so only add the brand when it fits.
  const searchTitle = seoTitleFor(post.slug, post.title);
  const branded = `${searchTitle} | AINOS Blog`;

  return {
    // Absolute: skip the root "| AINOS" template, the brand is handled above.
    title: { absolute: branded.length <= 60 ? branded : searchTitle },
    description: contentPreview,
    keywords: Array.isArray(post.tags) ? post.tags.join(', ') : '',
    authors: [{ name: post.authorName || post.author || 'AINOS' }],
    openGraph: {
      title: post.title,
      description: contentPreview,
      url: postUrl,
      siteName: 'AINOS Blog',
      images: post.featuredImage ? [{ url: post.featuredImage, width: 1200, height: 630 }] : ['/opengraph-image'],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: (post.updatedAt || post.createdAt)?.toISOString(),
      tags: Array.isArray(post.tags) ? post.tags as string[] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: contentPreview,
      images: post.featuredImage ? [post.featuredImage] : ['/opengraph-image'],
    },
    alternates: {
      canonical: postUrl,
    },
    // Customer-site posts live on the customer's own site; this copy exists for previews and shares only.
    ...(isAinosPost(post) ? {} : { robots: { index: false, follow: true } }),
  };
}

export const dynamic = 'force-dynamic';

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'published' },
    include: {
      schedules: {
        include: {
          subscription: {
            include: {
              connectedWebsite: true,
            },
          },
        },
      },
    },
  });

  if (!post) notFound();

  const website = post.schedules?.[0]?.subscription?.connectedWebsite;
  const siteUrl = SITE_URL;
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  // Extract FAQ questions from content for FAQPage schema
  const faqItems: { q: string; a: string }[] = [];
  if (post.content) {
    const faqSection = post.content.match(/(?:FAQ|Frequently Asked Questions)[\s\S]*?(?=\n## |$)/i);
    if (faqSection) {
      const questions = faqSection[0].match(/###\s+(.+?)\n([\s\S]*?)(?=###|$)/g);
      if (questions) {
        for (const qBlock of questions) {
          const lines = qBlock.trim().split('\n');
          const q = lines[0].replace(/^###\s+/, '').trim();
          const a = lines.slice(1).join(' ').replace(/\*\*/g, '').trim().substring(0, 300);
          if (q && a) faqItems.push({ q, a });
        }
      }
    }
  }

  // JSON-LD Schema.org structured data for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: summarize(post.excerpt || post.content || post.title),
    image: post.featuredImage ? [post.featuredImage] : [],
    datePublished: post.publishedAt?.toISOString() || post.createdAt?.toISOString(),
    dateModified: (post.updatedAt || post.createdAt)?.toISOString(),
    author: (post as Record<string, unknown>).authorName ? {
      '@type': 'Person',
      name: (post as Record<string, unknown>).authorName as string,
      image: (post as Record<string, unknown>).authorImage ? [(post as Record<string, unknown>).authorImage as string] : [],
      description: ((post as Record<string, unknown>).authorBio as string) || '',
    } : {
      '@type': 'Organization',
      name: website?.name || post.author || 'AINOS',
      url: website?.url || siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: website?.name || 'AINOS',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    keywords: Array.isArray(post.tags) ? post.tags.join(', ') : '',
    articleSection: post.category || 'General',
    wordCount: (post.content || '').split(/\s+/).length,
    inLanguage: 'en-IN',
  };

  // Related posts stay within the same publisher. AINOS articles link to each other across
  // categories; customer posts stay within their own company and category.
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      status: 'published',
      ...liveNow(),
      id: { not: post.id },
      ...(isAinosPost(post)
        ? ainosBlogWhere
        : { companyId: post.companyId, ...(post.category ? { category: post.category } : {}) }),
    },
    select: {
      id: true, title: true, slug: true, excerpt: true,
      featuredImage: true, category: true, publishedAt: true, tags: true,
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  // FAQPage schema for rich snippets
  const faqJsonLd = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  return (
    <>
      <JsonLd data={jsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Blog', url: `${siteUrl}/blog` },
          { name: post.title, url: postUrl },
        ])}
      />
      <BlogArticleClient post={JSON.parse(JSON.stringify(post))} relatedPosts={JSON.parse(JSON.stringify(relatedPosts))} />
    </>
  );
}
