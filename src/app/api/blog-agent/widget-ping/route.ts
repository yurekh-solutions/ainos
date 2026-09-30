import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/blog-agent/widget-ping
// Called by embed.js when the blog widget loads on a client website.
// Marks the ConnectedWebsite as widgetIntegrated so AINOS knows the
// blog widget is actually live on the site.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const siteUrl = body.siteUrl || body.site || req.headers.get('referer') || '';

    if (!siteUrl) {
      return NextResponse.json({ error: 'No site URL provided' }, { status: 400 });
    }

    // Extract hostname from the site URL
    let hostname: string;
    try {
      hostname = new URL(siteUrl).hostname;
    } catch {
      hostname = siteUrl;
    }

    // Find the connected website matching this hostname
    const website = await prisma.connectedWebsite.findFirst({
      where: {
        isActive: true,
        OR: [
          { url: { contains: hostname } },
          { url: { endsWith: hostname } },
        ],
      },
    });

    if (!website) {
      // Unknown site — widget loaded on a non-connected domain
      return NextResponse.json({ status: 'unknown_site', hostname });
    }

    // Mark as integrated (only update if not already integrated)
    if (!website.widgetIntegrated) {
      await prisma.connectedWebsite.update({
        where: { id: website.id },
        data: {
          widgetIntegrated: true,
          widgetIntegratedAt: new Date(),
        },
      });
      console.log(`[Widget Ping] ${website.name || website.url} — widget integrated!`);
    }

    return NextResponse.json({
      status: 'integrated',
      websiteId: website.id,
      websiteName: website.name || website.url,
    });
  } catch (error) {
    console.error('[Widget Ping] Error:', error);
    return NextResponse.json({ error: 'Ping failed' }, { status: 500 });
  }
}

// GET — check integration status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const websiteId = searchParams.get('websiteId');

    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId required' }, { status: 400 });
    }

    const website = await prisma.connectedWebsite.findUnique({
      where: { id: websiteId },
      select: {
        id: true,
        name: true,
        url: true,
        widgetIntegrated: true,
        widgetIntegratedAt: true,
      },
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    return NextResponse.json(website);
  } catch (error) {
    console.error('[Widget Ping] GET Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
