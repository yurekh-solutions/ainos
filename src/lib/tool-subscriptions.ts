import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { capabilityForKey, type Capability } from '@/lib/capabilities';
import type { CapabilityAccessMap } from '@/lib/entitlements';

/**
 * PER-TOOL SUBSCRIPTIONS (Phase 4 — Zoho-style à la carte billing).
 *
 * Each sellable tool is a capability (key = its NAV href), so the ledger feeds
 * straight into the Phase 1 entitlement engine. Nothing here removes the
 * existing plan-bundle / int-flag / credits flows — it only ADDS a per-tool
 * grant into Company.capabilityAccess. An absent key stays OPEN, so no current
 * customer is ever locked out by shipping this.
 */

export type ToolEdition = 1 | 2 | 3; // 1 basic (trial only), 2 standard, 3 premium
export type ToolCycle = 'monthly' | 'annual';

export interface ToolOffering {
  /** Capability key = the tool's NAV href. */
  key: string;
  label: string;
  vertical: string;
  /** INR per month for the Standard (edition 2) plan on a monthly cycle. */
  baseMonthlyInr: number;
}

/** Editions a customer can buy per tool, and their price multiplier on base. */
export const TOOL_EDITIONS: { level: ToolEdition; name: string; multiplier: number }[] = [
  { level: 2, name: 'Standard', multiplier: 1 },
  { level: 3, name: 'Premium', multiplier: 2.5 },
];

/** Annual = 10 months charged (2 months free), mirroring the module plans. */
const ANNUAL_MONTHS_CHARGED = 10;

/**
 * Curated à-la-carte menu. Every key MUST be a real NAV href so the entitlement
 * engine + sidebar lock rendering resolve it (capabilityForKey guards at build).
 */
export const TOOL_OFFERINGS: ToolOffering[] = [
  { key: '/invoices', label: 'Invoicing', vertical: 'finance', baseMonthlyInr: 799 },
  { key: '/finance/gst-reports', label: 'GST Reports', vertical: 'billing', baseMonthlyInr: 499 },
  { key: '/crm/leads', label: 'CRM — Leads', vertical: 'crm', baseMonthlyInr: 799 },
  { key: '/marketing/blog', label: 'AI Blog & Content', vertical: 'marketing', baseMonthlyInr: 599 },
  { key: '/marketing/campaigns', label: 'Email Campaigns', vertical: 'marketing', baseMonthlyInr: 599 },
  { key: '/marketing/seo', label: 'SEO Platform', vertical: 'marketing', baseMonthlyInr: 699 },
  { key: '/hr/employees', label: 'People & Payroll', vertical: 'people', baseMonthlyInr: 799 },
  { key: '/inventory/stock', label: 'Inventory', vertical: 'supply', baseMonthlyInr: 799 },
];

/** Guard: warn (never throw) if a catalog key isn't a known capability. */
function resolveCapability(key: string): Capability | null {
  return capabilityForKey(key);
}

/** Per-user monthly INR for an offering + edition (seats excluded). */
export function toolMonthlyInr(offering: ToolOffering, edition: ToolEdition, seats = 1): number {
  const mult = TOOL_EDITIONS.find((e) => e.level === edition)?.multiplier ?? 1;
  return Math.round(offering.baseMonthlyInr * mult * seats);
}

/** Amount charged, in paise, honouring the billing cycle and seat count. */
export function toolPriceMinor(offering: ToolOffering, edition: ToolEdition, cycle: ToolCycle, seats = 1): number {
  const monthly = toolMonthlyInr(offering, edition, seats);
  const inr = cycle === 'annual' ? monthly * ANNUAL_MONTHS_CHARGED : monthly;
  return inr * 100;
}

/** Seat bound shared by checkout + UI. */
export const MAX_TOOL_SEATS = 500;

/** Normalise a requested seat count to a safe integer >= 1. */
export function normSeats(n: number | undefined): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.min(v, MAX_TOOL_SEATS);
}

export interface SelectionInput {
  key: string;
  edition: ToolEdition;
  cycle: ToolCycle;
  /** Number of user seats; price scales linearly. Omitted/invalid = 1. */
  seats?: number;
}

/** Validate a requested selection against the catalog. */
function resolveSelection(sel: SelectionInput): { offering: ToolOffering; capability: Capability } | null {
  const offering = TOOL_OFFERINGS.find((o) => o.key === sel.key);
  if (!offering) return null;
  if (!TOOL_EDITIONS.some((e) => e.level === sel.edition)) return null;
  const cycle: ToolCycle = sel.cycle === 'annual' ? 'annual' : 'monthly';
  const capability = resolveCapability(offering.key);
  if (!capability) return null; // href no longer in navigation → refuse
  return { offering, capability };
}

/**
 * Recompute Company.capabilityAccess from the live ToolSubscription ledger and
 * persist it. The Phase 1 engine reads this map: a future `until` with a level
 * unlocks; a past `until` or level 0 locks; tools with no row are left absent
 * (OPEN) so unsubscribed-and-never-paid capabilities never change behaviour.
 */
