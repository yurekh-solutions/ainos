import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============ Types (previously from Mongoose Subscription model) ============

// ============ Module Plans (USD pricing with credit system) ============

export type ModuleKey = 'finance' | 'marketing';
export type TierKey = 'starter' | 'professional' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

export interface ModulePlan {
  module: ModuleKey;
  tier: TierKey;
  name: string;
  monthlyUsd: number;
  annualUsd: number;   // total per year (2 months free)
  creditsIncluded: number;
  features: string[];
}

export interface ComboPlan {
  tier: TierKey;
  name: string;
  monthlyUsd: number;
  annualUsd: number;
  creditsIncluded: number;
  modules: ModuleKey[];
  features: string[];
}

// ---- Finance Module Plans ----
export const FINANCE_PLANS: Record<TierKey, ModulePlan> = {
  starter: {
    module: 'finance', tier: 'starter',
    name: 'Finance Starter',
    monthlyUsd: 9, annualUsd: 90,
    creditsIncluded: 500,
    features: ['Invoicing', 'Quotes', 'Expenses', 'GST Reports', 'PDF Download', 'Payment Reminders'],
  },
  professional: {
    module: 'finance', tier: 'professional',
    name: 'Finance Professional',
    monthlyUsd: 29, annualUsd: 290,
    creditsIncluded: 2000,
    features: ['Everything in Starter', 'Payment Recovery Agent', 'Bank Reconciliation', 'Tally Export', 'Multi-currency', 'Priority Support'],
  },
  enterprise: {
    module: 'finance', tier: 'enterprise',
    name: 'Finance Enterprise',
    monthlyUsd: 79, annualUsd: 790,
    creditsIncluded: 10000,
    features: ['Everything in Professional', 'Multi-branch', 'Custom GST Reports', 'API Access', 'Dedicated Account Manager'],
  },
};

// ---- Marketing Module Plans ----
export const MARKETING_PLANS: Record<TierKey, ModulePlan> = {
  starter: {
    module: 'marketing', tier: 'starter',
    name: 'Marketing Starter',
    monthlyUsd: 12, annualUsd: 120,
    creditsIncluded: 300,
    features: ['AI Blog Generator', 'Email Campaigns', 'SEO Audit', 'Social Captions', 'Invitations'],
  },
  professional: {
    module: 'marketing', tier: 'professional',
    name: 'Marketing Professional',
    monthlyUsd: 39, annualUsd: 390,
    creditsIncluded: 1500,
    features: ['Everything in Starter', 'Competitor Analysis', 'Drip Campaigns', 'Content Repurpose', 'Lead Magnets', 'Priority Support'],
  },
  enterprise: {
    module: 'marketing', tier: 'enterprise',
    name: 'Marketing Enterprise',
    monthlyUsd: 99, annualUsd: 990,
    creditsIncluded: 8000,
    features: ['Everything in Professional', 'White-label Reports', 'API Access', 'Custom Integrations', 'Dedicated Account Manager'],
  },
};

// ---- Combo Plans (Finance + Marketing together) ----
export const COMBO_PLANS: Record<TierKey, ComboPlan> = {
  starter: {
    tier: 'starter', name: 'Starter Combo',
    monthlyUsd: 17, annualUsd: 170,
    creditsIncluded: 800,
    modules: ['finance', 'marketing'],
    features: ['Finance Starter', 'Marketing Starter', 'Save $4/mo vs separate'],
  },
  professional: {
    tier: 'professional', name: 'Pro Combo',
    monthlyUsd: 55, annualUsd: 550,
    creditsIncluded: 3500,
    modules: ['finance', 'marketing'],
    features: ['Finance Professional', 'Marketing Professional', 'Save $13/mo vs separate'],
  },
  enterprise: {
    tier: 'enterprise', name: 'Enterprise Combo',
    monthlyUsd: 149, annualUsd: 1490,
    creditsIncluded: 18000,
    modules: ['finance', 'marketing'],
    features: ['Finance Enterprise', 'Marketing Enterprise', 'Save $28/mo vs separate'],
  },
};

export const ALL_MODULE_KEYS: ModuleKey[] = ['finance', 'marketing'];
export const ALL_TIER_KEYS: TierKey[] = ['starter', 'professional', 'enterprise'];

// ============ Per-Tool Credit Costs ============

