import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const limit = parseInt(searchParams.get('limit') || '3');

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    // Get current post to exclude it
    const currentPost = await prisma.blogPost.findFirst({
      where: { slug, status: 'published' },
      select: { id: true },
    });

    // Build where clause for related posts
    const where: Record<string, unknown> = {
      status: 'published',
      slug: { not: slug },
    };

    // Prefer same category
    if (category) {
      where.category = category;
    }

    // If no category match, try tag overlap
    const categoryPosts = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        category: true,
        tags: true,
        publishedAt: true,
      },
    });

    // If we have enough from category, return them
    if (categoryPosts.length >= limit) {
      return NextResponse.json({ posts: categoryPosts });
    }

    // Otherwise, supplement with tag-matching posts
    if (tags.length > 0) {
      const tagWhere: Record<string, unknown> = {
        status: 'published',
        slug: { not: slug },
        id: { notIn: categoryPosts.map(p => p.id) },
        tags: { hasSome: tags },
      };

      const tagPosts = await prisma.blogPost.findMany({
        where: tagWhere,
        orderBy: { publishedAt: 'desc' },
        take: limit - categoryPosts.length,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          category: true,
          tags: true,
          publishedAt: true,
        },
      });

      return NextResponse.json({ posts: [...categoryPosts, ...tagPosts] });
    }

    // Fallback: recent posts
    const recentPosts = await prisma.blogPost.findMany({
      where: {
        status: 'published',
        slug: { not: slug },
        id: { notIn: categoryPosts.map(p => p.id) },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit - categoryPosts.length,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        category: true,
        tags: true,
        publishedAt: true,
      },
    });

    return NextResponse.json({ posts: [...categoryPosts, ...recentPosts] });
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
