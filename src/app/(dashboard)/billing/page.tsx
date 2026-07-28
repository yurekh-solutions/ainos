'use client';

import { useEffect, useState } from 'react';
import {
  Rocket,
  Zap,
  Crown,
  CheckCircle,
  Clock,
  Copy,
  Check,
  MessageCircle,
  Landmark,
} from 'lucide-react';

interface SubscriptionInfo {
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string;
}

interface PlanInfo {
  key: string;
  name: string;
  priceInr: number;
  features: string[];
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
  planName: string;
  amountInr: number;
  payment: PaymentInfo;
  whatsappUrl: string;
}

const PLAN_ICONS: Record<string, typeof Rocket> = {
  starter: Rocket,
  growth: Zap,
  scale: Crown,
};

const FEATURE_LABELS: Record<string, string> = {
  crm: 'CRM: Contacts, Deals & Follow-ups',
  invoicing: 'Invoicing & Payment Tracking',
  customers: 'Customer Management',
  reports_basic: 'Basic Reports',
  hr: 'HR: Employees, Attendance & Leaves',
  payroll: 'Payroll Runs',
  compliance: 'Compliance Calendar & Documents',
  automations: 'Workflow Automations',
  ai_studio: 'AI Studio: Chat, Content & Media',
  inventory: 'Inventory, Warehouses & Purchase Orders',
  helpdesk: 'Helpdesk & Ticketing',
  reports_advanced: 'Advanced Reports & Insights',
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState<string | null>(null);
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
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching billing:', error);
    } finally {
      setLoading(false);
    }
  };

  const choosePlan = async (planKey: string) => {
    setChoosing(planKey);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (res.ok) {
        setInstructions(data);
        fetchBilling();
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error choosing plan:', error);
    } finally {
      setChoosing(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1BE1D3]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          Billing & Plans
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Manage your AINOS subscription
        </p>
      </div>

      {/* Current plan status */}
      {subscription && (
        <div
          className="rounded-xl border p-5 flex flex-wrap items-center gap-4"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
        >
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Current Plan
            </p>
            <p className="text-lg font-medium capitalize" style={{ color: 'hsl(var(--foreground))' }}>
              {subscription.plan}
            </p>
          </div>
          {subscription.status === 'pending' && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" /> Awaiting payment confirmation
            </span>
          )}
          {subscription.status === 'trialing' && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#1BE1D3]/10 text-[#1BE1D3] border border-[#1BE1D3]/30">
              <Clock className="w-3.5 h-3.5" /> Trial ends {formatDate(subscription.trialEndsAt)}
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
                Complete Your Payment — {instructions.planName} Plan
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
            Your plan is activated within a few hours of payment verification, usually much faster.
          </p>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.key] || Rocket;
          const isCurrent =
            subscription?.plan === plan.key &&
            ['active', 'trialing'].includes(subscription?.status || '');
          const isPopular = plan.key === 'growth';
          return (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-xl border p-6 ${
                isPopular ? 'border-[#1BE1D3]/60' : ''
              }`}
              style={{
                borderColor: isPopular ? undefined : 'hsl(var(--border))',
                background: 'hsl(var(--card))',
              }}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#1BE1D3] text-black text-xs font-medium">
                  Most Popular
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-[#1BE1D3]" />
                <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  {plan.name}
                </h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  ₹{plan.priceInr.toLocaleString('en-IN')}
                </span>
                <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {' '}/month
                </span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-grow">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1BE1D3] mt-0.5 shrink-0" />
                    <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {FEATURE_LABELS[f] || f}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choosePlan(plan.key)}
                disabled={choosing !== null || isCurrent}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-emerald-500/10 text-emerald-500 cursor-default'
                    : isPopular
                    ? 'bg-[#1BE1D3] text-black hover:bg-[#1BE1D3]/90'
                    : 'border border-[#1BE1D3]/40 text-[#1BE1D3] hover:bg-[#1BE1D3]/10'
                } disabled:opacity-60`}
              >
                {isCurrent
                  ? 'Current Plan'
                  : choosing === plan.key
                  ? 'Preparing...'
                  : 'Choose Plan'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
        All prices in INR, billed monthly via direct bank transfer or UPI. Cancel anytime —
        your plan stays active until the end of the paid period.
      </p>
    </div>
  );
}