export const TOOL_CREDIT_COSTS: Record<string, { credits: number; category: 'manual' | 'semi-auto' | 'ai' }> = {
  // Finance tools
  'create-invoice':        { credits: 2,  category: 'manual' },
  'create-quote':         { credits: 2,  category: 'manual' },
  'download-pdf':         { credits: 1,  category: 'manual' },
  'send-invoice-email':   { credits: 3,  category: 'semi-auto' },
  'whatsapp-reminder':    { credits: 5,  category: 'semi-auto' },
  'mark-as-paid':         { credits: 1,  category: 'manual' },
  'gst-report':           { credits: 15, category: 'semi-auto' },
  'tally-export':         { credits: 10, category: 'semi-auto' },
  'expense-entry':        { credits: 2,  category: 'manual' },
  'profit-loss-report':   { credits: 10, category: 'semi-auto' },
  'barcode-generate':     { credits: 3,  category: 'manual' },
  'payment-recovery':     { credits: 8,  category: 'semi-auto' },
  'bank-reconciliation':  { credits: 12, category: 'semi-auto' },
  'recurring-invoice':    { credits: 3,  category: 'semi-auto' },
  'purchase-order':       { credits: 2,  category: 'manual' },
  'delivery-challan':     { credits: 2,  category: 'manual' },
  'credit-debit-note':    { credits: 2,  category: 'manual' },
  'journal-entry':        { credits: 3,  category: 'manual' },
  'daybook-report':       { credits: 5,  category: 'semi-auto' },
  // Marketing tools
  'ai-blog-generate':     { credits: 25, category: 'ai' },
  'ai-blog-seo':          { credits: 35, category: 'ai' },
  'ai-blog-translate':    { credits: 15, category: 'ai' },
  'email-campaign-send':  { credits: 10, category: 'semi-auto' },
  'seo-site-audit':       { credits: 30, category: 'ai' },
  'seo-keyword-research': { credits: 20, category: 'ai' },
  'seo-competitor':       { credits: 25, category: 'ai' },
  'social-caption':       { credits: 10, category: 'ai' },
  'social-caption-image': { credits: 20, category: 'ai' },
  'instagram-plan':       { credits: 15, category: 'ai' },
  'drip-campaign':        { credits: 10, category: 'semi-auto' },
  'invitation-send':      { credits: 8,  category: 'semi-auto' },
  'custom-invitation':    { credits: 15, category: 'ai' },
  'lead-magnet':          { credits: 20, category: 'ai' },
  'newsletter-compose':   { credits: 12, category: 'ai' },
  'content-repurpose':    { credits: 18, category: 'ai' },
  'blog-schedule-30':     { credits: 30, category: 'ai' },
};

/** 1 credit = $0.01 (1 cent) */
export const CREDIT_VALUE_USD = 0.01;

/** Get plan by module + tier */
export function getModulePlan(module: ModuleKey, tier: TierKey): ModulePlan {
  if (module === 'finance') return FINANCE_PLANS[tier];
  return MARKETING_PLANS[tier];
}

/** Get combo plan by tier */
export function getComboPlan(tier: TierKey): ComboPlan {
  return COMBO_PLANS[tier];
}

/** Price for a given billing cycle */
export function planPrice(plan: ModulePlan | ComboPlan, cycle: BillingCycle): number {
  return cycle === 'annual' ? plan.annualUsd : plan.monthlyUsd;
}

// ============ Legacy App Catalog (kept for backward compatibility) ============

export type AppKey = 'crm' | 'books' | 'hr' | 'inventory' | 'marketing' | 'desk' | 'projects' | 'ai_studio';
export type PlanKey = 'one' | 'starter' | 'growth' | 'scale';

export interface ISubscription {
  id: string;
  companyId: string | null;
  userId: string | null;
  plan: string | null;
  apps: AppKey[] | null;
  status: string;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  partnerCode: string | null;
  createdAt: Date;
}

// ============ App Catalog (Zoho-style: each app sold separately) ============

export interface AppDef {
  key: AppKey;
  name: string;
  tagline: string;
  priceInr: number;
  /** Module features the app unlocks (used for gating and display). */
  features: string[];
}

export const APPS: Record<AppKey, AppDef> = {
  crm: {
    key: 'crm',
    name: 'AINOS CRM',
    tagline: 'Contacts, deals, follow-ups and customers in one pipeline.',
    priceInr: 799,
    features: ['contacts', 'deals', 'follow_ups', 'customers'],
  },
  books: {
    key: 'books',
    name: 'AINOS Books',
    tagline: 'Invoices, products and payment tracking for your business.',
    priceInr: 799,
    features: ['invoicing', 'products', 'reports_basic'],
  },
  hr: {
    key: 'hr',
    name: 'AINOS People',
    tagline: 'Employees, attendance, payroll and leave management.',
    priceInr: 799,
    features: ['employees', 'attendance', 'payroll', 'leaves', 'compliance'],
  },
  inventory: {
    key: 'inventory',
    name: 'AINOS Inventory',
    tagline: 'Stock, warehouses and purchase orders under control.',
    priceInr: 799,
    features: ['stock', 'warehouses', 'purchase_orders'],
  },
  marketing: {
    key: 'marketing',
    name: 'AINOS Campaigns',
    tagline: 'Email campaigns, blog and content that bring customers.',
    priceInr: 799,
    features: ['email_campaigns', 'blog', 'automations'],
  },
  desk: {
    key: 'desk',
    name: 'AINOS Desk',
    tagline: 'Helpdesk tickets and customer support that scales.',
    priceInr: 799,
    features: ['helpdesk', 'service_requests'],
  },
  projects: {
    key: 'projects',
    name: 'AINOS Projects',
    tagline: 'Projects, kanban task boards, priorities and deadlines.',
    priceInr: 799,
    features: ['projects', 'tasks'],
  },
  ai_studio: {
    key: 'ai_studio',
    name: 'AINOS AI Studio',
    tagline: '15 AI tools, website builder, media studio and chat.',
    priceInr: 1499,
    features: ['ai_tools', 'ai_builder', 'ai_media', 'ai_chat'],
  },
};

