'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Receipt, Mail, Crown, CheckCircle, Clock, Coins, Workflow, ArrowRight, Star, TrendingUp, CreditCard, Copy, Check, MessageCircle, Landmark, Component, Layers } from 'lucide-react';

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

interface ToolEditionInfo { level: number; name: string; priceMonthlyUsd: number }
interface ToolInfo {
  key: string;
  label: string;
  vertical: string;
  monthlyUsd: number;
  editions: ToolEditionInfo[];
  subscription: { status: string; edition: number; billingCycle: string; currentPeriodEnd?: string | null; seats?: number } | null;
}

interface WorkspaceInfo {
  key: string;
  label: string;
  monthlyUsd: number;
  subscription: { status: string; billingCycle: string; currentPeriodEnd?: string | null; seats: number } | null;
}

interface PaymentInfo {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifsc: string;
  upiId: string;
  whatsapp: string;
}

/**
 * The rupee company plan, served by /api/billing from src/lib/billing.ts.
 * It is priced per company rather than per user, so it needs no seat count and
 * no card: the transfer is reconciled by hand and the apps switch on after.
 */
interface BundleInfo { key: string; name: string; tagline: string; priceInr: number; apps: string[] }
interface AppCatalogEntry { key: string; name: string; tagline: string; priceInr: number }
interface RupeeOrder {
  label: string;
  amountInr: number;
  oneIsCheaper: boolean;
  /** True when a live trial or paid period keeps running while this is awaited. */
  accessContinues: boolean;
  payment: PaymentInfo;
  whatsappUrl: string;
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
  const [toolSubs, setToolSubs] = useState<ToolInfo[]>([]);
  const [busyTool, setBusyTool] = useState<string | null>(null);
  const [toolSeats, setToolSeats] = useState<Record<string, number>>({});
  const [wsSubs, setWsSubs] = useState<WorkspaceInfo[]>([]);
  const [busyWs, setBusyWs] = useState<string | null>(null);
  const [bundle, setBundle] = useState<BundleInfo | null>(null);
  const [appCatalog, setAppCatalog] = useState<AppCatalogEntry[]>([]);
  const [pickedApps, setPickedApps] = useState<string[]>([]);
  const [rupeeOrder, setRupeeOrder] = useState<RupeeOrder | null>(null);
  const [rupeeBusy, setRupeeBusy] = useState(false);
  const [rupeeError, setRupeeError] = useState<string | null>(null);

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

  const refreshTools = async () => {
    const data = await fetch('/api/billing/tools').then(r => r.ok ? r.json() : Promise.resolve({}));
    setToolSubs(Array.isArray((data as { tools?: ToolInfo[] }).tools) ? (data as { tools: ToolInfo[] }).tools : []);
  };

  const refreshWorkspaces = async () => {
    const data = await fetch('/api/billing/workspaces').then(r => r.ok ? r.json() : Promise.resolve({}));
    setWsSubs(Array.isArray((data as { workspaces?: WorkspaceInfo[] }).workspaces) ? (data as { workspaces: WorkspaceInfo[] }).workspaces : []);
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

  const seatCountFor = (key: string, tool: ToolInfo): number =>
    toolSeats[key] ?? tool.subscription?.seats ?? 1;

  const setSeatCount = (key: string, n: number) =>
    setToolSeats((s) => ({ ...s, [key]: Math.max(1, Math.min(500, Math.floor(n) || 1)) }));

  const subscribeTool = async (key: string, edition: number, seats: number) => {
    setBusyTool(`${key}:${edition}`);
    try {
      const res = await fetch('/api/billing/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, edition, cycle, seats }),
      });
      const data = await res.json();
      if (res.ok) {
        await Promise.all([refreshTools(), loadSnapshot()]);
        alert(data.directlyActivated
          ? 'Tool activated — unlocked for your workspace.'
          : 'Order created — complete the payment to activate.');
      } else {
        alert(data.error || 'Subscription failed');
      }
    } catch {
      alert('Subscription failed');
    } finally {
      setBusyTool(null);
    }
  };