export async function syncCompanyCapabilityAccess(companyId: string): Promise<CapabilityAccessMap> {
  const subs = await prisma.toolSubscription.findMany({ where: { companyId } });
  const now = Date.now();
  const map: CapabilityAccessMap = {};

  for (const s of subs) {
    // Pending = order created but unpaid → grant nothing (leave OPEN / unchanged).
    if (s.status === 'pending') continue;
    const ended =
      s.status === 'expired' ||
      !s.currentPeriodEnd ||
      s.currentPeriodEnd.getTime() < now;
    map[s.capabilityKey] = {
      // Expired/cancelled-past-period → level 0 so the engine reports 'expired'
      // and locks it; while still within the paid period → the bought edition.
      level: ended ? 0 : s.edition,
      until: s.currentPeriodEnd ? s.currentPeriodEnd.toISOString() : null,
    };
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { capabilityAccess: map as unknown as Prisma.InputJsonValue },
  });
  return map;
}

export interface CheckoutIntent {
  orderId: string | null;   // null when Razorpay isn't configured → direct activation
  amountMinor: number;
  currency: string;
  keyId: string | null;
  lineItems: { key: string; label: string; edition: ToolEdition; cycle: ToolCycle; seats: number; monthlyInr: number; chargeInr: number }[];
  directlyActivated: boolean;
}

/**
 * Build one consolidated order across the requested tools: creates a pending
 * ToolSubscription per capability (upsert, since a tool is unique per company),
 * then a single Razorpay order for the total. If Razorpay isn't configured we
 * fall back to direct activation — mirroring the existing marketing-stub UX —
 * so this is testable on live before the payment account is connected.
 */
export async function createToolCheckout(
  companyId: string,
  selections: SelectionInput[],
  createOrder: (amountMinor: number, receipt: string) => Promise<{ id: string }>,
): Promise<CheckoutIntent> {
  const unique = dedupeSelections(selections);
  if (unique.length === 0) throw new Error('Select at least one tool');

  const resolved = unique
    .map((s) => ({ input: s, r: resolveSelection(s) }))
    .filter((x) => x.r !== null) as {
    input: SelectionInput;
    r: { offering: ToolOffering; capability: Capability };
  }[];
  if (resolved.length === 0) throw new Error('No valid tools selected');

  const lineItems = resolved.map(({ input, r }) => {
    const seats = normSeats(input.seats);
    const cycle = (input.cycle === 'annual' ? 'annual' : 'monthly') as ToolCycle;
    const chargeMinor = toolPriceMinor(r.offering, input.edition, cycle, seats);
    return {
      key: r.offering.key,
      label: r.offering.label,
      edition: input.edition,
      cycle,
      seats,
      monthlyInr: toolMonthlyInr(r.offering, input.edition, seats),
      chargeInr: chargeMinor / 100,
      chargeMinor,
    };
  });

  const totalMinor = lineItems.reduce((sum, li) => sum + li.chargeMinor, 0);

  // Record the pending ledger rows first (so nothing grants access until paid).
  for (const li of lineItems) {
    const r = resolved.find((x) => x.r.offering.key === li.key)!.r;
    await prisma.toolSubscription.upsert({
      where: { companyId_capabilityKey: { companyId, capabilityKey: li.key } },
      update: {
        label: r.offering.label,
        edition: li.edition,
        billingCycle: li.cycle,
        priceMinor: li.chargeMinor,
        currency: 'INR',
        seats: li.seats,
        status: 'pending',
        orderId: null,
      },
      create: {
        companyId,
        capabilityKey: li.key,
        label: r.offering.label,
        edition: li.edition,
        billingCycle: li.cycle,
        priceMinor: li.chargeMinor,
        currency: 'INR',
        seats: li.seats,
        status: 'pending',
      },
    });
  }

  // Razorpay not wired yet → activate immediately (same as marketing stub path).
  const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  if (!razorpayConfigured) {
    await settleToolSubscriptionsByCompany(companyId, lineItems.map((li) => li.key), 'dev_stub');
    return {
      orderId: null,
      amountMinor: totalMinor,
      currency: 'INR',
      keyId: null,
      lineItems: lineItems.map(({ chargeMinor, ...rest }) => rest),
      directlyActivated: true,
    };
  }

  const receipt = `tools_${companyId}_${Date.now()}`;
  const order = await createOrder(totalMinor, receipt);

  // Link every pending row to the single consolidated order id.
  await prisma.toolSubscription.updateMany({
    where: { companyId, capabilityKey: { in: lineItems.map((li) => li.key) }, status: 'pending' },
    data: { orderId: order.id },
  });

  return {
    orderId: order.id,
    amountMinor: totalMinor,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID ?? null,
    lineItems: lineItems.map(({ chargeMinor, ...rest }) => rest),
    directlyActivated: false,
  };
}