export const ALL_APP_KEYS = Object.keys(APPS) as AppKey[];

/** AINOS One — the whole suite for one price (Zoho One style). */
export const ONE_BUNDLE = {
  key: 'one' as const,
  name: 'AINOS One',
  tagline: 'Every app. One price. The complete business OS.',
  priceInr: 3999,
  apps: ALL_APP_KEYS,
};

export const TRIAL_DAYS = 14;

/** What a subscription costs per month: bundle price or sum of chosen apps. */
export function priceForSelection(selection: { plan?: PlanKey; apps?: AppKey[] }): number {
  if (selection.plan === 'one') return ONE_BUNDLE.priceInr;
  return (selection.apps || []).reduce((sum, key) => sum + (APPS[key]?.priceInr || 0), 0);
}

// ============ Payment Details (manual bank transfer) ============

export const PAYMENT_DETAILS = {
  accountName: 'YUREKH SOLUTIONS',
  accountNumber: '30026040000899',
  bankName: 'SVC Co-operative Bank, Vakola Branch',
  ifsc: 'SVCB0000026',
  upiId: process.env.NEXT_PUBLIC_UPI_ID || '',
  whatsapp: '919136242706',
};

// ============ Subscription Helpers ============

export async function getSubscription(companyId: string): Promise<ISubscription | null> {
  const sub = await prisma.subscription.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });
  if (!sub) return null;
  return mapSubscription(sub);
}

/** Legacy tier -> app set, so pre-existing subscriptions keep working. */
const LEGACY_PLAN_APPS: Record<string, AppKey[]> = {
  starter: ['crm', 'books'],
  growth: ['crm', 'books', 'hr', 'marketing'],
  scale: ALL_APP_KEYS,
};

/**
 * Returns the set of apps a company can currently use.
 * - active requires currentPeriodEnd in the future
 * - trialing requires trialEndsAt in the future (trial = full AINOS One access)
 */
export async function getActiveApps(companyId: string): Promise<Set<AppKey>> {
  const sub = await getSubscription(companyId);
  if (!sub) return new Set();

  const now = new Date();
  const trialValid = sub.status === 'trialing' && sub.trialEndsAt && sub.trialEndsAt > now;
  const activeValid = sub.status === 'active' && sub.currentPeriodEnd && sub.currentPeriodEnd > now;
  if (!trialValid && !activeValid) return new Set();

  // Trials and the One bundle unlock the whole suite
  if (trialValid || sub.plan === 'one') return new Set(ALL_APP_KEYS);

  if (sub.plan && LEGACY_PLAN_APPS[sub.plan]) return new Set(LEGACY_PLAN_APPS[sub.plan]);
  return new Set(sub.apps || []);
}

export async function hasApp(companyId: string, app: AppKey): Promise<boolean> {
  const apps = await getActiveApps(companyId);
  return apps.has(app);
}

/**
 * Gate an API route by app. Returns null if allowed,
 * or a 402 NextResponse to return directly.
 */
export async function requireApp(
  companyId: string,
  app: AppKey
): Promise<NextResponse | null> {
  if (await hasApp(companyId, app)) return null;
  return NextResponse.json(
    {
      error: `${APPS[app].name} subscription required`,
      requiredApp: app,
      upgradeUrl: '/billing',
    },
    { status: 402 }
  );
}

/** Starts a 14-day AINOS One trial for a new company. No-op if a subscription exists. */
export async function startTrial(
  companyId: string,
  userId: string,
  partnerCode?: string
): Promise<ISubscription> {
  const existing = await prisma.subscription.findFirst({ where: { companyId } });
  if (existing) return mapSubscription(existing);

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const sub = await prisma.subscription.create({
    data: {
      companyId,
      userId,
      plan: 'one',
      status: 'trialing',
      trialEndsAt,
      partnerCode,
    },
  });
  return mapSubscription(sub);
}

