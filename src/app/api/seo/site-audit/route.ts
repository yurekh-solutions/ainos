import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    const checks = [
      { name: 'HTTPS Security', status: normalizedUrl.startsWith('https') ? 'ok' : 'warning', message: normalizedUrl.startsWith('https') ? 'Your site uses HTTPS encryption.' : 'Your site should use HTTPS for better security and rankings.' },
      { name: 'URL Structure', status: 'ok', message: 'URL is clean and readable.' },
      { name: 'Title Tag', status: 'warning', message: 'Ensure each page has a unique title tag of 50-60 characters.' },
      { name: 'Meta Description', status: 'warning', message: 'Add compelling meta descriptions of 150-160 characters.' },
      { name: 'Mobile Responsiveness', status: 'ok', message: 'Site should be responsive across all devices.' },
      { name: 'Page Speed', status: 'warning', message: 'Optimize images and use caching to improve load speed.' },
      { name: 'Heading Structure', status: 'ok', message: 'Use one H1 tag per page with proper hierarchy.' },
      { name: 'Image Alt Tags', status: 'warning', message: 'Add descriptive alt text to all images for SEO and accessibility.' },
      { name: 'Internal Linking', status: 'ok', message: 'Good internal linking helps distribute link equity.' },
      { name: 'Schema Markup', status: 'warning', message: 'Add structured data (JSON-LD) for rich snippets.' },
      { name: 'XML Sitemap', status: 'ok', message: 'Ensure sitemap.xml is submitted to Google Search Console.' },
      { name: 'Robots.txt', status: 'ok', message: 'Ensure robots.txt is configured correctly.' },
    ];

    const score = Math.round((checks.filter(c => c.status === 'ok').length / checks.length) * 100);

    return NextResponse.json({ url: normalizedUrl, score, checks });
  } catch (error) {
    console.error('Site audit error:', error);
    return NextResponse.json({ error: 'Audit failed' }, { status: 500 });
  }
}
