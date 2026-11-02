import {
  Target, Warehouse, UserCheck, LifeBuoy, Layers, Landmark, Receipt, Radio,
  ShoppingBag, ReceiptText, Wrench, Truck,
} from 'lucide-react';

/**
 * Single source of truth for the platform's verticals (workspaces).
 * Each vertical owns a set of route prefixes; the sidebar, middleware,
 * sign-in branding and dashboard launchers all resolve through this list.
 */
export interface Vertical {
  key: 'crm' | 'supply' | 'people' | 'support' | 'workspace' | 'finance' | 'billing' |
    'marketing' | 'ecommerce' | 'pos' | 'manufacturing' | 'operations';
  /** Full branded title used on login pages and workspace headers, e.g. "AINOS CRM". */
  title: string;
  shortTitle: string;
  tagline: string;
  icon: React.ElementType;
  /** Tailwind gradient classes for the workspace tile / accent. */
  gradient: string;
  /** Where "Login to AINOS X" and the workspace tile land. */
  landingHref: string;
  /** Route prefixes owned by this vertical — longest prefix wins. */
  routePrefixes: string[];
}

export const VERTICALS: Vertical[] = [
  {
    key: 'crm',
    title: 'AINOS CRM',
    shortTitle: 'CRM',
    tagline: 'Turn leads into repeat business with pipelines, contacts and follow-ups.',
    icon: Target,
    gradient: 'from-violet-500 to-purple-600',
    landingHref: '/crm/leads',
    routePrefixes: ['/crm'],
  },
  {
    key: 'supply',
    title: 'AINOS Supply Chain',
    shortTitle: 'Supply Chain',
    tagline: 'Track stock, purchase orders, sales orders, vendors and warehouses in one place.',
    icon: Warehouse,
    gradient: 'from-blue-500 to-indigo-600',
    landingHref: '/inventory/stock',
    routePrefixes: ['/inventory'],
  },
  {
    key: 'people',
    title: 'AINOS People',
    shortTitle: 'People',
    tagline: 'Employees, attendance, payroll, recruitment and shift planning for your team.',
    icon: UserCheck,
    gradient: 'from-emerald-500 to-teal-600',
    landingHref: '/hr/employees',
    routePrefixes: ['/hr', '/planning'],
  },
  {
    key: 'support',
    title: 'AINOS Support',
    shortTitle: 'Support',
    tagline: 'Resolve customer issues with a helpdesk and a searchable knowledge base.',
    icon: LifeBuoy,
    gradient: 'from-cyan-500 to-blue-600',
    landingHref: '/support/helpdesk',
    routePrefixes: ['/support'],
  },
  {
    key: 'workspace',
    title: 'AINOS Workspace',
    shortTitle: 'Workspace',
    tagline: 'Run projects, calendars, approvals, reports and compliance as one team.',
    icon: Layers,
    gradient: 'from-indigo-500 to-violet-600',
    landingHref: '/projects',
    routePrefixes: ['/projects', '/calendar', '/team', '/automations', '/reports', '/approvals', '/compliance'],
  },
  {
    key: 'finance',
    title: 'AINOS Finance',
    shortTitle: 'Finance',
    tagline: 'GST billing, quotations, expenses, challans and Tally sync for Indian businesses.',
    icon: Landmark,
    gradient: 'from-purple-500 to-fuchsia-600',
    landingHref: '/dashboard/finance',
    routePrefixes: [
      '/dashboard/finance', '/invoices', '/customers', '/products',
      '/finance/expenses', '/finance/reminders', '/finance/quotes',
      '/finance/purchase-orders', '/finance/challans', '/finance/tally', '/finance/templates',
    ],
  },
  {
    key: 'billing',
    title: 'AINOS Accounting',
    shortTitle: 'Accounting',
    tagline: 'Daybook, GST reports, recurring invoices and a double-entry general ledger.',
    icon: Receipt,
    gradient: 'from-amber-500 to-orange-600',
    landingHref: '/finance/daybook',
    routePrefixes: [
      '/finance/daybook', '/finance/reports', '/finance/gst-reports',
      '/finance/recurring-invoices', '/finance/bank-accounts',
      '/finance/credit-notes', '/finance/debit-notes',
    ],
  },
  {
    key: 'marketing',
    title: 'AINOS Marketing',
    shortTitle: 'Marketing',
    tagline: 'Email campaigns, social media, SEO, blogs and branded invitations to grow your reach.',
    icon: Radio,
    gradient: 'from-pink-500 to-rose-600',
    landingHref: '/dashboard/marketing',
    routePrefixes: ['/dashboard/marketing', '/marketing'],
  },
  {
    key: 'ecommerce',
    title: 'AINOS eCommerce',
    shortTitle: 'eCommerce',
    tagline: 'Manage stores, catalogs, orders, coupons and reviews across channels.',
    icon: ShoppingBag,
    gradient: 'from-teal-500 to-emerald-600',
    landingHref: '/ecommerce/stores',
    routePrefixes: ['/ecommerce'],
  },
  {
    key: 'pos',
    title: 'AINOS Point of Sale',
    shortTitle: 'Point of Sale',
    tagline: 'Ring up sales at the counter with fast billing, sessions and daily reports.',
    icon: ReceiptText,
    gradient: 'from-sky-500 to-blue-600',
    landingHref: '/pos/sessions',
    routePrefixes: ['/pos'],
  },
  {
    key: 'manufacturing',
    title: 'AINOS Manufacturing',
    shortTitle: 'Manufacturing',
    tagline: 'Plan production, bills of materials and shop-floor workflows.',
    icon: Wrench,
    gradient: 'from-slate-500 to-gray-600',
    landingHref: '/manufacturing',
    routePrefixes: ['/manufacturing'],
  },
  {
    key: 'operations',
    title: 'AINOS Operations',
    shortTitle: 'Operations',
    tagline: 'Field service, maintenance, fleet, quality, repair and rental on one board.',
    icon: Truck,
    gradient: 'from-orange-500 to-red-600',
    landingHref: '/operations/field-service',
    routePrefixes: ['/operations', '/rental'],
  },
];

export const ALL_VERTICAL_KEYS: string[] = VERTICALS.map(v => v.key);

export function verticalByKey(key?: string | null): Vertical | null {
  if (!key) return null;
  return VERTICALS.find(v => v.key === key) ?? null;
}

/** Longest-prefix match of a pathname to its owning vertical; null = shared route. */
export function verticalForPath(pathname: string): Vertical | null {
  let best: Vertical | null = null;
  let bestLen = -1;
  for (const vertical of VERTICALS) {
    for (const prefix of vertical.routePrefixes) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        if (prefix.length > bestLen) {
          best = vertical;
          bestLen = prefix.length;
        }
      }
    }
  }
  return best;
}
