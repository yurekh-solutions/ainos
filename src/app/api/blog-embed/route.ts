import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CORS-enabled public API for embedding blogs on ANY website
// Supports: WordPress, Shopify, React, HTML, Wix, Squarespace, etc.

// Clean raw text: strip JSON, markdown, HTML — return plain readable text
function cleanExcerpt(raw: string, maxLen = 200): string {
  if (!raw) return '';
  return raw
    .replace(/^\s*```[\s\S]*?```\s*/gm, '')
    .replace(/^\s*json\s*/i, '')
    .replace(/[{}\[\]"]/g, '')
    .replace(/#[\w-]+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, maxLen) + (raw.length > maxLen ? '...' : '');
}

// Extract clean markdown from content that may be JSON-wrapped
// Handles: `{ "content": "# Markdown..." }` or raw JSON at start of content
function cleanContent(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  // If content starts with {, try to extract the actual markdown
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      // If parsed JSON has a content field, use that
      if (parsed.content && typeof parsed.content === 'string') {
        return parsed.content;
      }
      // If it's a JSON object but no content field, stringify the markdown parts
      if (parsed.title && parsed.excerpt) {
        return `# ${parsed.title}\n\n${parsed.excerpt}\n\n${parsed.content || ''}`;
      }
    } catch {
      // Not valid JSON — might be markdown that starts with {
      // Strip JSON-like prefix lines
      const lines = trimmed.split('\n');
      let startIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('# ') || lines[i].trim().startsWith('## ')) {
          startIdx = i;
          break;
        }
        // Skip JSON lines
        if (lines[i].includes('"') && (lines[i].includes('title') || lines[i].includes('slug') || lines[i].includes('excerpt'))) {
          startIdx = i + 1;
        }
      }
      return lines.slice(startIdx).join('\n').trim();
    }
  }
  return trimmed;
}

// "https://www.SkyAV.in/some/path" -> "skyav.in"
function normalizeHost(u: string): string {
  try {
    const url = new URL(u.startsWith('http') ? u : `https://${u}`);
    return url.host.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const slug = searchParams.get('slug');
    const limit = parseInt(searchParams.get('limit') || '20');
    const format = searchParams.get('format') || 'json'; // json | rss | sitemap

    // Single post by slug (for blog detail pages)
    if (slug) {
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
      if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      // Tenant guard: an embedded single-post view must never show another
      // company's article on a client's website
      const slugSiteHost = normalizeHost(searchParams.get('site') || req.headers.get('referer') || req.headers.get('origin') || '');
      if (slugSiteHost) {
        const sites = await prisma.connectedWebsite.findMany({
          where: { isActive: true },
          select: { id: true, url: true, companyId: true },
        });
        const siteMatch = sites.find(w => normalizeHost(w.url || '') === slugSiteHost);
        if (siteMatch && post.companyId && post.companyId !== siteMatch.companyId) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
      }

      const website = post.schedules?.[0]?.subscription?.connectedWebsite;

      const responseData = {
        ...post,
        content: cleanContent(post.content || ''),
        websiteName: website?.name || null,
        websiteUrl: website?.url || null,
        websiteNiche: website?.niche || post.category,
        // SEO data
        seoTitle: post.title,
        seoDescription: cleanExcerpt(post.excerpt || post.content || '', 160),
        seoKeywords: Array.isArray(post.tags) ? post.tags.join(', ') : '',
        canonicalUrl: `${website?.url || ''}/blog/${post.slug}`,
        // Structured data for Google
        schemaOrg: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: cleanExcerpt(post.excerpt || post.content || '', 160),
          author: {
            '@type': 'Organization',
            name: website?.name || 'AINOS Blog',
          },
          publisher: {
            '@type': 'Organization',
            name: website?.name || 'AINOS Blog',
            logo: {
              '@type': 'ImageObject',
              url: `${website?.url || ''}/logo.png`,
            },
          },
          datePublished: post.publishedAt || post.createdAt,
          dateModified: post.createdAt,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${website?.url || ''}/blog/${post.slug}`,
          },
          keywords: Array.isArray(post.tags) ? post.tags.join(', ') : '',
          articleSection: post.category || 'General',
        },
      };

      return NextResponse.json(responseData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // List of published posts
    const where: Record<string, unknown> = { status: 'published' };

    // Tenant isolation: serve ONLY the blogs of the website this widget is
    // embedded on (host matched against connected websites). Unknown sites
    // get an empty list — one client's blogs never leak to another.
    const siteHint = searchParams.get('site') || req.headers.get('referer') || req.headers.get('origin') || '';
    const siteHost = normalizeHost(siteHint);
    if (siteHost) {
      const websites = await prisma.connectedWebsite.findMany({
        where: { isActive: true },
        select: { id: true, url: true, companyId: true },
      });
      const match = websites.find(w => normalizeHost(w.url || '') === siteHost);
      if (!match || !match.companyId) {
        return NextResponse.json(
          { posts: [], categories: [], total: 0 },
          { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' } }
        );
      }
      where.companyId = match.companyId;
    } else {
      return NextResponse.json(
        { posts: [], categories: [], total: 0 },
        { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' } }
      );
    }

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

    const formattedPosts = posts.map((post) => {
      const website = post.schedules?.[0]?.subscription?.connectedWebsite;
      // Clean excerpt: strip JSON, markdown, HTML tags — return plain text only
      const rawExcerpt = post.excerpt || post.content || '';
      const cleanedExcerpt = rawExcerpt
        .replace(/^\s*```[\s\S]*?```\s*/gm, '')   // strip code blocks
        .replace(/^\s*json\s*/i, '')                // strip leading 'json' keyword
        .replace(/[{}\[\]"]/g, '')                  // strip JSON brackets/quotes
        .replace(/#[\w-]+/g, '')                     // strip markdown headings
        .replace(/\*\*(.*?)\*\*/g, '$1')            // strip bold
        .replace(/\*(.*?)\*/g, '$1')                // strip italic
        .replace(/<[^>]+>/g, '')                     // strip HTML tags
        .replace(/\n{2,}/g, ' ')                     // collapse newlines
        .replace(/\s+/g, ' ')                        // collapse whitespace
        .trim()
        .substring(0, 200) + (rawExcerpt.length > 200 ? '...' : '');
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: cleanedExcerpt,
        content: cleanContent(post.content || ''),
        category: post.category,
        tags: Array.isArray(post.tags) ? post.tags : [],
        featuredImage: post.featuredImage,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        readTime: Math.max(1, Math.ceil((cleanContent(post.content || '') || '').split(' ').length / 200)),
        websiteName: website?.name || null,
        websiteUrl: website?.url || null,
        url: `${website?.url || ''}/blog/${post.slug}`,
      };
    });

    // Get distinct categories (same tenant only)
    const allPublished = await prisma.blogPost.findMany({
      where: { status: 'published', companyId: where.companyId as string },
      select: { category: true },
    });
    const categories = [...new Set(allPublished.map((p: { category: string | null }) => p.category).filter(Boolean))] as string[];

    return NextResponse.json(
      { posts: formattedPosts, categories, total: formattedPosts.length },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (error) {
    console.error('Error in embed blog API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    }
  );
}
