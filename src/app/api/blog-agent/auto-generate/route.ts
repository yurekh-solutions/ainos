import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateScheduleNow } from '@/lib/schedule-generator';

// POST /api/blog-agent/auto-generate
// Called daily by cron - generates today's pending blogs, catches up overdue
// pending schedules, and retries failed ones from the last 3 days
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret (optional security)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET || 'ainos-cron-2024'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Catch-up window: today's pending + any overdue pending + failed (last 3 days) for retry
    const retryCutoff = new Date(today);
    retryCutoff.setDate(retryCutoff.getDate() - 3);

    const pendingSchedules = await prisma.blogSchedule.findMany({
      where: {
        OR: [
          { status: 'pending', scheduledDate: { lt: tomorrow } },
          { status: 'failed', scheduledDate: { gte: retryCutoff, lt: tomorrow } },
        ],
      },
      include: {
        subscription: {
          include: {
            connectedWebsite: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    const results = [];

    for (const schedule of pendingSchedules) {
      const result = await generateScheduleNow(schedule.id);
      results.push({ id: schedule.id, ...result });
    }

    return NextResponse.json({
      processed: results.length,
      results,
      published: results.filter(r => r.status === 'published').length,
      failed: results.filter(r => r.status === 'failed').length,
    });
  } catch (error) {
    console.error('Auto-generate error:', error);
    return NextResponse.json({ error: 'Auto-generate failed' }, { status: 500 });
  }
}
