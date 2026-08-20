import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public API - no auth required. Returns only published posts.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const slug = searchParams.get('slug');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Single post by slug
    if (slug) {
      const post = await prisma.blogPost.findUnique({
        where: { slug, status: 'published' },
      });
      if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(post);
    }

    const where: Record<string, unknown> = { status: 'published' };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    // Get distinct categories
    const allPublished = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { category: true },
    });
    const categories = [...new Set(allPublished.map((p: { category: string | null }) => p.category).filter(Boolean))] as string[];

    return NextResponse.json({ posts, categories });
  } catch (error) {
    console.error('Error in public blog API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
