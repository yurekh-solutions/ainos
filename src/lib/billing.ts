import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscription, { PlanKey, ISubscription } from '@/models/Subscription';
import ToolRun from '@/models/ToolRun';
import GeneratedSite from '@/models/GeneratedSite';
import User from '@/models/User';

// ============ Plan Catalog ============

export interface PlanDef {
  key: PlanKey;
  name: string;
  priceInr: number;
  rank: number;
  features: string[];
}

export const PLANS: Record<PlanKey, PlanDef> = {
  starter: {
    key: 'starter',
    name: 'Starter',
    priceInr: 1999,
    rank: 1,
    features: ['crm', 'invoicing', 'customers', 'reports_basic'],
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    priceInr: 4999,
    rank: 2,
    features: [
      'crm', 'invoicing', 'customers', 'reports_basic',
      'hr', 'payroll', 'compliance', 'automations',
    ],
  },
  scale: {
    key: 'scale',
    name: 'Scale',
    priceInr: 9999,
    rank: 3,
    features: [
      'crm', 'invoicing', 'customers', 'reports_basic',
      'hr', 'payroll', 'compliance', 'automations',
      'ai_studio', 'inventory', 'helpdesk', 'reports_advanced',
    ],
  },
};

export const TRIAL_DAYS = 14;
export const TRIAL_PLAN: PlanKey = 'growth';

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
  await connectDB();
  return Subscription.findOne({ companyId }).sort({ createdAt: -1 });
}

/**
 * Returns the currently usable plan for a company, or null if none.
 * - active requires currentPeriodEnd in the future
 * - trialing requires trialEndsAt in the future
 */
export async function getActivePlan(companyId: string): Promise<PlanDef | null> {
  const sub = await getSubscription(companyId);
  if (!sub) return null;

  const now = new Date();
  if (sub.status === 'active' && sub.currentPeriodEnd && sub.currentPeriodEnd > now) {
    return PLANS[sub.plan];
  }
  if (sub.status === 'trialing' && sub.trialEndsAt && sub.trialEndsAt > now) {
    return PLANS[sub.plan];
  }
  return null;
}

export async function hasFeature(companyId: string, feature: string): Promise<boolean> {
  const plan = await getActivePlan(companyId);
  return !!plan && plan.features.includes(feature);
}

/**
 * Gate an API route by minimum plan. Returns null if allowed,
 * or a 402 NextResponse to return directly.
 */
export async function requirePlan(
  companyId: string,
  minPlan: PlanKey
): Promise<NextResponse | null> {
  const plan = await getActivePlan(companyId);
  if (plan && plan.rank >= PLANS[minPlan].rank) {
    return null;
  }
  return NextResponse.json(
    {
      error: 'Plan upgrade required',
      requiredPlan: minPlan,
      currentPlan: plan?.key || null,
      upgradeUrl: '/ainos/billing',
    },
    { status: 402 }
  );
}

/** Starts a trial for a new company. No-op if a subscription already exists. */
export async function startTrial(
  companyId: string,
  userId: string,
  partnerCode?: string
): Promise<ISubscription> {
  await connectDB();
  const existing = await Subscription.findOne({ companyId });
  if (existing) return existing;

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  return Subscription.create({
    companyId,
    userId,
    plan: TRIAL_PLAN,
    status: 'trialing',
    trialEndsAt,
    partnerCode,
  });
}

/** Admin-side activation after verifying a bank transfer. */
export async function activateSubscription(
  companyId: string,
  plan: PlanKey,
  months = 1
): Promise<ISubscription> {
  await connectDB();
  const currentPeriodEnd = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
  return Subscription.findOneAndUpdate(
    { companyId },
    { plan, status: 'active', currentPeriodEnd },
    { new: true, upsert: true, sort: { createdAt: -1 } }
  );
}

// ============ AI Studio Quotas (per user, per calendar month) ============

const AI_LIMITS: Record<PlanKey | 'none', { toolRuns: number; websites: number }> = {
  none: { toolRuns: 3, websites: 1 }, // taste of the tools before subscribing
  starter: { toolRuns: 150, websites: 5 },
  growth: { toolRuns: 500, websites: 10 },
  scale: { toolRuns: 100000, websites: 25 }, // effectively unlimited (fair use)
};

export interface QuotaCheck {
  allowed: boolean;
  plan: string;
  used: number;
  limit: number;
  message?: string;
}

/** Monthly AI usage quota for a user (id or email), based on their company's plan. */
export async function checkQuota(
  userId: string,
  kind: 'toolRun' | 'website'
): Promise<QuotaCheck> {
  await connectDB();

  const user = await User.findOne(
    userId.includes('@') ? { email: userId } : { _id: userId }
  ).catch(() => null);
  const plan = user?.companyId ? await getActivePlan(user.companyId) : null;
  const planName: PlanKey | 'none' = plan?.key ?? 'none';
  const limits = AI_LIMITS[planName];

  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth(), 1);
  const used =
    kind === 'toolRun'
      ? await ToolRun.countDocuments({ createdBy: userId, createdAt: { $gte: since } })
      : await GeneratedSite.countDocuments({ createdBy: userId, createdAt: { $gte: since } });
  const limit = kind === 'toolRun' ? limits.toolRuns : limits.websites;

  if (used >= limit) {
    const what = kind === 'toolRun' ? 'AI tool runs' : 'AI websites';
    const message =
      planName === 'none'
        ? `You've used all ${limit} ${what} included this month. Subscribe to a plan to keep creating.`
        : `You've used all ${limit} ${what} on the ${PLANS[planName].name} plan this month. Upgrade to keep creating.`;
    return { allowed: false, plan: planName, used, limit, message };
  }
  return { allowed: true, plan: planName, used, limit };
}