  const cancelTool = async (key: string) => {
    setBusyTool(`cancel:${key}`);
    try {
      const res = await fetch('/api/billing/tools/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (res.ok) { await refreshTools(); } else { alert('Could not cancel'); }
    } catch { alert('Could not cancel'); } finally { setBusyTool(null); }
  };

  const cancelWorkspace = async (key: string) => {
    setBusyWs(`cancel:${key}`);
    try {
      const res = await fetch('/api/billing/workspaces/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (res.ok) { await refreshWorkspaces(); } else { alert('Could not cancel'); }
    } catch { alert('Could not cancel'); } finally { setBusyWs(null); }
  };

  const rupeeTotal = pickedApps.reduce(
    (sum, key) => sum + (appCatalog.find((a) => a.key === key)?.priceInr ?? 0), 0,
  );

  const toggleApp = (key: string) => setPickedApps((current) =>
    current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
  );

  /**
   * Places the rupee order. This does not take money: the endpoint records the
   * choice as pending and hands back the account to transfer to, so the apps
   * only switch on once the business has seen the deposit reach their bank.
   */
  const requestRupeePlan = async (mode: 'one' | 'apps') => {
    setRupeeBusy(true);
    setRupeeError(null);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'one' ? { plan: 'one' } : { apps: pickedApps }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRupeeError(typeof data?.error === 'string' ? data.error : 'Could not place the request. Please try again.');
        return;
      }
      setRupeeOrder(data as RupeeOrder);
      await loadSnapshot();
    } catch {
      setRupeeError('Could not place the request. Please try again.');
    } finally {
      setRupeeBusy(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/billing').then(r => r.ok ? r.json() : Promise.resolve({})),
      fetch('/api/billing/credits').then(r => r.ok ? r.json() : Promise.resolve({})),
      fetch('/api/billing/checkout').then(r => r.ok ? r.json() : Promise.resolve([])),
      fetch('/api/billing/tools').then(r => r.ok ? r.json() : Promise.resolve({})),
      fetch('/api/billing/workspaces').then(r => r.ok ? r.json() : Promise.resolve({})),
    ]).then(([billData, credData, packsData, toolsData, wsData]) => {
      setSubscription((billData as { subscription?: SubscriptionInfo }).subscription || null);
      setBundle((billData as { bundle?: BundleInfo }).bundle ?? null);
      setAppCatalog(Array.isArray((billData as { apps?: AppCatalogEntry[] }).apps) ? (billData as { apps: AppCatalogEntry[] }).apps : []);
      setCreditBalance((credData as { balance?: number }).balance || 0);
      setCreditPacks(Array.isArray(packsData) ? packsData as CreditPack[] : []);
      setToolSubs(Array.isArray((toolsData as { tools?: ToolInfo[] }).tools) ? (toolsData as { tools: ToolInfo[] }).tools : []);
      setWsSubs(Array.isArray((wsData as { workspaces?: WorkspaceInfo[] }).workspaces) ? (wsData as { workspaces: WorkspaceInfo[] }).workspaces : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getPrice = (monthly: number, annual: number) =>
    cycle === 'annual' ? annual : monthly;

  const currentLabel = useMemo(() => {
    if (!subscription) return '';
    if (subscription.plan === 'one') return 'AINOS One — every app included';
    return subscription.plan || '—';
  }, [subscription]);

  // What a payer actually has to copy out of their banking app. The UPI line
  // only appears if a UPI id is configured, so the screen never shows a blank
  // field for the customer to fill in.
  const rupeeCopyRows = rupeeOrder
    ? [
        { field: 'rupee-name', label: 'Account name', value: rupeeOrder.payment.accountName },
        { field: 'rupee-acct', label: 'Account number', value: rupeeOrder.payment.accountNumber },
        { field: 'rupee-ifsc', label: 'IFSC · Branch', value: `${rupeeOrder.payment.ifsc} · ${rupeeOrder.payment.bankName}` },
        ...(rupeeOrder.payment.upiId
          ? [{ field: 'rupee-upi', label: 'UPI id', value: rupeeOrder.payment.upiId }]
          : []),
      ]
    : [];

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

      {/* ── AINOS ONE — the rupee company plan ──────────────
          Priced per company, not per user, and paid by transfer. Kept apart
          from the USD workspaces above on purpose: those bill seats through a
          card, this one bills the whole suite through the bank. */}
      {bundle && (
        <div
          className="rounded-xl border-2 p-5 sm:p-6"
          style={{ borderColor: 'rgba(109,40,217,0.4)', background: 'hsl(var(--card))' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="w-4 h-4 text-purple-500" />
                <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  For businesses in India
                </p>
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{bundle.name}</h2>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{bundle.tagline}</p>
              <ul className="mt-3 space-y-1.5">
                {[
                  `Every app in the suite (${bundle.apps.length} apps)`,
                  'One price for the company — add as many users as you need',
                  'Paid by bank transfer or UPI, no card details taken',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 text-purple-500 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                ₹{bundle.priceInr.toLocaleString('en-IN')}
              </p>
              <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>per month</p>

              {subscription?.plan === 'one' && subscription.status === 'active' ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  <CheckCircle className="w-3.5 h-3.5" /> Active until {formatDate(subscription.currentPeriodEnd)}
                </span>
              ) : subscription?.plan === 'one' && subscription.status === 'pending' ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" /> Waiting for your transfer
                </span>
              ) : (
                <button
                  onClick={() => requestRupeePlan('one')}
                  disabled={rupeeBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(90deg, #4c1d95, #6d28d9)' }}
                >
                  {rupeeBusy ? 'Sending…' : 'Choose AINOS One'} <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {subscription?.status === 'trialing' && subscription.plan !== 'one' && (
                <p className="mt-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Your trial already includes everything in AINOS One.
                </p>
              )}
            </div>
          </div>

          {appCatalog.length > 0 && (
            <div className="mt-5 pt-5 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Need only part of the suite? Tap the apps you want — each price is shown on its
                own label, and the monthly total for your selection appears underneath.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {appCatalog.map((app) => {
                  const picked = pickedApps.includes(app.key);
                  return (
                    <button
                      key={app.key}
                      onClick={() => toggleApp(app.key)}
                      title={app.tagline}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${picked ? 'text-white' : ''}`}
                      style={picked
                        ? { background: 'linear-gradient(90deg, #4c1d95, #6d28d9)', borderColor: 'transparent' }
                        : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    >
                      {app.name} · ₹{app.priceInr.toLocaleString('en-IN')}
                    </button>
                  );
                })}
              </div>
              {pickedApps.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    {pickedApps.length} app{pickedApps.length > 1 ? 's' : ''} · ₹{rupeeTotal.toLocaleString('en-IN')}/month
                  </p>
                  <button
                    onClick={() => requestRupeePlan('apps')}
                    disabled={rupeeBusy}
                    className="rounded-lg border px-3 py-1.5 text-xs font-bold disabled:opacity-60"
                    style={{ borderColor: 'rgba(109,40,217,0.4)', color: '#6d28d9' }}
                  >
                    {rupeeBusy ? 'Sending…' : 'Send this selection'}
                  </button>
                </div>
              )}
            </div>
          )}

          {rupeeError && (
            <p className="mt-4 text-sm text-rose-600">{rupeeError}</p>
          )}

          {rupeeOrder && (
            <div className="mt-5 rounded-xl border p-4" style={{ borderColor: 'hsl(var(--border))' }}>
              <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                {rupeeOrder.label} · ₹{rupeeOrder.amountInr.toLocaleString('en-IN')}/month
              </p>
              <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Transfer this amount to the account below. The apps switch on as soon as the
                transfer reaches us, so nothing is activated on an unverified claim.
              </p>
              {rupeeOrder.accessContinues && (
                <p className="mt-2 text-xs font-medium" style={{ color: '#047857' }}>
                  Everything you can use right now stays usable until then — asking to buy does not
                  switch anything off.
                </p>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {rupeeCopyRows.map((row) => (
                  <button
                    key={row.field}
                    onClick={() => copyValue(row.field, row.value)}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{row.label}</span>
                      <span className="block truncate text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{row.value}</span>
                    </span>
                    {copiedField === row.field
                      ? <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      : <Copy className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />}
                  </button>
                ))}
              </div>
              {rupeeOrder.oneIsCheaper && (
                <p className="mt-3 text-xs" style={{ color: '#6d28d9' }}>
                  AINOS One is ₹{bundle.priceInr.toLocaleString('en-IN')} for every app, so it costs the same
                  or less than this selection.
                </p>
              )}
              <a
                href={rupeeOrder.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white"
                style={{ background: '#128c7e' }}
              >
                <MessageCircle className="w-4 h-4" /> Send the transfer details to us
              </a>
            </div>
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

      {/* ── WORKSPACES (à la carte unlock) ─────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10">
            <Layers className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Workspaces</h2>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Unlock a full workspace — every tool inside, billed monthly, cancel anytime.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {wsSubs.map((w) => {
            const active = w.subscription?.status === 'active';
            return (
              <div key={w.key} className="rounded-xl border p-5 flex flex-col" style={{ borderColor: active ? 'rgba(16,185,129,0.4)' : 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>{w.label}</h3>
                  {active && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>${w.monthlyUsd.toLocaleString('en-US')}<span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>/mo</span></p>
                <div className="mt-auto flex items-center gap-2">
                  <Link href={`/billing/workspaces/${w.key}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(90deg, #4c1d95, #6d28d9)' }}>
                    {active ? 'Manage' : 'Unlock'} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  {active && (
                    <button onClick={() => cancelWorkspace(w.key)} disabled={busyWs === `cancel:${w.key}`}
                      className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-60"
                      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                      {busyWs === `cancel:${w.key}` ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── INDIVIDUAL TOOLS (à la carte) ─────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10">
            <Component className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Individual Tools</h2>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Subscribe to just what you need — billed per tool, cancel anytime.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {toolSubs.map((tool) => {
            const active = tool.subscription?.status === 'active';
            const activeEdition = tool.subscription?.edition;
            const seats = seatCountFor(tool.key, tool);
            const activeSeats = tool.subscription?.seats ?? 1;
            return (
              <div key={tool.key} className={`rounded-xl border p-5 flex flex-col ${active ? 'border-emerald-500/40' : ''}`} style={{ borderColor: active ? undefined : 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>{tool.label}</h3>
                  {active && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {active
                    ? `${tool.editions.find(e => e.level === activeEdition)?.name || 'Plan'} · ${activeSeats} user${activeSeats > 1 ? 's' : ''} · renews ${formatDate(tool.subscription?.currentPeriodEnd || undefined)}`
                    : `${tool.vertical} · from $${Math.min(...tool.editions.map(e => e.priceMonthlyUsd))}/user/mo`}
                </p>
                {!active && (
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2 mb-2" style={{ borderColor: 'hsl(var(--border))' }}>
                    <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>Users</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSeatCount(tool.key, seats - 1)} disabled={seats <= 1} className="w-6 h-6 rounded-md border text-sm font-bold disabled:opacity-40" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>−</button>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={seats}
                        onChange={(e) => setSeatCount(tool.key, Number(e.target.value))}
                        className="w-12 rounded-md border bg-transparent text-center text-sm"
                        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                      <button onClick={() => setSeatCount(tool.key, seats + 1)} disabled={seats >= 500} className="w-6 h-6 rounded-md border text-sm font-bold disabled:opacity-40" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>+</button>
                    </div>
                  </div>
                )}
                <div className="flex-1 space-y-2 mb-4">
                  {tool.editions.map((ed) => {
                    const total = ed.priceMonthlyUsd * seats;
                    return (
                      <div key={ed.level} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: 'hsl(var(--border))' }}>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{ed.name}</p>
                          <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            ${ed.priceMonthlyUsd}/user/mo · ${total}/mo{cycle === 'annual' ? ' · billed yearly' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => subscribeTool(tool.key, ed.level, seats)}
                          disabled={busyTool === `${tool.key}:${ed.level}` || active}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${active ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60'}`}
                        >
                          {busyTool === `${tool.key}:${ed.level}` ? '…' : 'Select'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {active && (
                  <button
                    onClick={() => cancelTool(tool.key)}
                    disabled={busyTool === `cancel:${tool.key}`}
                    className="w-full py-2 rounded-lg text-xs font-semibold border border-purple-500/30 text-purple-500 hover:bg-purple-500/10 transition-colors disabled:opacity-60"
                  >
                    {busyTool === `cancel:${tool.key}` ? 'Cancelling…' : 'Cancel renewal'}
                  </button>
                )}
              </div>
            );
          })}
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
            <Workflow className="w-5 h-5 text-purple-500" />
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
          <Star className="w-4 h-4 text-purple-500" />
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
