import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { startBackgroundGeneration } from '@/lib/schedule-generator';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const platform = searchParams.get('platform') === 'true' && isAdmin(session.user.email);

    // Platform mode: admin sees ALL blogs across all companies (no companyId filter)
    const where: Record<string, unknown> = platform ? {} : { companyId: user.companyId };
    if (status) where.status = status;
    if (category && category !== 'All') where.category = category;

    const posts = await prisma.blogPost.findMany({
      where,
      include: platform ? {
        company: { select: { name: true, id: true } },
      } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    // Also fetch scheduled blogs from BlogSchedule.
    // ONLY blogs still being prepared show as cards — published or failed
    // schedule rows must never surface (prevents duplicate cards after
    // publishing and stuck "queued" cards that confuse delete/regenerate).
    const scheduleWhere: Record<string, unknown> = platform ? {} : { companyId: user.companyId };
    scheduleWhere.status = { in: ['pending', 'generating'] };
    let schedules = [] as unknown as Array<{
      id: string;
      topic: string;
      keywords: string | null;
      status: string;
      previewImage: string | null;
      companyId: string | null;
      scheduledDate: Date;
      createdAt: Date;
      subscription: {
        connectedWebsite: {
          niche: string | null;
        } | null;
      } | null;
      company?: { name: string | null; id: string } | null;
    }>;
    if (!status || status === 'scheduled') {
      schedules = await prisma.blogSchedule.findMany({
        where: scheduleWhere,
        include: {
          subscription: {
            include: {
              connectedWebsite: true,
            },
          },
          ...(platform ? { company: { select: { name: true, id: true } } } : {}),
        },
        orderBy: { scheduledDate: 'desc' },
      }) as unknown as typeof schedules;
    }

    // Auto-start background writing for any company that still has queued blogs —
    // no user clicks needed; published articles appear as they are written
    const pendingCompanies = new Set<string>();
    schedules.forEach(s => { if (s.status === 'pending' && s.companyId) pendingCompanies.add(s.companyId); });
    if (!platform && user.companyId) pendingCompanies.add(user.companyId);
    pendingCompanies.forEach(cid => startBackgroundGeneration(cid));

    // Convert schedules to blog post format for unified display.
    // Queued cards get a readable content preview built from the site's
    // niche + keywords so every card shows heading, content and image.
    const scheduledPosts = schedules.map((s) => {
      const niche = s.subscription?.connectedWebsite?.niche || 'Business';
      const kwList = s.keywords
        ? (s.keywords as string).split(',').map(k => k.trim())
            .filter(k => k && k.toLowerCase() !== niche.toLowerCase())
        : [];
      const teaser = kwList.slice(0, 3).join(', ');
      return {
        id: s.id,
        title: s.topic,
        slug: s.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        content: '',
        excerpt: `A complete ${niche.toLowerCase()} guide with practical strategies, expert insights and actionable steps${teaser ? ` covering ${teaser}` : ''}.`,
        featuredImage: s.previewImage,
        category: s.subscription?.connectedWebsite?.niche || 'General',
        status: 'scheduled',
        author: null,
        publishedAt: null,
        scheduledAt: s.scheduledDate,
        tags: s.keywords ? (s.keywords as string).split(',').map(k => k.trim()) : [],
        views: 0,
        createdAt: s.createdAt || new Date(),
        isSchedule: true,
        company: s.company ? { name: s.company.name, id: s.company.id } : null,
      };
    });

    // Get distinct categories for filtering
    const allPosts = await prisma.blogPost.findMany({
      where: platform ? {} : { companyId: user.companyId },
      select: { category: true },
    });
    const categories = [...new Set(allPosts.map((p: { category: string | null }) => p.category).filter(Boolean))] as string[];

    // Combine posts and scheduled posts
    const allContent = [...posts, ...scheduledPosts];

    return NextResponse.json({ posts: allContent, categories, scheduledCount: scheduledPosts.length });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const post = await prisma.blogPost.create({
      data: { ...body, slug, companyId: user.companyId, author: user.id }
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json();
    if (body.title && !body.slug) {
      body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const post = await prisma.blogPost.update({ where: { id }, data: body });
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (post) {
      await prisma.blogPost.delete({ where: { id } });
    } else {
      // Queued (scheduled) blogs are BlogSchedule rows — delete those too
      const schedule = await prisma.blogSchedule.findUnique({ where: { id } });
      if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      await prisma.blogSchedule.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
