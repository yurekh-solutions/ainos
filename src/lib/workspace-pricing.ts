/**
 * WORKSPACE PRICING — pure, client-safe catalog (NO server imports).
 *
 * Kept separate from @/lib/workspace-subscriptions (which imports Prisma) so
 * client components (dashboard tiles, pricing pages) can render prices without
 * pulling the DB layer into the browser bundle. The ledger re-uses these exact
 * helpers, so there is a single source of truth for workspace prices.
 */

export type WorkspaceCycle = 'monthly' | 'annual';

export interface WorkspaceOffering {
  /** Vertical key from @/lib/verticals — the thing the entitlement engine gates on. */
  key: string;
  label: string;
  monthlyInr: number;
}

/** Annual = 10 months charged (2 months free), mirroring the module/tool plans. */
export const ANNUAL_MONTHS_CHARGED = 10;

/** Curated workspace menu. Every key MUST be a real vertical key. */
export const WORKSPACE_OFFERINGS: WorkspaceOffering[] = [
  { key: 'crm', label: 'AINOS CRM', monthlyInr: 999 },
  { key: 'supply', label: 'AINOS Supply Chain', monthlyInr: 999 },
  { key: 'people', label: 'AINOS People', monthlyInr: 799 },
  { key: 'support', label: 'AINOS Support', monthlyInr: 499 },
  { key: 'workspace', label: 'AINOS Workspace', monthlyInr: 599 },
  { key: 'finance', label: 'AINOS Finance', monthlyInr: 1499 },
  { key: 'billing', label: 'AINOS Accounting', monthlyInr: 999 },
  { key: 'marketing', label: 'AINOS Marketing', monthlyInr: 1299 },
  { key: 'ecommerce', label: 'AINOS eCommerce', monthlyInr: 999 },
  { key: 'pos', label: 'AINOS Point of Sale', monthlyInr: 499 },
  { key: 'manufacturing', label: 'AINOS Manufacturing', monthlyInr: 999 },
  { key: 'operations', label: 'AINOS Operations', monthlyInr: 799 },
];

export function getWorkspaceOffering(key: string): WorkspaceOffering | null {
  return WORKSPACE_OFFERINGS.find((o) => o.key === key) ?? null;
}

export const MAX_WORKSPACE_SEATS = 500;

export function normWorkspaceSeats(n: number | undefined): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.min(v, MAX_WORKSPACE_SEATS);
}

/** Monthly INR for a workspace, honouring seat count. */
export function workspaceMonthlyInr(key: string, seats = 1): number {
  const offering = getWorkspaceOffering(key);
  if (!offering) return 0;
  return offering.monthlyInr * normWorkspaceSeats(seats);
}

/** Amount charged, in paise, honouring the billing cycle and seat count. */
export function workspacePriceMinor(key: string, cycle: WorkspaceCycle, seats = 1): number {
  const monthly = workspaceMonthlyInr(key, seats);
  const inr = cycle === 'annual' ? monthly * ANNUAL_MONTHS_CHARGED : monthly;
  return inr * 100;
}
