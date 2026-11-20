import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { expireToolSubscriptions } from '@/lib/tool-subscriptions';
import { expireWorkspaceSubscriptions } from '@/lib/workspace-subscriptions';
import { cronAuthorized, cronRejected } from '@/lib/security';

// POST/GET /api/cron/refresh-credits — monthly credit refill + expiry downgrade.
//
// Two axes of the subscription model, kept in sync every day:
//   1. Active plans whose month rolled over get their `monthlyCreditGrant`
//      refreshed (use-it-or-lose-it pool, like Qoder credits).
//   2. Plans past `currentPeriodEnd` that weren't renewed are marked expired and
//      every tool flag drops to 0 (locked) — the "darwaza band" case.
//
// The guard is the shared cron one: this rewrites billing state, so on the live
// deployment it refuses to run until CRON_SECRET is configured. Locally, with
// no secret set, it stays open so the scheduler URL keeps working.
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

  // 3) Expire per-tool subscriptions (Phase 4) past their period and re-sync the
  //    entitlement engine so the Phase 1 locks reflect it. Purely additive — the
  //    plan-bundle / int-flag path above is untouched.
  const toolExpiry = await expireToolSubscriptions(now);

  // 4) Expire workspace subscriptions past their period and drop them from
  //    Company.enabledVerticals so the à-la-carte workspaces re-lock.
  const wsExpiry = await expireWorkspaceSubscriptions(now);

  return {
    expired: downgraded,
    refilled,
    toolSubsExpired: toolExpiry.expired,
    toolSubsCompanies: toolExpiry.companies,
    workspaceSubsExpired: wsExpiry.expired,
    workspaceSubsCompanies: wsExpiry.companies,
  };
}

export async function GET(req: NextRequest) {
  const auth = cronAuthorized(req);
  if (!auth.ok) return cronRejected(auth.reason);
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
