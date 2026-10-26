'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Receipt,
  Mail,
  Crown,
  CheckCircle,
  Clock,
  Coins,
  Zap,
  ArrowRight,
  Sparkles,
  TrendingUp,
  CreditCard,
  Copy,
  Check,
  MessageCircle,
  Landmark,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────

interface PlanDef {
  tier: string;
  name: string;
  monthlyUsd: number;
  annualUsd: number;
  creditsIncluded: number;
  features: string[];
  popular?: boolean;
}

interface ComboDef extends PlanDef {
  modules: string[];
}

interface CreditPack {
  credits: number;
  price: number;
  label: string;
  popular?: boolean;
  currency: string;
}

interface SubscriptionInfo {
  plan: string | null;
  apps: string[];
  status: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string;
}

interface PaymentInfo {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifsc: string;
  upiId: string;
  whatsapp: string;
}

// ─── Plan Data ───────────────────────────────────────────────────────

const FINANCE_PLANS: PlanDef[] = [
  {
    tier: 'starter', name: 'Starter',
    monthlyUsd: 9, annualUsd: 90,
    creditsIncluded: 500,
    features: ['Invoicing & Quotes', 'Expenses Tracking', 'GST Reports', 'PDF Download', 'Payment Reminders', '500 credits/mo'],
  },
  {
    tier: 'professional', name: 'Professional',
    monthlyUsd: 29, annualUsd: 290,
    creditsIncluded: 2000,
    popular: true,
    features: ['Everything in Starter', 'Payment Recovery Agent', 'Bank Reconciliation', 'Tally Export', 'Multi-currency', '2,000 credits/mo', 'Priority Support'],
  },
  {
    tier: 'enterprise', name: 'Enterprise',
    monthlyUsd: 79, annualUsd: 790,
    creditsIncluded: 10000,
    features: ['Everything in Professional', 'Multi-branch Support', 'Custom GST Reports', 'API Access', 'Dedicated Manager', '10,000 credits/mo'],
  },
];

const MARKETING_PLANS: PlanDef[] = [
  {
    tier: 'starter', name: 'Starter',
    monthlyUsd: 12, annualUsd: 120,
    creditsIncluded: 300,
    features: ['AI Blog Generator', 'Email Campaigns', 'SEO Audit', 'Social Captions', 'Invitations', '300 credits/mo'],
  },
  {
    tier: 'professional', name: 'Professional',
    monthlyUsd: 39, annualUsd: 390,
    creditsIncluded: 1500,
    popular: true,
    features: ['Everything in Starter', 'Competitor Analysis', 'Drip Campaigns', 'Content Repurpose', 'Lead Magnets', '1,500 credits/mo', 'Priority Support'],
  },
  {
    tier: 'enterprise', name: 'Enterprise',
    monthlyUsd: 99, annualUsd: 990,
    creditsIncluded: 8000,
    features: ['Everything in Professional', 'White-label Reports', 'API Access', 'Custom Integrations', 'Dedicated Manager', '8,000 credits/mo'],
  },
];

const COMBO_PLANS: ComboDef[] = [
  {
    tier: 'starter', name: 'Starter Combo',
    monthlyUsd: 17, annualUsd: 170,
    creditsIncluded: 800,
    modules: ['Finance Starter', 'Marketing Starter'],
    features: ['All Finance Starter features', 'All Marketing Starter features', '800 credits/mo', 'Save $4/mo vs separate'],
  },
  {
    tier: 'professional', name: 'Pro Combo',
    monthlyUsd: 55, annualUsd: 550,
    creditsIncluded: 3500,
    modules: ['Finance Professional', 'Marketing Professional'],
    popular: true,
    features: ['All Finance Professional features', 'All Marketing Professional features', '3,500 credits/mo', 'Save $13/mo vs separate'],
  },
  {
    tier: 'enterprise', name: 'Enterprise Combo',
    monthlyUsd: 149, annualUsd: 1490,
    creditsIncluded: 18000,
    modules: ['Finance Enterprise', 'Marketing Enterprise'],
    features: ['All Finance Enterprise features', 'All Marketing Enterprise features', '18,000 credits/mo', 'Save $28/mo vs separate'],
  },
];

