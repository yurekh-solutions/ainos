import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { liveNow } from '@/lib/site-health';
import { ainosBlogWhere, clientBlogWhere } from '@/lib/ainos-blog';

// Public API - no auth required. Returns only published posts past their go-live date.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const slug = searchParams.get('slug');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 100);
    // scope=clients lists posts written for customer websites; the default is the AINOS blog.
    const scope = searchParams.get('scope') === 'clients' ? 'clients' : 'ainos';

    // Single post by slug
    if (slug) {
      const post = await prisma.blogPost.findUnique({
        where: { slug, status: 'published' },
      });
      if (!post || (post.publishedAt && post.publishedAt > new Date())) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(post);
    }

    const publisherWhere = scope === 'clients' ? clientBlogWhere : ainosBlogWhere;
    const where: Record<string, unknown> = { status: 'published', AND: [publisherWhere, liveNow()] };

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
      // Client cards show which website the article was written for.
      ...(scope === 'clients'
        ? { include: { schedules: { select: { connectedWebsite: { select: { name: true, url: true } } } } } }
        : {}),
    });

    // Get distinct categories
    const allPublished = await prisma.blogPost.findMany({
      where: { status: 'published', AND: [publisherWhere, liveNow()] },
      select: { category: true },
    });
    const categories = [...new Set(allPublished.map((p: { category: string | null }) => p.category).filter(Boolean))] as string[];

    const shaped = posts.map((p) => {
      const { schedules, ...rest } = p as Record<string, unknown> & {
        schedules?: { connectedWebsite?: { name: string; url: string } }[];
      };
      const site = schedules?.[0]?.connectedWebsite;
      return site ? { ...rest, site: { name: site.name, url: site.url } } : rest;
    });

    return NextResponse.json({ posts: shaped, categories, scope });
  } catch (error) {
    console.error('Error in public blog API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
