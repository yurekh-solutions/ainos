import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateScheduleNow } from '@/lib/schedule-generator';
import { runHealthChecks } from '@/lib/site-health';
import { cronAuthorized, cronRejected } from '@/lib/security';

// POST /api/blog-agent/auto-generate
// Called daily by cron - re-checks every connected website for the embed code
// (notifying owners when a site connects or drops off), generates today's
// pending blogs, catches up overdue pending schedules, and retries failed ones
// from the last 3 days
export async function POST(req: NextRequest) {
  try {
    // The old check only compared the header when one was present, so calling
    // this endpoint with no header at all sailed through - and the fallback
    // token it compared against was published in the workflow file. Now the
    // shared guard requires the secret, fail-closed in production.
    const auth = cronAuthorized(req);
    if (!auth.ok) return cronRejected(auth.reason);

    const health = await runHealthChecks().catch((err) => {
      console.error('[Auto-generate] health checks failed:', err);
      return null;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Catch-up window: today's pending + any overdue pending + failed (last 7 days) for retry
    const retryCutoff = new Date(today);
    retryCutoff.setDate(retryCutoff.getDate() - 7);

    // Also reset any failed schedules with retryCount < 5 so they get another chance
    await prisma.blogSchedule.updateMany({
      where: { status: 'failed', retryCount: { lt: 5 } },
      data: { status: 'pending' },
    });

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
      const result = await generateScheduleNow(schedule.id, { force: true });
      results.push({ id: schedule.id, ...result });
    }

    return NextResponse.json({
      processed: results.length,
      results,
      published: results.filter(r => r.status === 'published').length,
      failed: results.filter(r => r.status === 'failed').length,
      health,
    });
  } catch (error) {
    console.error('Auto-generate error:', error);
    return NextResponse.json({ error: 'Auto-generate failed' }, { status: 500 });
  }
}
