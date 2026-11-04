import { prisma } from '@/lib/prisma';
import {
  WORKSPACE_OFFERINGS,
  getWorkspaceOffering,
  workspacePriceMinor,
  normWorkspaceSeats,
  WORKSPACE_CURRENCY,
  type WorkspaceCycle,
  type WorkspaceOffering,
} from '@/lib/workspace-pricing';

/**
 * WORKSPACE SUBSCRIPTIONS — à la carte unlock at VERTICAL granularity.
 *
 * One row per purchasable workspace (key = the vertical key the entitlement
 * engine gates on, e.g. "crm"). An ACTIVE row (within its paid period) unions
 * its vertical into Company.enabledVerticals, which is exactly what
 * @/lib/entitlements reads to open a workspace; expiry drops it back out and the
 * workspace re-locks. Only meaningful for aLaCarteEnabled companies — legacy
 * companies keep the "empty = all open" convention and are never rewritten here.
 *
 * The catalog + pricing math live in @/lib/workspace-pricing (client-safe) and
 * are re-exported here so server callers have one import. Nothing here removes
 * the existing plan-bundle / int-flag / credits / per-tool flows — purely
 * additive, mirroring @/lib/tool-subscriptions.
 */
export {
  WORKSPACE_OFFERINGS,
  getWorkspaceOffering,
  workspacePriceMinor,
  type WorkspaceCycle,
  type WorkspaceOffering,
} from '@/lib/workspace-pricing';

export interface WorkspaceSelectionInput {
  key: string;
  cycle: WorkspaceCycle;
  seats?: number;
}

export interface WorkspaceCheckoutIntent {
  orderId: string | null;   // null when Razorpay isn't configured → direct activation
  amountMinor: number;
  currency: string;
  keyId: string | null;
  lineItems: { key: string; label: string; cycle: WorkspaceCycle; seats: number; monthlyUsd: number; chargeUsd: number }[];
  directlyActivated: boolean;
}

/**
 * Recompute Company.enabledVerticals from the live WorkspaceSubscription ledger
 * for an à-la-carte company. Legacy companies are left untouched (their empty
 * set means "all open"). An active row within its paid period grants its key.
 */
export async function syncCompanyWorkspaces(companyId: string): Promise<string[]> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { aLaCarteEnabled: true },
  });
  if (!company?.aLaCarteEnabled) return [];

  const subs = await prisma.workspaceSubscription.findMany({ where: { companyId } });
  const now = Date.now();
  const granted = subs
    .filter((s) =>
      (s.status === 'active' || s.status === 'cancelled') &&
      s.currentPeriodEnd &&
      s.currentPeriodEnd.getTime() > now)
    .map((s) => s.verticalKey);

  await prisma.company.update({ where: { id: companyId }, data: { enabledVerticals: granted } });
  return granted;
}

/**
 * Build one consolidated order across the requested workspaces: creates a
 * pending WorkspaceSubscription per vertical (upsert, unique per company), then
 * a single Razorpay order for the total. If Razorpay isn't configured we fall
 * back to direct activation, so the flow is testable on live before the payment
 * account is connected.
 */
export async function createWorkspaceCheckout(
  companyId: string,
  selections: WorkspaceSelectionInput[],
  createOrder: (amountMinor: number, receipt: string) => Promise<{ id: string }>,
): Promise<WorkspaceCheckoutIntent> {
  const unique = dedupeSelections(selections);
  if (unique.length === 0) throw new Error('Select at least one workspace');

  const resolved = unique
    .map((s) => ({ input: s, offering: getWorkspaceOffering(s.key) }))
    .filter((x) => x.offering !== null) as {
    input: WorkspaceSelectionInput;
    offering: WorkspaceOffering;
  }[];
  if (resolved.length === 0) throw new Error('No valid workspaces selected');

  const lineItems = resolved.map(({ input, offering }) => {
    const seats = normWorkspaceSeats(input.seats);
    const cycle: WorkspaceCycle = input.cycle === 'annual' ? 'annual' : 'monthly';
    const chargeMinor = workspacePriceMinor(offering.key, cycle, seats);
    return {
      key: offering.key,
      label: offering.label,
      cycle,
      seats,
      monthlyUsd: offering.monthlyUsd * seats,
      chargeUsd: chargeMinor / 100,
      chargeMinor,
    };
  });

  const totalMinor = lineItems.reduce((sum, li) => sum + li.chargeMinor, 0);

  // Record pending rows first (so nothing grants access until paid).
  for (const li of lineItems) {
    await prisma.workspaceSubscription.upsert({
      where: { companyId_verticalKey: { companyId, verticalKey: li.key } },
      update: {
        label: li.label,
        billingCycle: li.cycle,
        priceMinor: li.chargeMinor,
        currency: WORKSPACE_CURRENCY,
        seats: li.seats,
        status: 'pending',
        orderId: null,
      },
      create: {
        companyId,
        verticalKey: li.key,
        label: li.label,
        billingCycle: li.cycle,
        priceMinor: li.chargeMinor,
        currency: WORKSPACE_CURRENCY,
        seats: li.seats,
        status: 'pending',
      },
    });
  }

  // Razorpay not wired yet → activate immediately (same guard as the tool path).
  const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  if (!razorpayConfigured) {
    await settleWorkspaceSubscriptionsByCompany(companyId, lineItems.map((li) => li.key), 'dev_stub');
    return {
      orderId: null,
      amountMinor: totalMinor,
      currency: WORKSPACE_CURRENCY,
      keyId: null,
      lineItems: lineItems.map(({ chargeMinor, ...rest }) => rest),
      directlyActivated: true,
    };
  }

  const receipt = `workspaces_${companyId}_${Date.now()}`;
  const order = await createOrder(totalMinor, receipt);

  // Link every pending row to the single consolidated order id.
  await prisma.workspaceSubscription.updateMany({
    where: { companyId, verticalKey: { in: lineItems.map((li) => li.key) }, status: 'pending' },
    data: { orderId: order.id },
  });

  return {
    orderId: order.id,
    amountMinor: totalMinor,
    currency: WORKSPACE_CURRENCY,
    keyId: process.env.RAZORPAY_KEY_ID ?? null,
    lineItems: lineItems.map(({ chargeMinor, ...rest }) => rest),
    directlyActivated: false,
  };
}

