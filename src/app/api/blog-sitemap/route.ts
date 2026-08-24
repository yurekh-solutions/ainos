import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// XML Sitemap for blog posts - helps Google index all blog pages
export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, publishedAt: true, createdAt: true },
      orderBy: { publishedAt: 'desc' },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ainos.vercel.app';

    const sitemapUrls = posts.map((post) => {
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      const lastmod = (post.publishedAt || post.createdAt).toISOString().split('T')[0];
      return `
  <url>
    <loc>${postUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('');

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/blog</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  ${sitemapUrls}
</urlset>`;

    return new NextResponse(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