const TOOL_COSTS = [
  { name: 'Create Invoice', credits: 2, cat: 'manual' },
  { name: 'Download PDF', credits: 1, cat: 'manual' },
  { name: 'Send Email', credits: 3, cat: 'semi' },
  { name: 'WhatsApp Reminder', credits: 5, cat: 'semi' },
  { name: 'GST Report', credits: 15, cat: 'semi' },
  { name: 'Tally Export', credits: 10, cat: 'semi' },
  { name: 'Payment Recovery', credits: 8, cat: 'semi' },
  { name: 'AI Blog Generate', credits: 25, cat: 'ai' },
  { name: 'AI Blog + SEO', credits: 35, cat: 'ai' },
  { name: 'Email Campaign (100)', credits: 10, cat: 'semi' },
  { name: 'SEO Audit', credits: 30, cat: 'ai' },
  { name: 'Social Caption', credits: 10, cat: 'ai' },
  { name: 'Content Repurpose', credits: 18, cat: 'ai' },
  { name: 'Lead Magnet', credits: 20, cat: 'ai' },
];

const CAT_COLORS: Record<string, string> = {
  manual: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  semi: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  ai: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
};

// ─── Component ───────────────────────────────────────────────────────

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showToolCosts, setShowToolCosts] = useState(false);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  // Marketing UI tiers map to the activate-tools plan keys (category-level plan).
  const MARKETING_PLAN_KEYS: Record<string, string> = {
    starter: 'marketing_starter',
    professional: 'marketing_growth',
    enterprise: 'marketing_pro',
  };

  const loadSnapshot = async () => {
    const [billData, credData] = await Promise.all([
      fetch('/api/billing').then(r => r.ok ? r.json() : Promise.resolve({})),
      fetch('/api/billing/credits').then(r => r.ok ? r.json() : Promise.resolve({})),
    ]);
    setSubscription((billData as { subscription?: SubscriptionInfo }).subscription || null);
    setCreditBalance((credData as { balance?: number }).balance || 0);
  };

  const subscribeMarketing = async (tier: string) => {
    const planKey = MARKETING_PLAN_KEYS[tier];
    if (!planKey) return;
    setBusyPlan(tier);
    try {
      // NOTE: Razorpay merchant account is not connected yet, so paymentId is a
      // placeholder — the backend verifyPayment() stub accepts it. Replace this
      // call with a real Razorpay checkout order once the account is live.
      const res = await fetch('/api/billing/activate-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, paymentId: `pay_pending_${Date.now()}` }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadSnapshot();
        alert(`${data.subscription?.planName || 'Marketing plan'} activated — tools unlocked and monthly credits granted.`);
      } else {
        alert(data.error || 'Activation failed');
      }
    } catch {
      alert('Activation failed');
    } finally {
      setBusyPlan(null);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/billing').then(r => r.ok ? r.json() : Promise.resolve({})),
      fetch('/api/billing/credits').then(r => r.ok ? r.json() : Promise.resolve({})),
      fetch('/api/billing/checkout').then(r => r.ok ? r.json() : Promise.resolve([])),
    ]).then(([billData, credData, packsData]) => {
      setSubscription((billData as { subscription?: SubscriptionInfo }).subscription || null);
      setCreditBalance((credData as { balance?: number }).balance || 0);
      setCreditPacks(Array.isArray(packsData) ? packsData as CreditPack[] : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getPrice = (monthly: number, annual: number) =>
    cycle === 'annual' ? annual : monthly;

  const currentLabel = useMemo(() => {
    if (!subscription) return '';
    if (subscription.plan === 'one') return 'AINOS One — every app included';
    return subscription.plan || '—';
  }, [subscription]);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const copyValue = async (field: string, value: string) => {
    try { await navigator.clipboard.writeText(value); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); } catch { /* */ }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-10 pb-32">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
          Simple, Transparent Pricing
        </h1>
        <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Pay only for what you use. Every plan includes credits for tools and AI. 1 credit = $0.01
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="inline-flex items-center gap-3 p-1 rounded-xl border" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
          <button
            onClick={() => setCycle('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${cycle === 'monthly' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setCycle('annual')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${cycle === 'annual' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Annual <span className="text-xs ml-1 opacity-80">(save 17%)</span>
          </button>
        </div>
      </div>

      {/* ── Current Subscription ───────────────────────────── */}
      {subscription && (
        <div className="rounded-xl border p-5 flex flex-wrap items-center gap-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Current Subscription</p>
            <p className="text-lg font-medium" style={{ color: 'hsl(var(--foreground))' }}>{currentLabel}</p>
          </div>
          {subscription.status === 'trialing' && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500 border border-purple-500/30">
              <Clock className="w-3.5 h-3.5" /> Trial ends {formatDate(subscription.trialEndsAt)}
            </span>
          )}
          {subscription.status === 'active' && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              <CheckCircle className="w-3.5 h-3.5" /> Active until {formatDate(subscription.currentPeriodEnd)}
            </span>
          )}
        </div>
      )}

      {/* ── Credit Balance ────────────────────────────────── */}
      <div className="rounded-xl border p-5 flex items-center gap-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Coins className="w-6 h-6 text-purple-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Credit Balance</p>
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{creditBalance.toLocaleString()} <span className="text-sm font-normal" style={{ color: 'hsl(var(--muted-foreground))' }}>credits (${(creditBalance * 0.01).toFixed(2)} value)</span></p>
        </div>
      </div>

      {/* ── FINANCE MODULE ────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(76,29,149,0.1)' }}>
            <Receipt className="w-5 h-5" style={{ color: '#4c1d95' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Finance Module</h2>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Invoicing, GST, Tally, Payment Recovery & more</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FINANCE_PLANS.map((plan) => {
            const price = cycle === 'annual' ? plan.annualUsd : plan.monthlyUsd;
            const perMonth = cycle === 'annual' ? Math.round(plan.annualUsd / 12) : plan.monthlyUsd;
            return (
              <div key={plan.tier} className={`relative rounded-xl border p-6 flex flex-col ${plan.popular ? 'border-purple-500 ring-1 ring-purple-500/30' : ''}`} style={{ borderColor: plan.popular ? undefined : 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                {plan.popular && <span className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-bold">Most Popular</span>}
                <h3 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>{plan.name}</h3>
                <div className="mt-3 mb-4">
                  <span className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>${cycle === 'annual' ? perMonth : price}</span>
                  <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>/mo{cycle === 'annual' ? ` (billed $${price}/yr)` : ''}</span>
                </div>
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors bg-purple-600 text-white hover:bg-purple-700">
                  Get Started
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MARKETING MODULE ──────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(76,29,149,0.1)' }}>
            <Mail className="w-5 h-5" style={{ color: '#4c1d95' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Marketing Module</h2>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>AI Blog, SEO, Email Campaigns, Social Media</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MARKETING_PLANS.map((plan) => {
            const price = cycle === 'annual' ? plan.annualUsd : plan.monthlyUsd;
            const perMonth = cycle === 'annual' ? Math.round(plan.annualUsd / 12) : plan.monthlyUsd;
            return (
              <div key={plan.tier} className={`relative rounded-xl border p-6 flex flex-col ${plan.popular ? 'border-purple-500 ring-1 ring-purple-500/30' : ''}`} style={{ borderColor: plan.popular ? undefined : 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                {plan.popular && <span className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-bold">Most Popular</span>}
                <h3 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>{plan.name}</h3>
                <div className="mt-3 mb-4">
                  <span className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>${cycle === 'annual' ? perMonth : price}</span>
                  <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>/mo{cycle === 'annual' ? ` (billed $${price}/yr)` : ''}</span>
                </div>
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => subscribeMarketing(plan.tier)}
                  disabled={busyPlan === plan.tier}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                >
                  {busyPlan === plan.tier ? 'Activating…' : 'Get Started'}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Checkout is stubbed until the payment account is connected — activating grants access + credits immediately.
        </p>
      </div>

      {/* ── COMBO PLANS (Best Value) ──────────────────────── */}
      <div className="rounded-2xl border-2 border-purple-500/40 p-6 sm:p-8" style={{ background: 'hsl(var(--card))' }}>
        <div className="flex items-center gap-3 mb-6">
          <Crown className="w-7 h-7 text-purple-500" />
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Combo Plans — Best Value</h2>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Finance + Marketing together at a discount</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COMBO_PLANS.map((plan) => {
            const price = cycle === 'annual' ? plan.annualUsd : plan.monthlyUsd;
            const perMonth = cycle === 'annual' ? Math.round(plan.annualUsd / 12) : plan.monthlyUsd;
            return (
              <div key={plan.tier} className={`relative rounded-xl border p-6 flex flex-col ${plan.popular ? 'border-purple-500 ring-2 ring-purple-500/40 bg-purple-500/5' : ''}`} style={{ borderColor: plan.popular ? undefined : 'hsl(var(--border))', background: plan.popular ? undefined : 'hsl(var(--card))' }}>
                {plan.popular && <span className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold">Best Deal</span>}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>{plan.name}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {plan.modules.map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">{m}</span>
                  ))}
                </div>
                <div className="mt-1 mb-4">
                  <span className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>${cycle === 'annual' ? perMonth : price}</span>
                  <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>/mo{cycle === 'annual' ? ` (billed $${price}/yr)` : ''}</span>
                </div>
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${plan.popular ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                  Get Started
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CREDIT TOP-UP ─────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10">
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Credit Top-Up</h2>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Buy extra credits anytime — 1 credit = $0.01</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {creditPacks.map((pack) => (
            <div key={pack.credits} className={`relative rounded-xl border p-4 text-center ${pack.popular ? 'border-purple-500 ring-1 ring-purple-500/30' : ''}`} style={{ borderColor: pack.popular ? undefined : 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
              {pack.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">Popular</span>}
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{pack.credits.toLocaleString()}</p>
              <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>credits</p>
              <p className="text-lg font-bold text-purple-500">${pack.price.toFixed(2)}</p>
              <button className="mt-2 w-full py-2 rounded-lg text-xs font-semibold border border-purple-500/30 text-purple-500 hover:bg-purple-500/10 transition-colors">
                Buy Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── TOOL CREDIT COSTS TABLE ───────────────────────── */}
      <div>
        <button onClick={() => setShowToolCosts(!showToolCosts)} className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
          <Sparkles className="w-4 h-4 text-purple-500" />
          Per-Tool Credit Costs
          <ArrowRight className={`w-4 h-4 transition-transform ${showToolCosts ? 'rotate-90' : ''}`} />
        </button>
        {showToolCosts && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'hsl(var(--card))' }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Tool</th>
                  <th className="text-center px-4 py-3 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Credits</th>
                  <th className="text-center px-4 py-3 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Type</th>
                  <th className="text-right px-4 py-3 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {TOOL_COSTS.map((tool) => (
                  <tr key={tool.name} className="border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                    <td className="px-4 py-2.5" style={{ color: 'hsl(var(--foreground))' }}>{tool.name}</td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold" style={{ color: 'hsl(var(--foreground))' }}>{tool.credits}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${CAT_COLORS[tool.cat]}`}>
                        {tool.cat === 'ai' ? 'AI' : tool.cat === 'semi' ? 'Auto' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>${(tool.credits * 0.01).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="text-center space-y-2">
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          All prices in USD. Credits never expire. Cancel anytime — your subscription stays active until the end of the paid period.
        </p>
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Need a custom plan? <a href="mailto:info@ainosio.com" className="text-purple-500 font-semibold hover:underline">Contact us</a>
        </p>
      </div>
    </div>
  );
}
