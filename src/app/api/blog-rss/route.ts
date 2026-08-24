import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// RSS Feed for blog syndication
// Users can subscribe to this feed in their RSS readers
export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ainos.vercel.app';

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
    <description>AI-powered SEO insights and growth strategies</description>
    <language>en-us</language>
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
