import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureCompany } from '@/lib/prisma-helpers';
import { isAdmin } from '@/lib/admin';

// GET /api/blog-agent/websites - List connected websites
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await ensureCompany(session.user.email, session.user.name || 'User');
    if (!company) {
      return NextResponse.json({ error: 'Failed to setup company' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform') === 'true' && isAdmin(session.user.email);

    // Platform mode: admin sees ALL websites across all companies
    const where = platform ? {} : { companyId: company.id };

    const websites = await prisma.connectedWebsite.findMany({
      where,
      include: {
        subscriptions: {
          select: {
            blogsPerMonth: true,
            blogsUsed: true,
            blogsRemaining: true,
            currentPeriodEnd: true,
          },
        },
        schedules: {
          select: {
            id: true,
            status: true,
            scheduledDate: true,
            topic: true,
          },
          orderBy: { scheduledDate: 'asc' },
        },
        ...(platform ? { company: { select: { name: true, id: true } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with blog counts
    const enriched = websites.map(w => ({
      ...w,
      subscription: w.subscriptions[0] || null,
      totalBlogs: w.schedules.length,
      publishedBlogs: w.schedules.filter(s => s.status === 'published').length,
      pendingBlogs: w.schedules.filter(s => s.status === 'pending').length,
      schedules: undefined,
      subscriptions: undefined,
    }));

    return NextResponse.json({ websites: enriched });
  } catch (error) {
    console.error('List websites error:', error);
    return NextResponse.json({ error: 'Failed to fetch websites' }, { status: 500 });
  }
}

// DELETE /api/blog-agent/websites?id=xxx - Disconnect website
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await ensureCompany(session.user.email, session.user.name || 'User');
    if (!company) {
      return NextResponse.json({ error: 'Failed to setup company' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
    }

    // Verify ownership
    const website = await prisma.connectedWebsite.findFirst({
      where: { id, companyId: company.id },
    });
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    // Soft delete (set inactive)
    await prisma.connectedWebsite.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete website error:', error);
    return NextResponse.json({ error: 'Failed to disconnect website' }, { status: 500 });
  }
}
