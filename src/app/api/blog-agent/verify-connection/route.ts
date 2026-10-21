import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureCompany } from '@/lib/prisma-helpers';
import { isAdmin } from '@/lib/admin';
import { checkWebsiteConnection } from '@/lib/site-health';

// POST /api/blog-agent/verify-connection  { websiteId }
// Runs a live check of the client's website for the AINOS embed code and
// returns the refreshed connection status.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await ensureCompany(session.user.email, session.user.name || 'User');
    if (!company) {
      return NextResponse.json({ error: 'Failed to setup company' }, { status: 500 });
    }

    const { websiteId } = await req.json().catch(() => ({}));
    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
    }

    const owned = await prisma.connectedWebsite.findFirst({
      where: isAdmin(session.user.email) ? { id: websiteId } : { id: websiteId, companyId: company.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const w = await checkWebsiteConnection(owned.id);
    if (!w) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: w.id,
      connectionStatus: w.connectionStatus,
      lastCheckResult: w.lastCheckResult,
      lastCheckedAt: w.lastCheckedAt,
      widgetLastSeenAt: w.widgetLastSeenAt,
      widgetLastSeenUrl: w.widgetLastSeenUrl,
    });
  } catch (error) {
    console.error('Verify connection error:', error);
    return NextResponse.json({ error: 'Could not check the website right now' }, { status: 500 });
  }
}
