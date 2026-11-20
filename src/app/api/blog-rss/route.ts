import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { liveNow } from '@/lib/site-health';
import { SITE_URL } from '@/lib/seo';
import { ainosBlogWhere } from '@/lib/ainos-blog';

// RSS Feed for blog syndication
// Users can subscribe to this feed in their RSS readers
export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published', ...ainosBlogWhere, ...liveNow() },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    const siteUrl = SITE_URL;

    const rssItems = posts.map((post) => {
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      const pubDate = post.publishedAt?.toUTCString() || post.createdAt.toUTCString();
      const description = post.excerpt || post.content?.substring(0, 200) || '';

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      ${post.category ? `<category>${post.category}</category>` : ''}
      ${Array.isArray(post.tags) ? post.tags.map(tag => `<category>${tag}</category>`).join('') : ''}
    </item>`;
    }).join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>AINOS Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Guides on GST billing, CRM, SEO and AI automation for Indian businesses</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/blog-rss" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
