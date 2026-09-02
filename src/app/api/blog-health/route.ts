import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAIText } from '@/lib/ai-provider';

// Blog Health Score - checks broken links, outdated content, SEO decay
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { blogId } = await req.json();
    if (!blogId) return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 });

    const post = await prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!post) return NextResponse.json({ error: 'Blog not found' }, { status: 404 });

    const content = post.content || '';
    const currentYear = new Date().getFullYear();
    const issues: Array<{ type: string; severity: 'high' | 'medium' | 'low'; message: string; fix?: string }> = [];

    // 1. Check for broken links
    const urls = content.match(/https?:\/\/[^\s)\]]+/g) || [];
    const uniqueUrls = [...new Set(urls)];
    const brokenLinks: string[] = [];

    for (const url of uniqueUrls.slice(0, 20)) { // Limit to 20 for performance
      try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        if (!res.ok) brokenLinks.push(url);
      } catch {
        brokenLinks.push(url);
      }
    }

    if (brokenLinks.length > 0) {
      issues.push({
        type: 'broken_links',
        severity: 'high',
        message: `${brokenLinks.length} broken link(s) found`,
        fix: 'Remove or replace broken links'
      });
    }

    // 2. Check for outdated years
    const yearMatches = content.match(/\b(20[0-2][0-9])\b/g) || [];
    const outdatedYears = [...new Set(yearMatches)].filter(y => parseInt(y) < currentYear - 1);
    
    if (outdatedYears.length > 0) {
      issues.push({
        type: 'outdated_content',
        severity: 'medium',
        message: `Content references outdated year(s): ${outdatedYears.join(', ')}`,
        fix: `Update statistics and references to ${currentYear}`
      });
    }

    // 3. Check SEO score decay
    const seoScore = (post as Record<string, unknown>).seoScore as number || 70;
    if (seoScore < 60) {
      issues.push({
        type: 'low_seo',
        severity: 'high',
        message: `SEO score is low (${seoScore}/100)`,
        fix: 'Optimize title, headings, and keyword density'
      });
    }

    // 4. Check word count (thin content)
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 500) {
      issues.push({
        type: 'thin_content',
        severity: 'medium',
        message: `Content is thin (${wordCount} words)`,
        fix: 'Expand content to at least 800 words for better ranking'
      });
    }

    // 5. Check for missing FAQ section
    const hasFaq = /(?:FAQ|Frequently Asked Questions)/i.test(content);
    if (!hasFaq) {
      issues.push({
        type: 'missing_faq',
        severity: 'low',
        message: 'No FAQ section found',
        fix: 'Add FAQ section for AEO optimization'
      });
    }

    // 6. Check for missing images
    const hasImages = /!\[.*?\]\(.*?\)/.test(content);
    if (!hasImages) {
      issues.push({
        type: 'missing_images',
        severity: 'medium',
        message: 'No inline images in content',
        fix: 'Add relevant images to improve engagement'
      });
    }

    // 7. Check for missing CTA
    const hasCta = /(?:click here|learn more|get started|sign up|subscribe|download)/i.test(content);
    if (!hasCta) {
      issues.push({
        type: 'missing_cta',
        severity: 'medium',
        message: 'No call-to-action found',
        fix: 'Add a strong CTA at the end of the article'
      });
    }

    // Calculate health score
    const totalChecks = 7;
    const passedChecks = totalChecks - issues.filter(i => i.severity === 'high').length - (issues.filter(i => i.severity === 'medium').length * 0.5);
    const healthScore = Math.max(0, Math.min(100, Math.round((passedChecks / totalChecks) * 100)));

    // AI suggestion for improvement
    let aiSuggestion = '';
    if (issues.length > 0) {
      try {
        const prompt = `This blog post has these issues: ${issues.map(i => i.message).join('; ')}.
        Suggest 3 specific improvements to increase the health score. Keep it concise.`;
        aiSuggestion = await generateAIText(
          'You are an SEO content auditor. Provide concise, actionable suggestions.',
          prompt
        );
      } catch {
        aiSuggestion = 'Fix broken links, update outdated content, and add FAQ section.';
      }
    }

    return NextResponse.json({
      healthScore,
      issues,
      aiSuggestion,
      stats: {
        wordCount,
        linkCount: uniqueUrls.length,
        brokenLinkCount: brokenLinks.length,
        seoScore,
        hasFaq,
        hasImages,
        hasCta
      }
    });
  } catch (error) {
    console.error('Health score error:', error);
    return NextResponse.json({ error: 'Failed to analyze blog health' }, { status: 500 });
  }
}

// GET - Scan all blogs for a company
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) return NextResponse.json({ error: 'Company ID required' }, { status: 400 });

    const posts = await prisma.blogPost.findMany({
      where: { companyId, status: 'published' },
      select: { id: true, title: true, content: true, publishedAt: true }
    });

    const results = [];
    for (const post of posts.slice(0, 10)) { // Limit for performance
      const content = post.content || '';
      const urls = content.match(/https?:\/\/[^\s)\]]+/g) || [];
      const brokenCount = 0; // Skip actual fetch in bulk scan
      const yearMatches = content.match(/\b(20[0-2][0-9])\b/g) || [];
      const outdatedYears = [...new Set(yearMatches)].filter(y => parseInt(y) < new Date().getFullYear() - 1);

      results.push({
        id: post.id,
        title: post.title,
        publishedAt: post.publishedAt,
        linkCount: urls.length,
        outdatedYears: outdatedYears.length,
        needsRefresh: outdatedYears.length > 0
      });
    }

    const needsRefresh = results.filter(r => r.needsRefresh).length;

    return NextResponse.json({
      totalBlogs: posts.length,
      needsRefresh,
      blogs: results
    });
  } catch (error) {
    console.error('Bulk health scan error:', error);
    return NextResponse.json({ error: 'Failed to scan blogs' }, { status: 500 });
  }
}
