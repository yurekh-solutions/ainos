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

  return {
    title: `${post.title} | AINOS Blog`,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      images: post.featuredImage ? [{ url: post.featuredImage }] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      tags: Array.isArray(post.tags) ? post.tags as string[] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || post.title,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: 'published' },
  });

  if (!post) notFound();

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

  return <BlogArticleClient post={JSON.parse(JSON.stringify(post))} relatedPosts={JSON.parse(JSON.stringify(relatedPosts))} />;
}
