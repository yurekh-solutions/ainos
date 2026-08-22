import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureCompany } from '@/lib/prisma-helpers';

// POST /api/blog-agent/schedule - Generate blog schedule for a website
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

    const { websiteId, count = 30, startDate } = await req.json();

    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
    }

    // Get website and its topics
    const website = await prisma.connectedWebsite.findFirst({
      where: { id: websiteId, companyId: company.id },
    });
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    const topics = (website.topics as string[]) || [];
    if (topics.length === 0) {
      return NextResponse.json({ error: 'No topics available for this website' }, { status: 400 });
    }

    // Get existing subscription
    let subscription = await prisma.blogSubscription.findFirst({
      where: { connectedWebsiteId: websiteId, companyId: company.id },
    });

    if (!subscription) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      subscription = await prisma.blogSubscription.create({
        data: {
          plan: 'standard',
          blogsPerMonth: 30,
          blogsUsed: 0,
          blogsRemaining: 30,
          startDate: now,
          currentPeriodEnd: periodEnd,
          autoSchedule: true,
          schedulePattern: 'daily',
          connectedWebsiteId: websiteId,
          companyId: company.id,
        },
      });
    }

    // Check remaining quota
    const remaining = subscription.blogsRemaining;
    const toSchedule = Math.min(count, remaining, topics.length);

    if (toSchedule === 0) {
      return NextResponse.json({ error: 'No remaining blog quota', remaining: 0 }, { status: 400 });
    }

    // Get already scheduled topics to avoid duplicates
    const existingSchedules = await prisma.blogSchedule.findMany({
      where: { subscriptionId: subscription.id },
      select: { topic: true },
    });
    const existingTopics = new Set(existingSchedules.map(s => s.topic));

    // Filter out already scheduled topics
    const availableTopics = topics.filter(t => !existingTopics.has(t));
    const finalTopics = availableTopics.slice(0, toSchedule);

    // Create schedules spread across the month
    const start = startDate ? new Date(startDate) : new Date();
    const schedules = [];

    for (let i = 0; i < finalTopics.length; i++) {
      const scheduledDate = new Date(start);
      // Spread evenly across 30 days
      const dayOffset = Math.floor((i * 30) / finalTopics.length);
      scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
      scheduledDate.setHours(9 + (i % 3), 0, 0, 0); // Stagger times: 9AM, 10AM, 11AM

      const schedule = await prisma.blogSchedule.create({
        data: {
          topic: finalTopics[i],
          keywords: website.niche || '',
          tone: 'Professional',
          targetWordCount: 3000,
          scheduledDate,
          status: 'pending',
          publishTargets: website.publishMethod === 'ainos' ? ['ainos'] : ['ainos', website.publishMethod],
          subscriptionId: subscription.id,
          connectedWebsiteId: websiteId,
          companyId: company.id,
        },
      });
      schedules.push(schedule);
    }

    // Update subscription quota
    await prisma.blogSubscription.update({
      where: { id: subscription.id },
      data: {
        blogsUsed: subscription.blogsUsed + finalTopics.length,
        blogsRemaining: Math.max(0, subscription.blogsRemaining - finalTopics.length),
      },
    });

    return NextResponse.json({
      scheduled: schedules.length,
      schedules,
      remaining: subscription.blogsRemaining - finalTopics.length,
    });
  } catch (error) {
    console.error('Schedule error:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

// GET /api/blog-agent/schedule?websiteId=xxx - View upcoming scheduled blogs
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
    const websiteId = searchParams.get('websiteId');

    const where: Record<string, unknown> = { companyId: company.id };
    if (websiteId) where.connectedWebsiteId = websiteId;

    const schedules = await prisma.blogSchedule.findMany({
      where,
      include: {
        blogPost: {
          select: { id: true, title: true, slug: true, status: true },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    // Group by status
    const summary = {
      total: schedules.length,
      pending: schedules.filter(s => s.status === 'pending').length,
      generating: schedules.filter(s => s.status === 'generating').length,
      generated: schedules.filter(s => s.status === 'generated').length,
      published: schedules.filter(s => s.status === 'published').length,
      failed: schedules.filter(s => s.status === 'failed').length,
    };

    return NextResponse.json({ schedules, summary });
  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
