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
  /** USD per seat, per month. */
  monthlyUsd: number;
}

/** Billing currency for the whole à-la-carte workspace menu. */
export const WORKSPACE_CURRENCY = 'USD';

/** Annual = 10 months charged (2 months free), mirroring the module/tool plans. */
export const ANNUAL_MONTHS_CHARGED = 10;

/** Curated workspace menu. Every key MUST be a real vertical key. */
export const WORKSPACE_OFFERINGS: WorkspaceOffering[] = [
  { key: 'crm', label: 'AINOS CRM', monthlyUsd: 29 },
  { key: 'supply', label: 'AINOS Supply Chain', monthlyUsd: 25 },
  { key: 'people', label: 'AINOS People', monthlyUsd: 20 },
  { key: 'support', label: 'AINOS Support', monthlyUsd: 18 },
  { key: 'workspace', label: 'AINOS Workspace', monthlyUsd: 15 },
  { key: 'finance', label: 'AINOS Finance', monthlyUsd: 39 },
  { key: 'billing', label: 'AINOS Accounting', monthlyUsd: 29 },
  { key: 'marketing', label: 'AINOS Marketing', monthlyUsd: 45 },
  { key: 'ecommerce', label: 'AINOS eCommerce', monthlyUsd: 29 },
  { key: 'pos', label: 'AINOS Point of Sale', monthlyUsd: 15 },
  { key: 'manufacturing', label: 'AINOS Manufacturing', monthlyUsd: 32 },
  { key: 'operations', label: 'AINOS Operations', monthlyUsd: 22 },
];

export function getWorkspaceOffering(key: string): WorkspaceOffering | null {
  return WORKSPACE_OFFERINGS.find((o) => o.key === key) ?? null;
}

/**
 * One-line blurb per tool, shown on the workspace pricing page. Keyed by the
 * tool's NAV href so it stays in sync with navigation without touching it.
 */
export const WORKSPACE_TOOL_BLURBS: Record<string, string> = {
  // CRM
  '/crm/leads': 'Capture, qualify and nurture leads.',
  '/crm/deals': 'Track pipelines and close faster.',
  '/crm/contacts': 'One place for every relationship.',
  '/crm/follow-ups': 'Never miss a customer touchpoint.',
  // Supply Chain
  '/inventory/stock': 'Manage your inventory in real time.',
  '/inventory/orders': 'Create and track purchase orders.',
  '/inventory/sales-orders': 'Handle customer orders smoothly.',
  '/inventory/vendors': 'Manage suppliers and vendors.',
  '/inventory/warehouses': 'Track warehouse operations.',
  // People
  '/hr/employees': 'Your complete employee directory.',
  '/hr/attendance': 'Mark and review attendance.',
  '/planning': 'Shift and resource planning.',
  '/hr/leaves': 'Apply and approve time off.',
  '/hr/payroll': 'Run payroll, payslips and taxes.',
  '/hr/recruitment': 'Manage your hiring pipeline.',
  '/hr/timesheet': 'Log and review timesheets.',
  // Support
  '/support/helpdesk': 'Resolve tickets and queries.',
  '/support/knowledge-base': 'Self-serve articles and FAQs.',
  // Workspace
  '/projects': 'Plan, track and deliver work.',
  '/calendar': 'Shared schedule and events.',
  '/team': 'Organise teams and roles.',
  '/automations': 'Automate repetitive workflows.',
  '/reports': 'Dashboards across your work.',
  '/approvals': 'Route requests for sign-off.',
  '/compliance/documents': 'Store and track compliance docs.',
  // Finance
  '/invoices': 'Create and send GST invoices.',
  '/customers': 'Manage your customer records.',
  '/finance/expenses': 'Track business spending.',
  '/finance/reminders': 'Follow up on pending payments.',
  '/products': 'Catalogue products and pricing.',
  '/finance/quotes': 'Send quotations, win deals.',
  '/finance/purchase-orders': 'Raise and track purchase orders.',
  '/finance/challans': 'Generate delivery challans.',
  '/finance/tally': 'Export to Tally and Excel.',
  '/finance/templates': 'Design your invoice letterhead.',
  // Accounting
  '/finance/daybook': 'Your daily cash and bank book.',
  '/finance/reports': 'Profit, loss and financial reports.',
  '/finance/gst-reports': 'GST summaries and filings.',
  '/finance/recurring-invoices': 'Automate repeat billing.',
  '/finance/bank-accounts': 'Reconcile bank accounts.',
  '/finance/credit-notes': 'Issue credit notes.',
  '/finance/debit-notes': 'Issue debit notes.',
  // Marketing
  '/marketing/campaigns': 'Design and send email campaigns.',
  '/marketing/social-media': 'Plan and publish social posts.',
  '/marketing/seo': 'Rank higher with SEO insights.',
  '/marketing/blog': 'Generate blogs and content.',
  '/marketing/invitations': 'Send event invitations.',
  // eCommerce
  '/ecommerce/stores': 'Connect and run your stores.',
  '/ecommerce/products': 'Sync your product catalog.',
  '/ecommerce/orders': 'Track orders across channels.',
  '/ecommerce/customers': 'Manage store customers.',
  '/ecommerce/analytics': 'Sales and traffic insights.',
  '/ecommerce/coupons': 'Create discount coupons.',
  '/ecommerce/reviews': 'Monitor product reviews.',
  '/ecommerce/settings': 'Configure your storefront.',
  // Point of Sale
  '/pos/sessions': 'Open and close billing sessions.',
  '/pos/register': 'Fast counter billing.',
  '/pos/orders': 'View and manage orders.',
  '/pos/products': 'Set up menu and products.',
  '/pos/reports': 'Daily sales reports.',
  // Manufacturing
  '/manufacturing': 'Plan, produce and track jobs.',
  // Operations
  '/operations/field-service': 'Dispatch and track field jobs.',
  '/operations/maintenance': 'Schedule maintenance plans.',
  '/operations/fleet': 'Manage vehicles and trips.',
  '/operations/quality': 'Track quality checks.',
  '/operations/repair': 'Handle repair orders.',
  '/rental': 'Manage rentals and assets.',
};

/** Blurb for a tool href, with a safe fallback so a card is never empty. */
export function toolBlurb(href: string, label: string): string {
  return WORKSPACE_TOOL_BLURBS[href] ?? `Everything your team needs for ${label.toLowerCase()}.`;
}

export const MAX_WORKSPACE_SEATS = 500;

export function normWorkspaceSeats(n: number | undefined): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.min(v, MAX_WORKSPACE_SEATS);
}

/** Monthly USD for a workspace, honouring seat count. */
export function workspaceMonthlyUsd(key: string, seats = 1): number {
  const offering = getWorkspaceOffering(key);
  if (!offering) return 0;
  return offering.monthlyUsd * normWorkspaceSeats(seats);
}

/** Amount charged, in cents (USD minor units), honouring the billing cycle and seat count. */
export function workspacePriceMinor(key: string, cycle: WorkspaceCycle, seats = 1): number {
  const monthly = workspaceMonthlyUsd(key, seats);
  const usd = cycle === 'annual' ? monthly * ANNUAL_MONTHS_CHARGED : monthly;
  return Math.round(usd * 100);
}
