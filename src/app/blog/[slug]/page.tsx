import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlogArticleClient from './BlogArticleClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug, status: 'published' } });
  if (!post) return { title: 'Not Found' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ainos-ywu0.onrender.com';
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const contentPreview = post.excerpt || post.content?.substring(0, 160) || post.title;

  return {
    title: `${post.title} | AINOS Blog`,
    description: contentPreview,
    keywords: Array.isArray(post.tags) ? post.tags.join(', ') : '',
    authors: [{ name: 'AINOS AI Blog Agent' }],
    openGraph: {
      title: post.title,
      description: contentPreview,
      url: postUrl,
      siteName: 'AINOS Blog',
      images: post.featuredImage ? [{ url: post.featuredImage, width: 1200, height: 630 }] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.createdAt?.toISOString(),
      tags: Array.isArray(post.tags) ? post.tags as string[] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: contentPreview,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
    alternates: {
      canonical: postUrl,
    },
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ainos-ywu0.onrender.com';
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  // JSON-LD Schema.org structured data for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.content?.substring(0, 160) || post.title,
    image: post.featuredImage ? [post.featuredImage] : [],
    datePublished: post.publishedAt?.toISOString() || post.createdAt?.toISOString(),
    dateModified: post.createdAt?.toISOString(),
    author: {
      '@type': 'Organization',
      name: website?.name || 'AINOS AI Blog Agent',
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
    inLanguage: 'en-US',
  };

  // Get related posts (same category, excluding current)
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      status: 'published',
      id: { not: post.id },
      ...(post.category ? { category: post.category } : {}),
    },
    select: {
      id: true, title: true, slug: true, excerpt: true,
      featuredImage: true, category: true, publishedAt: true, tags: true,
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogArticleClient post={JSON.parse(JSON.stringify(post))} relatedPosts={JSON.parse(JSON.stringify(relatedPosts))} />
    </>
  );
}