/**
 * Activate the given tool rows for a company and re-sync the engine map.
 * Idempotent: only flips rows still in 'pending', keyed by order id (payment
 * settlement never trusts the amount). Called from the verify endpoint and, in
 * the stub path, directly.
 */
export async function settleToolSubscriptionsByOrder(
  companyId: string,
  orderId: string,
  paymentId: string,
): Promise<{ activated: number }> {
  const now = new Date();
  const pending = await prisma.toolSubscription.findMany({
    where: { companyId, orderId, status: 'pending' },
  });

  let activated = 0;
  for (const s of pending) {
    const periodEnd = addCycle(now, s.billingCycle as ToolCycle);
    // Conditional claim: a replayed webhook/web-confirm finds nothing to flip.
    const claimed = await prisma.toolSubscription.updateMany({
      where: { id: s.id, status: 'pending' },
      data: { status: 'active', paymentId, startedAt: now, currentPeriodEnd: periodEnd },
    });
    if (claimed.count > 0) activated++;
  }

  if (activated > 0) await syncCompanyCapabilityAccess(companyId);
  return { activated };
}

async function settleToolSubscriptionsByCompany(
  companyId: string,
  keys: string[],
  paymentId: string,
): Promise<void> {
  const now = new Date();
  const pending = await prisma.toolSubscription.findMany({
    where: { companyId, capabilityKey: { in: keys }, status: 'pending' },
  });
  for (const s of pending) {
    await prisma.toolSubscription.update({
      where: { id: s.id },
      data: {
        status: 'active',
        paymentId,
        startedAt: now,
        currentPeriodEnd: addCycle(now, s.billingCycle as ToolCycle),
      },
    });
  }
  await syncCompanyCapabilityAccess(companyId);
}

/** Cancel: stops renewal but keeps access until the paid period ends (no wipe). */
export async function cancelToolSubscription(companyId: string, key: string): Promise<void> {
  await prisma.toolSubscription.updateMany({
    where: { companyId, capabilityKey: key, status: 'active' },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });
  await syncCompanyCapabilityAccess(companyId);
}

/**
 * Cron helper: mark active/cancelled subs past their period as expired and
 * re-sync affected companies so the engine locks them. Returns counts.
 */
export async function expireToolSubscriptions(now = new Date()): Promise<{ companies: number; expired: number }> {
  const overdue = await prisma.toolSubscription.findMany({
    where: {
      status: { in: ['active', 'cancelled'] },
      currentPeriodEnd: { lt: now },
    },
    select: { companyId: true },
  });

  if (overdue.length === 0) return { companies: 0, expired: 0 };

  const companyIds = [...new Set(overdue.map((o) => o.companyId))];
  await prisma.toolSubscription.updateMany({
    where: { companyId: { in: companyIds }, status: { in: ['active', 'cancelled'] }, currentPeriodEnd: { lt: now } },
    data: { status: 'expired' },
  });
  for (const id of companyIds) await syncCompanyCapabilityAccess(id);
  return { companies: companyIds.length, expired: overdue.length };
}

export interface ToolSubscriptionView {
  key: string;
  label: string;
  vertical: string;
  monthlyInr: number;
  editions: { level: ToolEdition; name: string; priceMonthlyInr: number }[];
  subscription: {
    status: string;
    edition: number;
    billingCycle: string;
    currentPeriodEnd: Date | null;
    seats: number;
  } | null;
}

/** Catalog + this company's live subscription state, for the /billing UI. */
export async function listToolOfferingsForCompany(companyId: string): Promise<ToolSubscriptionView[]> {
  const subs = await prisma.toolSubscription.findMany({ where: { companyId } });
  const byKey = new Map(subs.map((s) => [s.capabilityKey, s]));
  return TOOL_OFFERINGS.map((o) => {
    const s = byKey.get(o.key);
    const live = s && (s.status === 'active' || (s.status === 'cancelled' && s.currentPeriodEnd && s.currentPeriodEnd > new Date()));
    return {
      key: o.key,
      label: o.label,
      vertical: o.vertical,
      monthlyInr: o.baseMonthlyInr,
      editions: TOOL_EDITIONS.map((e) => ({ level: e.level, name: e.name, priceMonthlyInr: toolMonthlyInr(o, e.level) })),
      subscription: s
        ? {
            status: live ? 'active' : s.status,
            edition: s.edition,
            billingCycle: s.billingCycle,
            currentPeriodEnd: s.currentPeriodEnd,
            seats: s.seats ?? 1,
          }
        : null,
    };
  });
}

function dedupeSelections(selections: SelectionInput[]): SelectionInput[] {
  const seen = new Map<string, SelectionInput>();
  for (const s of selections) if (s && s.key && !seen.has(s.key)) seen.set(s.key, s);
  return [...seen.values()];
}

function addCycle(from: Date, cycle: ToolCycle): Date {
  const d = new Date(from);
  if (cycle === 'annual') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}
