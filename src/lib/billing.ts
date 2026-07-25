// AINOS Studio billing — plans, quotas & Razorpay helpers.
// Payments use one-time Razorpay orders that grant 31 days of access
// (no Razorpay dashboard plan setup needed — just API keys in env).
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import ToolRun from '@/models/ToolRun';
import GeneratedSite from '@/models/GeneratedSite';

export type PlanId = 'free' | 'starter' | 'growth';

export interface PlanDef {
  id: PlanId;
  name: string;
  priceInr: number; // per month, 0 for free
  priceLabel: string;
  tagline: string;
  features: string[];
  limits: { toolRuns: number; websites: number }; // per calendar month
  popular?: boolean;
}

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: 'free',
    name: 'Free',
    priceInr: 0,
    priceLabel: '₹0',
    tagline: 'Try the AINOS Studio tools',
    features: [
      '3 AI tool runs / month',
      '1 AI website / month',
      'All 10 tools unlocked',
      'Download & copy deliverables',
    ],
    limits: { toolRuns: 3, websites: 1 },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceInr: 749,
    priceLabel: '₹749/mo',
    tagline: 'For solo founders getting to market',
    features: [
      '150 AI tool runs / month',
      '5 AI websites / month',
      'Logo, brand kit, SEO, social & more',
      'Deliverables history',
      'Email support',
    ],
    limits: { toolRuns: 150, websites: 5 },
    popular: true,
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    priceInr: 2499,
    priceLabel: '₹2,499/mo',
    tagline: 'Your startup’s full marketing engine',
    features: [
      'Unlimited AI tool runs (fair use)',
      '25 AI websites / month',
      'Priority Yurekh team handoff',
      'Monthly strategy call with Yurekh',
      'Priority support',
    ],
    limits: { toolRuns: 100000, websites: 25 },
  },
};

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

// Early-access launch mode: all tools are fully free until BILLING_ENFORCED=true is set.
// Flip it on in Render env once ready to monetize — quotas & checkout go live instantly.
export function billingEnforced(): boolean {
  return process.env.BILLING_ENFORCED === 'true';
}

// Active plan for a user — falls back to free when expired or missing.
export async function getActivePlan(userId: string): Promise<{ plan: PlanId; periodEnd: Date | null }> {
  await connectDB();
  const sub = await Subscription.findOne({ userId });
  if (!sub || sub.plan === 'free' || sub.status !== 'active') return { plan: 'free', periodEnd: null };
  if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd).getTime() < Date.now()) {
    return { plan: 'free', periodEnd: null };
  }
  return { plan: sub.plan as PlanId, periodEnd: sub.currentPeriodEnd || null };
}

function monthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getUsage(userId: string): Promise<{ toolRuns: number; websites: number }> {
  await connectDB();
  const since = monthStart();
  const [toolRuns, websites] = await Promise.all([
    ToolRun.countDocuments({ createdBy: userId, createdAt: { $gte: since } }),
    GeneratedSite.countDocuments({ createdBy: userId, createdAt: { $gte: since } }),
  ]);
  return { toolRuns, websites };
}

export interface QuotaCheck {
  allowed: boolean;
  plan: PlanId;
  used: number;
  limit: number;
  message?: string;
}

export async function checkQuota(userId: string, kind: 'toolRun' | 'website'): Promise<QuotaCheck> {
  // Early access — no limits while billing is not enforced
  if (!billingEnforced()) {
    return { allowed: true, plan: 'free', used: 0, limit: 100000 };
  }
  const [{ plan }, usage] = await Promise.all([getActivePlan(userId), getUsage(userId)]);
  const limits = PLANS[plan].limits;
  const used = kind === 'toolRun' ? usage.toolRuns : usage.websites;
  const limit = kind === 'toolRun' ? limits.toolRuns : limits.websites;
  if (used >= limit) {
    const what = kind === 'toolRun' ? 'AI tool runs' : 'AI websites';
    return {
      allowed: false, plan, used, limit,
      message: `You've used all ${limit} ${what} on the ${PLANS[plan].name} plan this month. Upgrade to keep creating.`,
    };
  }
  return { allowed: true, plan, used, limit };
}

// ── Razorpay REST helpers (no SDK needed) ──────────────────────────────
export async function createRazorpayOrder(amountInr: number, receipt: string): Promise<{ id: string; amount: number; currency: string } | null> {
  if (!razorpayConfigured()) return null;
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: amountInr * 100, currency: 'INR', receipt }),
  });
  if (!res.ok) {
    console.error('Razorpay order creation failed:', await res.text());
    return null;
  }
  return res.json();
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function activatePlan(userId: string, plan: PlanId, orderId: string, paymentId: string): Promise<void> {
  await connectDB();
  const periodEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
  await Subscription.findOneAndUpdate(
    { userId },
    { plan, status: 'active', provider: 'razorpay', razorpayOrderId: orderId, razorpayPaymentId: paymentId, currentPeriodEnd: periodEnd },
    { upsert: true, new: true }
  );
}