/**
 * Activate the given workspace rows for a company and re-sync the engine map.
 * Idempotent: only flips rows still in 'pending', keyed by order id (settlement
 * never trusts the amount). Called from the verify endpoint and the webhook.
 */
export async function settleWorkspaceSubscriptionsByOrder(
  companyId: string,
  orderId: string,
  paymentId: string,
): Promise<{ activated: number }> {
  const now = new Date();
  const pending = await prisma.workspaceSubscription.findMany({
    where: { companyId, orderId, status: 'pending' },
  });

  let activated = 0;
  for (const s of pending) {
    const claimed = await prisma.workspaceSubscription.updateMany({
      where: { id: s.id, status: 'pending' },
      data: { status: 'active', paymentId, startedAt: now, currentPeriodEnd: addCycle(now, s.billingCycle as WorkspaceCycle) },
    });
    if (claimed.count > 0) activated++;
  }

  if (activated > 0) await syncCompanyWorkspaces(companyId);
  return { activated };
}

async function settleWorkspaceSubscriptionsByCompany(
  companyId: string,
  keys: string[],
  paymentId: string,
): Promise<void> {
  const now = new Date();
  const pending = await prisma.workspaceSubscription.findMany({
    where: { companyId, verticalKey: { in: keys }, status: 'pending' },
  });
  for (const s of pending) {
    await prisma.workspaceSubscription.update({
      where: { id: s.id },
      data: { status: 'active', paymentId, startedAt: now, currentPeriodEnd: addCycle(now, s.billingCycle as WorkspaceCycle) },
    });
  }
  await syncCompanyWorkspaces(companyId);
}

/** Cancel: stops renewal but keeps access until the paid period ends (no wipe). */
export async function cancelWorkspaceSubscription(companyId: string, key: string): Promise<void> {
  await prisma.workspaceSubscription.updateMany({
    where: { companyId, verticalKey: key, status: 'active' },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });
  await syncCompanyWorkspaces(companyId);
}

/**
 * Cron helper: mark active/cancelled rows past their period as expired and
 * re-sync affected companies so the engine re-locks them. Returns counts.
 */
export async function expireWorkspaceSubscriptions(now = new Date()): Promise<{ companies: number; expired: number }> {
  const overdue = await prisma.workspaceSubscription.findMany({
    where: {
      status: { in: ['active', 'cancelled'] },
      currentPeriodEnd: { lt: now },
    },
    select: { companyId: true },
  });

  if (overdue.length === 0) return { companies: 0, expired: 0 };

  const companyIds = [...new Set(overdue.map((o) => o.companyId))];
  await prisma.workspaceSubscription.updateMany({
    where: { companyId: { in: companyIds }, status: { in: ['active', 'cancelled'] }, currentPeriodEnd: { lt: now } },
    data: { status: 'expired' },
  });
  for (const id of companyIds) await syncCompanyWorkspaces(id);
  return { companies: companyIds.length, expired: overdue.length };
}

export interface WorkspaceSubscriptionView {
  key: string;
  label: string;
  monthlyUsd: number;
  subscription: {
    status: string;
    billingCycle: string;
    currentPeriodEnd: Date | null;
    seats: number;
  } | null;
}

/** Catalog + this company's live workspace subscription state, for the UI. */
export async function listWorkspaceOfferingsForCompany(companyId: string): Promise<WorkspaceSubscriptionView[]> {
  const subs = await prisma.workspaceSubscription.findMany({ where: { companyId } });
  const byKey = new Map(subs.map((s) => [s.verticalKey, s]));
  return WORKSPACE_OFFERINGS.map((o) => {
    const s = byKey.get(o.key);
    const live = s && (s.status === 'active' || (s.status === 'cancelled' && s.currentPeriodEnd && s.currentPeriodEnd > new Date()));
    return {
      key: o.key,
      label: o.label,
      monthlyUsd: o.monthlyUsd,
      subscription: s
        ? {
            status: live ? 'active' : s.status,
            billingCycle: s.billingCycle,
            currentPeriodEnd: s.currentPeriodEnd,
            seats: s.seats ?? 1,
          }
        : null,
    };
  });
}

function dedupeSelections(selections: WorkspaceSelectionInput[]): WorkspaceSelectionInput[] {
  const seen = new Map<string, WorkspaceSelectionInput>();
  for (const s of selections) if (s && s.key && !seen.has(s.key)) seen.set(s.key, s);
  return [...seen.values()];
}

function addCycle(from: Date, cycle: WorkspaceCycle): Date {
  const d = new Date(from);
  if (cycle === 'annual') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}