export interface PlanSelection {
  /** 'one' for the full bundle */
  plan?: PlanKey;
  /** individual apps when not buying the bundle */
  apps?: AppKey[];
}

/** Admin-side activation after verifying a bank transfer. */
export async function activateSubscription(
  companyId: string,
  selection: PlanSelection,
  months = 1
): Promise<ISubscription> {
  const currentPeriodEnd = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);

  const existing = await prisma.subscription.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    const updateData: Record<string, unknown> = {
      status: 'active',
      currentPeriodEnd,
    };
    if (selection.plan === 'one') {
      updateData.plan = 'one';
      updateData.apps = null;
    } else {
      updateData.plan = null;
      updateData.apps = selection.apps || [];
    }
    const sub = await prisma.subscription.update({
      where: { id: existing.id },
      data: updateData,
    });
    return mapSubscription(sub);
  }

  const createData: Record<string, unknown> = {
    companyId,
    status: 'active',
    currentPeriodEnd,
  };
  if (selection.plan === 'one') {
    createData.plan = 'one';
  } else {
    createData.apps = selection.apps || [];
  }
  const sub = await prisma.subscription.create({ data: createData });
  return mapSubscription(sub);
}

// ============ AI Studio Quotas (per user, per calendar month) ============

// Without the AI Studio app: a free taste. With it (or AINOS One): fair-use limits.
const AI_LIMITS = {
  none: { toolRuns: 3, websites: 1 },
  ai_studio: { toolRuns: 1000, websites: 25 },
};

export interface QuotaCheck {
  allowed: boolean;
  plan: string;
  used: number;
  limit: number;
  message?: string;
}

/** Monthly AI usage quota for a user (id or email), based on their company's apps. */
export async function checkQuota(
  userId: string,
  kind: 'toolRun' | 'website'
): Promise<QuotaCheck> {
  const user = await prisma.user.findFirst({
    where: userId.includes('@') ? { email: userId } : { id: userId },
  }).catch(() => null);

  const apps = user?.companyId
    ? await getActiveApps(user.companyId)
    : new Set<AppKey>();
  const hasAiStudio = apps.has('ai_studio');
  const limits = hasAiStudio ? AI_LIMITS.ai_studio : AI_LIMITS.none;
  const planName = hasAiStudio ? 'ai_studio' : 'none';

  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth(), 1);
  const used =
    kind === 'toolRun'
      ? await prisma.toolRun.count({ where: { createdBy: userId, createdAt: { gte: since } } })
      : await prisma.generatedSite.count({ where: { createdBy: userId, createdAt: { gte: since } } });
  const limit = kind === 'toolRun' ? limits.toolRuns : limits.websites;

  if (used >= limit) {
    const what = kind === 'toolRun' ? 'AI tool runs' : 'AI websites';
    const message = hasAiStudio
      ? `You've used all ${limit} ${what} included this month (fair use). Limits reset on the 1st.`
      : `You've used all ${limit} free ${what} this month. Get the AINOS AI Studio app or AINOS One to keep creating.`;
    return { allowed: false, plan: planName, used, limit, message };
  }
  return { allowed: true, plan: planName, used, limit };
}

/** Current-month AI usage + limits for a user — powers the usage chip on the services page. */
export async function getAiUsage(userId: string) {
  const user = await prisma.user.findFirst({
    where: userId.includes('@') ? { email: userId } : { id: userId },
  }).catch(() => null);

  const apps = user?.companyId
    ? await getActiveApps(user.companyId)
    : new Set<AppKey>();
  const hasAiStudio = apps.has('ai_studio');
  const limits = hasAiStudio ? AI_LIMITS.ai_studio : AI_LIMITS.none;

  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth(), 1);
  const [toolRuns, websites] = await Promise.all([
    prisma.toolRun.count({ where: { createdBy: userId, createdAt: { gte: since } } }),
    prisma.generatedSite.count({ where: { createdBy: userId, createdAt: { gte: since } } }),
  ]);

  return { hasAiStudio, usage: { toolRuns, websites }, limits };
}

// ============ Helper to map Prisma Subscription to ISubscription ============

function mapSubscription(sub: {
  id: string;
  companyId: string | null;
  userId: string | null;
  plan: string | null;
  apps: unknown;
  status: string;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  partnerCode: string | null;
  createdAt: Date;
}): ISubscription {
  return {
    id: sub.id,
    companyId: sub.companyId,
    userId: sub.userId,
    plan: sub.plan,
    apps: Array.isArray(sub.apps) ? sub.apps as AppKey[] : null,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    trialEndsAt: sub.trialEndsAt,
    partnerCode: sub.partnerCode,
    createdAt: sub.createdAt,
  };
}
