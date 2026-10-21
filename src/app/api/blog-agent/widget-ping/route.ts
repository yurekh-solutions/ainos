import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeHost, recordWidgetSighting } from '@/lib/site-health';
import { getServerSession } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// POST /api/blog-agent/widget-ping
// Called by embed.js on every page load of a client website (sendBeacon /
// no-cors fetch, so the body may arrive as text/plain). Each ping refreshes
// the website's last-seen time and marks it connected.
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text().catch(() => '');
    let body: { siteUrl?: string; site?: string } = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { /* ignore malformed body */ }
    const hint = body && (body.siteUrl || body.site);
    const requester = req.headers.get('origin') || req.headers.get('referer') || '';
    const siteUrl = typeof hint === 'string' ? hint : requester;
    if (!normalizeHost(siteUrl)) {
      return NextResponse.json({ error: 'No valid site URL provided' }, { status: 400, headers: CORS });
    }
    // A body/data-site preview cannot mark a different domain as connected.
    if (!normalizeHost(requester) || normalizeHost(requester) !== normalizeHost(siteUrl)) {
      return NextResponse.json({ error: 'Website origin does not match the ping' }, { status: 403, headers: CORS });
    }

    const sites = await recordWidgetSighting(siteUrl);
    if (sites.length === 0) {
      // Widget loaded on a domain that isn't connected to any AINOS account
      return NextResponse.json({ status: 'unknown_site' }, { headers: CORS });
    }

    return NextResponse.json({ status: 'connected', websiteId: sites[0].id }, { headers: CORS });
  } catch (error) {
    console.error('[Widget Ping] Error:', error);
    return NextResponse.json({ error: 'Ping failed' }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...CORS, 'Access-Control-Max-Age': '86400' } });
}

// GET — owner-only integration status (public widgets only need POST).
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { companyId: true } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    const { searchParams } = new URL(req.url);
    const websiteId = searchParams.get('websiteId');

    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId required' }, { status: 400 });
    }

    const website = await prisma.connectedWebsite.findFirst({
      where: { id: websiteId, ...(isAdmin(session.user.email) ? {} : { companyId: user.companyId }) },
      select: {
        id: true,
        name: true,
        url: true,
        widgetIntegrated: true,
        widgetIntegratedAt: true,
        connectionStatus: true,
        widgetLastSeenAt: true,
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
