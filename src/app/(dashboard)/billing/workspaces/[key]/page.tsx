'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { verticalByKey } from '@/lib/verticals';
import { NAV_GROUPS } from '@/components/layout/navigation';
import { getWorkspaceOffering, ANNUAL_MONTHS_CHARGED } from '@/lib/workspace-pricing';
import { fadeUp } from '@/components/dashboard/kit';

type Cycle = 'monthly' | 'annual';

interface SubState {
  status: string;
  billingCycle: string;
  currentPeriodEnd: string | null;
  seats: number;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay) return resolve(true);
    const existing = document.querySelector('script[data-razorpay]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpay = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function WorkspacePricingPage() {
  const params = useParams<{ key: string }>();
  const key = params?.key ?? '';
  const router = useRouter();

  const vertical = verticalByKey(key);
  const offering = getWorkspaceOffering(key);
  const items = useMemo(() => NAV_GROUPS.find((g) => g.key === key)?.items ?? [], [key]);

  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [seats, setSeats] = useState(1);
  const [sub, setSub] = useState<SubState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/workspaces');
      if (!res.ok) return;
      const data = await res.json();
      const found = (data.workspaces ?? []).find((w: { key: string }) => w.key === key);
      if (found?.subscription) setSub(found.subscription);
    } catch {
      /* ignore — pricing still renderable without live status */
    }
  }, [key]);

  useEffect(() => {
    let active = true;
    refresh().finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [refresh]);

  if (!vertical || !offering) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-neutral-600 mb-4">We couldn&apos;t find that workspace.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: '#5b21b6' }}>
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  const Icon = vertical.icon;
  const safeSeats = Math.min(Math.max(1, Math.floor(seats) || 1), 500);
  const monthlyTotal = offering.monthlyInr * safeSeats;
  const chargeInr = cycle === 'annual' ? monthlyTotal * ANNUAL_MONTHS_CHARGED : monthlyTotal;
  const alreadyUnlocked = sub?.status === 'active';

  const handlePay = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/billing/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, cycle, seats: safeSeats }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start checkout');

      // Payments not wired yet → the order auto-activated server-side (dev stub).
      if (data.directlyActivated) {
        setNotice({ ok: true, text: `${vertical.title} is unlocked.` });
        await refresh();
        setTimeout(() => router.push(vertical.landingHref), 600);
        return;
      }
      if (!data.orderId || !data.keyId) throw new Error('Payments are not configured yet. Please contact support.');

      const ready = await loadRazorpay();
      if (!ready) throw new Error('The payment window could not load. Check your connection and retry.');

      const Razorpay = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
      const checkout = new Razorpay({
        key: data.keyId,
        amount: data.amountMinor,
        currency: data.currency || 'INR',
        name: 'AINOS',
        description: `${vertical.title} — ${cycle}`,
        order_id: data.orderId,
        theme: { color: '#4c1d95' },
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch('/api/billing/workspaces/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const result = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(result.error || 'Payment could not be confirmed');
            setNotice({ ok: true, text: `${vertical.title} is unlocked. Opening your workspace…` });
            await refresh();
            setTimeout(() => router.push(vertical.landingHref), 700);
          } catch (error) {
            setNotice({ ok: false, text: error instanceof Error ? error.message : 'Payment could not be confirmed' });
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.open();
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : 'Checkout failed' });
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-800 mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      {/* Hero */}
      <motion.div {...fadeUp(0.02)} className="flex items-start gap-3 sm:gap-4 mb-6">
        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(76,29,149,0.08)' }}>
          <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#4c1d95' }} />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{vertical.title}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{vertical.tagline}</p>
        </div>
      </motion.div>

      {notice && (
        <motion.div {...fadeUp(0.03)}
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${notice.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {notice.text}
        </motion.div>
      )}

      <div className="grid md:grid-cols-5 gap-5">
        {/* What's inside */}
        <motion.section {...fadeUp(0.06)} className="md:col-span-3 rounded-2xl bg-white border border-neutral-100 p-5 sm:p-6 shadow-[0_4px_20px_-8px_rgb(0_0_0_/_0.08)]">
          <h2 className="text-sm font-bold text-neutral-900 mb-1">What&apos;s inside</h2>
          <p className="text-xs text-neutral-500 mb-4">Unlocking {vertical.shortTitle} opens every tool below for your whole team.</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {items.map((t) => (
              <li key={t.href} className="flex items-center gap-2 text-sm text-neutral-700">
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(109,40,217,0.12)' }}>
                  <Check className="w-3 h-3" style={{ color: '#6d28d9' }} />
                </span>
                {t.label}
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Price / checkout */}
        <motion.aside {...fadeUp(0.1)} className="md:col-span-2 rounded-2xl border border-purple-100 bg-white p-5 sm:p-6 shadow-[0_10px_30px_-12px_rgb(109_40_217_/_0.25)] h-fit">
          {alreadyUnlocked ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
                  <Check className="w-4 h-4 text-green-600" />
                </span>
                <p className="text-sm font-bold text-green-700">Unlocked</p>
              </div>
              <p className="text-xs text-neutral-500 mb-4">
                {sub?.billingCycle === 'annual' ? 'Annual' : 'Monthly'} plan
                {sub?.currentPeriodEnd ? ` · renews ${new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
              </p>
              <Link href={vertical.landingHref}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold text-white"
                style={{ background: 'linear-gradient(90deg, #4c1d95, #6d28d9)' }}>
                Open {vertical.shortTitle} <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-neutral-400 mt-3 text-center">Manage or cancel anytime from Billing.</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-neutral-400" />
                <p className="text-sm font-bold text-neutral-900">Unlock {vertical.shortTitle}</p>
              </div>

              {/* Cycle toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-neutral-100 mb-4">
                {(['monthly', 'annual'] as Cycle[]).map((c) => (
                  <button key={c} type="button" onClick={() => setCycle(c)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${cycle === c ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                    {c}
                    {c === 'annual' && <span className="block text-[10px] font-medium text-green-600">2 months free</span>}
                  </button>
                ))}
              </div>

              {/* Seats */}
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Team seats</label>
              <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={() => setSeats((s) => Math.max(1, s - 1))}
                  className="w-9 h-9 rounded-lg border border-neutral-200 text-neutral-600 font-bold hover:bg-neutral-50">−</button>
                <input
                  type="number" min={1} max={500} value={safeSeats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-16 h-9 text-center rounded-lg border border-neutral-200 text-sm font-semibold text-neutral-900"
                />
                <button type="button" onClick={() => setSeats((s) => Math.min(500, s + 1))}
                  className="w-9 h-9 rounded-lg border border-neutral-200 text-neutral-600 font-bold hover:bg-neutral-50">+</button>
                <span className="text-xs text-neutral-500">user{safeSeats > 1 ? 's' : ''}</span>
              </div>

              {/* Price */}
              <div className="flex items-end justify-between border-t border-neutral-100 pt-4 mb-4">
                <div>
                  <p className="text-2xl font-extrabold text-neutral-900">{inr(chargeInr)}</p>
                  <p className="text-[11px] text-neutral-500">{cycle === 'annual' ? `billed yearly · ${inr(monthlyTotal)}/mo` : 'per month'}</p>
                </div>
              </div>

              <button type="button" onClick={handlePay} disabled={busy || loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(90deg, #4c1d95, #6d28d9)' }}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {busy ? 'Processing…' : `Pay ${inr(chargeInr)}`}
              </button>
              <p className="text-[11px] text-neutral-400 mt-3 text-center">Secure payment · recurring · cancel anytime.</p>
            </>
          )}
        </motion.aside>
      </div>
    </div>
  );
}
