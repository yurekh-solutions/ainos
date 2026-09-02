import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Track blog post view and engagement
export async function POST(req: NextRequest) {
  try {
    const { slug, eventType, data } = await req.json();
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const post = await prisma.blogPost.findFirst({
      where: { slug, status: 'published' },
    });

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    switch (eventType) {
      case 'view':
        // Increment view count
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { views: { increment: 1 } },
        });
        break;

      case 'engagement':
        // Update average time on page
        if (data?.timeOnPage) {
          const currentAvg = post.avgTimeOnPage || 0;
          const currentViews = post.views || 1;
          const newAvg = ((currentAvg * (currentViews - 1)) + data.timeOnPage) / currentViews;
          await prisma.blogPost.update({
            where: { id: post.id },
            data: { avgTimeOnPage: newAvg },
          });
        }
        break;

      case 'cta_click':
        // Track CTA clicks
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { ctaClicks: { increment: 1 } },
        });
        break;

      case 'conversion':
        // Track conversions (form submissions, signups, etc.)
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { conversions: { increment: 1 } },
        });
        break;

      case 'bounce':
        // Update bounce rate
        const currentViews = post.views || 1;
        const currentBounces = (post.bounceRate || 0) * currentViews / 100;
        const newBounces = currentBounces + 1;
        const newBounceRate = (newBounces / (currentViews + 1)) * 100;
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { bounceRate: newBounceRate },
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 });
  }
}

// Fetch analytics for a blog post or all posts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const companyId = searchParams.get('companyId');
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, all

    if (slug) {
      // Get analytics for specific post
      const post = await prisma.blogPost.findFirst({
        where: { slug, status: 'published' },
        select: {
          id: true,
          title: true,
          slug: true,
          views: true,
          avgTimeOnPage: true,
          bounceRate: true,
          ctaClicks: true,
          conversions: true,
          publishedAt: true,
        },
      });

      if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

      // Calculate engagement score (0-100)
      const engagementScore = calculateEngagementScore(post);

      return NextResponse.json({
        ...post,
        engagementScore,
        conversionRate: post.views > 0 ? ((post.conversions / post.views) * 100).toFixed(2) : 0,
        ctaClickRate: post.views > 0 ? ((post.ctaClicks / post.views) * 100).toFixed(2) : 0,
      });
    }

    // Get analytics for all posts
    const where: Record<string, unknown> = { status: 'published' };
    if (companyId) where.companyId = companyId;

    const posts = await prisma.blogPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        views: true,
        avgTimeOnPage: true,
        bounceRate: true,
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
      avgTimeOnPage: acc.avgTimeOnPage + (post.avgTimeOnPage || 0),
    }), { totalViews: 0, totalCtaClicks: 0, totalConversions: 0, avgTimeOnPage: 0 });

    const avgTimeOnPage = posts.length > 0 ? totals.avgTimeOnPage / posts.length : 0;
    const overallConversionRate = totals.totalViews > 0 
      ? ((totals.totalConversions / totals.totalViews) * 100).toFixed(2) 
      : 0;

    return NextResponse.json({
      posts: posts.map(post => ({
        ...post,
        engagementScore: calculateEngagementScore(post),
        conversionRate: post.views > 0 ? ((post.conversions / post.views) * 100).toFixed(2) : 0,
      })),
      summary: {
        totalPosts: posts.length,
        totalViews: totals.totalViews,
        totalCtaClicks: totals.totalCtaClicks,
        totalConversions: totals.totalConversions,
        avgTimeOnPage: Math.round(avgTimeOnPage),
        overallConversionRate,
      },
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

function calculateEngagementScore(post: Record<string, unknown>): number {
  let score = 0;
  
  // Views (max 25 points)
  const views = (post.views as number) || 0;
  score += Math.min(25, views / 10);
  
  // Time on page (max 25 points)
  const timeOnPage = (post.avgTimeOnPage as number) || 0;
  score += Math.min(25, timeOnPage / 12); // 2+ minutes = max score
  
  // CTA click rate (max 25 points)
  const ctaRate = views > 0 ? ((post.ctaClicks as number) || 0) / views * 100 : 0;
  score += Math.min(25, ctaRate * 5); // 5%+ = max score
  
  // Conversion rate (max 25 points)
  const convRate = views > 0 ? ((post.conversions as number) || 0) / views * 100 : 0;
  score += Math.min(25, convRate * 10); // 2.5%+ = max score
  
  return Math.round(score);
}
