'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Target,
  Receipt,
  UserCheck,
  Boxes,
  Mail,
  Headphones,
  FolderKanban,
  Sparkles,
  CheckCircle,
  Clock,
  Copy,
  Check,
  MessageCircle,
  Landmark,
  Crown,
  Plus,
} from 'lucide-react';

interface SubscriptionInfo {
  plan: string | null;
  apps: string[];
  status: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string;
}

interface AppInfo {
  key: string;
  name: string;
  tagline: string;
  priceInr: number;
  features: string[];
}

interface BundleInfo {
  key: string;
  name: string;
  tagline: string;
  priceInr: number;
  apps: string[];
}

interface PaymentInfo {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifsc: string;
  upiId: string;
  whatsapp: string;
}

interface PaymentInstructions {
  label: string;
  amountInr: number;
  oneIsCheaper?: boolean;
  payment: PaymentInfo;
  whatsappUrl: string;
}

const APP_ICONS: Record<string, typeof Target> = {
  crm: Target,
  books: Receipt,
  hr: UserCheck,
  inventory: Boxes,
  marketing: Mail,
  desk: Headphones,
  projects: FolderKanban,
  ai_studio: Sparkles,
};

// Legacy tiers shown as their app sets for older subscriptions
const LEGACY_LABELS: Record<string, string> = {
  starter: 'Starter (legacy) — CRM + Books',
  growth: 'Growth (legacy) — CRM, Books, People, Campaigns',
  scale: 'Scale (legacy) — all apps',
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [bundle, setBundle] = useState<BundleInfo | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState(false);
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    try {
      const res = await fetch('/api/billing');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
        setApps(data.apps || []);
        setBundle(data.bundle || null);
      }
    } catch (error) {
      console.error('Error fetching billing:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApp = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const selectedTotal = useMemo(
    () =>
      selected.reduce(
        (sum, key) => sum + (apps.find((a) => a.key === key)?.priceInr || 0),
        0
      ),
    [selected, apps]
  );
  const oneIsCheaper = bundle ? selectedTotal >= bundle.priceInr : false;

  const checkout = async (payload: { plan?: string; apps?: string[] }) => {
    setChoosing(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setInstructions(data);
        setSelected([]);
        fetchBilling();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error choosing apps:', error);
    } finally {
      setChoosing(false);
    }
  };

  const copyValue = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';

  const currentLabel = useMemo(() => {
    if (!subscription) return '';
    if (subscription.plan === 'one') return 'AINOS One — every app included';
    if (subscription.plan && LEGACY_LABELS[subscription.plan])
      return LEGACY_LABELS[subscription.plan];
    if (subscription.apps.length) {
      return subscription.apps
        .map((k) => apps.find((a) => a.key === k)?.name || k)
        .join(', ');
    }
    return subscription.plan || '—';
  }, [subscription, apps]);

  const ownedApps = useMemo(() => {
    if (!subscription || !['active', 'trialing'].includes(subscription.status))
      return new Set<string>();
    if (subscription.status === 'trialing' || subscription.plan === 'one' || subscription.plan === 'scale')
      return new Set(apps.map((a) => a.key));
    if (subscription.plan === 'starter') return new Set(['crm', 'books']);
    if (subscription.plan === 'growth') return new Set(['crm', 'books', 'hr', 'marketing']);
    return new Set(subscription.apps);
  }, [subscription, apps]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1BE1D3]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 pb-32">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          Apps & Billing
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Subscribe to the apps you need — or get everything with AINOS One
        </p>
      </div>

      {/* Current subscription status */}
      {subscription && (
        <div
          className="rounded-xl border p-5 flex flex-wrap items-center gap-4"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
        >
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Current Subscription
            </p>
            <p className="text-lg font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              {currentLabel}
            </p>
          </div>
          {subscription.status === 'pending' && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" /> Awaiting payment confirmation
            </span>
          )}
          {subscription.status === 'trialing' && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#1BE1D3]/10 text-[#1BE1D3] border border-[#1BE1D3]/30">
              <Clock className="w-3.5 h-3.5" /> AINOS One trial — ends {formatDate(subscription.trialEndsAt)}
            </span>
          )}
          {subscription.status === 'active' && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              <CheckCircle className="w-3.5 h-3.5" /> Active until {formatDate(subscription.currentPeriodEnd)}
            </span>
          )}
          {['past_due', 'halted', 'cancelled'].includes(subscription.status) && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/30 capitalize">
              {subscription.status.replace('_', ' ')}
            </span>
          )}
        </div>
      )}

      {/* Payment instructions panel */}
      {instructions && (
        <div className="rounded-xl border-2 border-[#1BE1D3]/50 p-6 space-y-5" style={{ background: 'hsl(var(--card))' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1BE1D3]/10 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-[#1BE1D3]" />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Complete Your Payment — {instructions.label}
              </h2>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Transfer <span className="text-[#1BE1D3] font-medium">₹{instructions.amountInr.toLocaleString('en-IN')}</span> to
                the account below, then confirm on WhatsApp.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Account Name', value: instructions.payment.accountName },
              { label: 'Account Number', value: instructions.payment.accountNumber },
              { label: 'Bank', value: instructions.payment.bankName },
              { label: 'IFSC Code', value: instructions.payment.ifsc },
              ...(instructions.payment.upiId
                ? [{ label: 'UPI ID', value: instructions.payment.upiId }]
                : []),
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                <div>
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {row.label}
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                    {row.value}
                  </p>
                </div>
                <button
                  onClick={() => copyValue(row.label, row.value)}
                  className="p-2 rounded-md hover:bg-[#1BE1D3]/10 transition-colors"
                  title={`Copy ${row.label}`}
                >
                  {copiedField === row.label ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#1BE1D3]" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <a
            href={instructions.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1BE1D3] text-black text-sm font-medium hover:bg-[#1BE1D3]/90 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> I&apos;ve Paid — Confirm on WhatsApp
          </a>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Your apps are activated within a few hours of payment verification, usually much faster.
          </p>
        </div>
      )}

      {/* AINOS One hero */}
      {bundle && (
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-[#1BE1D3]/60 p-6 sm:p-8"
          style={{ background: 'hsl(var(--card))' }}
        >
          <div className="flex flex-wrap items-center gap-6 justify-between">
            <div className="space-y-3 min-w-[240px] flex-1">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-[#1BE1D3]" />
                <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  {bundle.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#1BE1D3] text-black text-[11px] font-medium">
                  Best Value
                </span>
              </div>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {bundle.tagline}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {bundle.apps.map((k) => {
                  const Icon = APP_ICONS[k] || Sparkles;
                  return (
                    <span
                      key={k}
                      className="w-8 h-8 rounded-lg bg-[#1BE1D3]/10 flex items-center justify-center"
                      title={apps.find((a) => a.key === k)?.name || k}
                    >
                      <Icon className="w-4 h-4 text-[#1BE1D3]" />
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="text-right space-y-3">
              <div>
                <span className="text-4xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  ₹{bundle.priceInr.toLocaleString('en-IN')}
                </span>
                <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {' '}/month
                </span>
              </div>
              <button
                onClick={() => checkout({ plan: 'one' })}
                disabled={choosing || subscription?.plan === 'one'}
                className="px-6 py-3 rounded-lg bg-[#1BE1D3] text-black text-sm font-medium hover:bg-[#1BE1D3]/90 transition-colors disabled:opacity-60"
              >
                {subscription?.plan === 'one' && subscription.status === 'active'
                  ? 'Current Plan'
                  : choosing
                  ? 'Preparing...'
                  : 'Get AINOS One'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App grid */}
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
          Or pick individual apps
        </h2>
        <p className="text-sm mb-5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Each app is a full product on its own. Mix and match — pay only for what you use.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {apps.map((app) => {
            const Icon = APP_ICONS[app.key] || Sparkles;
            const isSelected = selected.includes(app.key);
            const isOwned = ownedApps.has(app.key) && subscription?.status === 'active';
            return (
              <button
                key={app.key}
                onClick={() => !isOwned && toggleApp(app.key)}
                disabled={isOwned}
                className={`relative flex flex-col text-left rounded-xl border p-5 transition-all ${
                  isSelected ? 'border-[#1BE1D3] ring-1 ring-[#1BE1D3]/50' : 'hover:border-[#1BE1D3]/40'
                } ${isOwned ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
                style={{
                  borderColor: isSelected ? undefined : 'hsl(var(--border))',
                  background: 'hsl(var(--card))',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="w-10 h-10 rounded-lg bg-[#1BE1D3]/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#1BE1D3]" />
                  </span>
                  {isOwned ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                      <CheckCircle className="w-3.5 h-3.5" /> Subscribed
                    </span>
                  ) : isSelected ? (
                    <span className="w-6 h-6 rounded-full bg-[#1BE1D3] flex items-center justify-center">
                      <Check className="w-4 h-4 text-black" />
                    </span>
                  ) : (
                    <span
                      className="w-6 h-6 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <Plus className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                  {app.name}
                </h3>
                <p className="text-xs flex-grow mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {app.tagline}
                </p>
                <p className="text-sm">
                  <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    ₹{app.priceInr.toLocaleString('en-IN')}
                  </span>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}> /month</span>
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
        All prices in INR per company, billed monthly via direct bank transfer or UPI. Cancel anytime —
        your apps stay active until the end of the paid period.
      </p>

      {/* Sticky selection summary */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card) / 0.95)' }}
        >
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {selected.length} app{selected.length > 1 ? 's' : ''} selected —{' '}
                <span className="text-[#1BE1D3]">₹{selectedTotal.toLocaleString('en-IN')}/month</span>
              </p>
              {oneIsCheaper && bundle && (
                <p className="text-xs text-amber-500">
                  AINOS One gives you every app for ₹{bundle.priceInr.toLocaleString('en-IN')}/month — better deal!
                </p>
              )}
            </div>
            {oneIsCheaper && bundle && (
              <button
                onClick={() => checkout({ plan: 'one' })}
                disabled={choosing}
                className="px-5 py-2.5 rounded-lg bg-[#1BE1D3] text-black text-sm font-medium hover:bg-[#1BE1D3]/90 transition-colors disabled:opacity-60"
              >
                Get AINOS One Instead
              </button>
            )}
            <button
              onClick={() => checkout({ apps: selected })}
              disabled={choosing}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
                oneIsCheaper
                  ? 'border border-[#1BE1D3]/40 text-[#1BE1D3] hover:bg-[#1BE1D3]/10'
                  : 'bg-[#1BE1D3] text-black hover:bg-[#1BE1D3]/90'
              }`}
            >
              {choosing ? 'Preparing...' : 'Continue to Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
