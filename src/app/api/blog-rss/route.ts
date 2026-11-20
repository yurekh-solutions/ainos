import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { liveNow } from '@/lib/site-health';
import { SITE_URL } from '@/lib/seo';
import { ainosBlogWhere } from '@/lib/ainos-blog';
import { escapeXml, plainText } from '@/lib/xml';
import { renderFeedPreview } from '@/lib/rss-preview';

const CHANNEL_TITLE = 'AINOS Blog';
const CHANNEL_DESCRIPTION = 'Guides on GST billing, CRM, SEO and AI automation for Indian businesses';

// RSS Feed for blog syndication
// Feed readers get the XML; a browser gets a readable preview of the same feed.
export async function GET(request: Request) {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published', ...ainosBlogWhere, ...liveNow() },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    const siteUrl = SITE_URL;
    const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
    const wantsXml = new URL(request.url).searchParams.get('format') === 'xml';

    const items = posts.map((post) => {
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      const pubDate = post.publishedAt?.toUTCString() || post.createdAt.toUTCString();
      const description = plainText(post.excerpt || post.content?.slice(0, 240) || '');
      const tags = Array.isArray(post.tags) ? post.tags.filter(Boolean) : [];
      const categories = [post.category, ...tags].filter(Boolean) as string[];
      return { title: post.title, url: postUrl, pubDate, description, categories };
    });

    if (acceptsHtml && !wantsXml) {
      const preview = renderFeedPreview({
        siteUrl,
        title: CHANNEL_TITLE,
        description: CHANNEL_DESCRIPTION,
        lastBuildDate: new Date().toUTCString(),
        items,
      });
      return new NextResponse(preview, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          Vary: 'Accept',
        },
      });
    }

    const lastBuildDate = new Date().toUTCString();
    const rssItems = items.map((item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description>${escapeXml(item.description)}</description>
${item.categories.map((category) => `      <category>${escapeXml(category)}</category>`).join('\n')}
    </item>`).join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${CHANNEL_TITLE}</title>
    <link>${siteUrl}/blog</link>
    <description>${CHANNEL_DESCRIPTION}</description>
    <language>en-in</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/api/blog-rss" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        Vary: 'Accept',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
