import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Lead Conversion Tracking - Track CTA clicks, form submissions, signups
export async function POST(req: NextRequest) {
  try {
    const { slug, conversionType, metadata } = await req.json();
    if (!slug || !conversionType) {
      return NextResponse.json({ error: 'Slug and conversionType are required' }, { status: 400 });
    }

    const post = await prisma.blogPost.findFirst({
      where: { slug, status: 'published' },
    });

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Track conversion based on type
    switch (conversionType) {
      case 'cta_click':
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { ctaClicks: { increment: 1 } } as Record<string, unknown>,
        });
        break;

      case 'form_submit':
      case 'signup':
      case 'download':
      case 'purchase':
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { conversions: { increment: 1 } } as Record<string, unknown>,
        });
        break;

      default:
        // Custom conversion type - still count as conversion
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { conversions: { increment: 1 } } as Record<string, unknown>,
        });
    }

    // Log conversion event (you can create a separate model for detailed tracking)
    console.log('[Conversion]', {
      slug,
      type: conversionType,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Conversion tracked successfully' 
    });
  } catch (error) {
    console.error('Conversion tracking error:', error);
    return NextResponse.json({ error: 'Failed to track conversion' }, { status: 500 });
  }
}

// Fetch conversion analytics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const companyId = searchParams.get('companyId');
    const period = searchParams.get('period') || '30d';

    if (slug) {
      // Get conversions for specific post
      const post = await prisma.blogPost.findFirst({
        where: { slug, status: 'published' },
      }) as Record<string, unknown> | null;

      if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

      const views = (post.views as number) || 0;
      const ctaClicks = (post.ctaClicks as number) || 0;
      const conversions = (post.conversions as number) || 0;

      const conversionRate = views > 0 
        ? ((conversions / views) * 100).toFixed(2) 
        : 0;
      
      const ctaClickRate = views > 0 
        ? ((ctaClicks / views) * 100).toFixed(2) 
        : 0;

      return NextResponse.json({
        post: {
          title: post.title,
          slug: post.slug,
          views,
          ctaClicks,
          conversions,
          conversionRate: `${conversionRate}%`,
          ctaClickRate: `${ctaClickRate}%`,
          publishedAt: post.publishedAt,
        },
      });
    }

    // Get conversions for all posts
    const where: Record<string, unknown> = { status: 'published' };
    if (companyId) where.companyId = companyId;

    const posts = await prisma.blogPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        views: true,
        ctaClicks: true,
        conversions: true,
        publishedAt: true,
        category: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    // Calculate totals
    const totals = posts.reduce((acc, post) => ({
      totalViews: acc.totalViews + (post.views || 0),
      totalCtaClicks: acc.totalCtaClicks + (post.ctaClicks || 0),
      totalConversions: acc.totalConversions + (post.conversions || 0),
    }), { totalViews: 0, totalCtaClicks: 0, totalConversions: 0 });

    const overallConversionRate = totals.totalViews > 0 
      ? ((totals.totalConversions / totals.totalViews) * 100).toFixed(2) 
      : 0;

    const overallCtaClickRate = totals.totalViews > 0 
      ? ((totals.totalCtaClicks / totals.totalViews) * 100).toFixed(2) 
      : 0;

    // Top converting posts
    const topConverting = posts
      .filter(p => p.views > 0)
      .map(p => ({
        ...p,
        conversionRate: ((p.conversions / p.views) * 100).toFixed(2),
      }))
      .sort((a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate))
      .slice(0, 5);

    return NextResponse.json({
      posts: posts.map(p => ({
        ...p,
        conversionRate: p.views > 0 ? ((p.conversions / p.views) * 100).toFixed(2) : '0',
        ctaClickRate: p.views > 0 ? ((p.ctaClicks / p.views) * 100).toFixed(2) : '0',
      })),
      summary: {
        totalPosts: posts.length,
        totalViews: totals.totalViews,
        totalCtaClicks: totals.totalCtaClicks,
        totalConversions: totals.totalConversions,
        overallConversionRate: `${overallConversionRate}%`,
        overallCtaClickRate: `${overallCtaClickRate}%`,
      },
      topConverting,
    });
  } catch (error) {
    console.error('Conversion analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversion analytics' }, { status: 500 });
  }
}
