import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST/GET /api/cron/refresh-credits — monthly credit refill + expiry downgrade.
//
// Two axes of the subscription model, kept in sync every day:
//   1. Active plans whose month rolled over get their `monthlyCreditGrant`
//      refreshed (use-it-or-lose-it pool, like Qoder credits).
//   2. Plans past `currentPeriodEnd` that weren't renewed are marked expired and
//      every tool flag drops to 0 (locked) — the "darwaza band" case.
//
// The existing cron routes are open GETs; we mirror that but honour an optional
// CRON_SECRET so this can be locked down without changing the scheduler URL.
const ALL_TOOL_FLAGS = [
  'autoBlog',
  'invoiceGen',
  'crmAccess',
  'inventoryMgmt',
  'hrPayroll',
  'emailMarketing',
  'aiAssistant',
  'websiteGen',
] as const;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured → open, like sibling crons
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

async function run() {
  const now = new Date();

  // 1) Expire + downgrade subscriptions past their period end.
  const expired = await prisma.subscription.findMany({
    where: {
      status: 'active',
      currentPeriodEnd: { lt: now },
    },
  });

  let downgraded = 0;
  for (const sub of expired) {
    if (!sub.companyId) continue;
    const zeroed: Record<string, number> = {};
    for (const flag of ALL_TOOL_FLAGS) zeroed[flag] = 0;
    await prisma.$transaction([
      prisma.company.update({
        where: { id: sub.companyId },
        data: { ...zeroed, subscriptionStatus: 'expired' },
      }),
      prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      }),
    ]);
    downgraded++;
  }

  // 2) Refill the monthly pool for active plans whose last refresh is older than
  //    the start of the current billing period.
  const active = await prisma.subscription.findMany({
    where: {
      status: 'active',
      monthlyCreditGrant: { gt: 0 },
      companyId: { not: null },
    },
  });

  let refilled = 0;
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  for (const sub of active) {
    // Refill when the pool hasn't been topped up in ~30 days (or never has).
    const lastRefresh = sub.creditsRefreshedAt;
    const due = !lastRefresh || now.getTime() - lastRefresh.getTime() >= THIRTY_DAYS;
    if (!due) continue;

    const grant = sub.monthlyCreditGrant;
    await prisma.$transaction([
      prisma.creditBalance.upsert({
        where: { companyId: sub.companyId! },
        update: { balance: grant },
        create: { companyId: sub.companyId!, balance: grant },
      }),
      prisma.creditTransaction.create({
        data: {
          companyId: sub.companyId!,
          type: 'credit',
          amount: grant,
          balanceAfter: grant,
          description: `${sub.planName || sub.plan}: monthly credit refresh`,
        },
      }),
      prisma.subscription.update({
        where: { id: sub.id },
        data: {
          creditsRefreshedAt: now,
          currentPeriodEnd: new Date(now.getTime() + THIRTY_DAYS),
        },
      }),
    ]);
    refilled++;
  }

  return { expired: downgraded, refilled };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await run();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('refresh-credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
