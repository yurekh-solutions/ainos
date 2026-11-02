'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  ArrowRight, X } from 'lucide-react';
import {
  fadeUp,
  useFinanceSummary, RecentInvoicesCard, CollectionsCard,
} from '@/components/dashboard/kit';
import { VERTICALS, verticalByKey } from '@/lib/verticals';
import { NAV_GROUPS } from '@/components/layout/navigation';

const PLAN_LABELS: Record<string, string> = {
  starter: 'AINOS Starter',
  growth: 'AINOS Growth',
  enterprise: 'AINOS Enterprise',
  one: 'AINOS One',
  marketing_starter: 'AINOS Marketing Starter',
  marketing_growth: 'AINOS Marketing Growth',
  marketing_pro: 'AINOS Marketing Pro',
};

type PlanInfo = { label: string; validTill: string | null; trial: boolean; credits: number | null };

export default function DashboardPage() {

  const { data, loaded, collectionRate } = useFinanceSummary();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  // Set by middleware when a workspace route was blocked for this member.
  const noAccess = verticalByKey(searchParams.get('no_access'));
  const [toastDismissed, setToastDismissed] = useState(false);
  // Workspaces this member can open; undefined = legacy session, show all.
  const allowed = session?.user?.verticals;
  const myVerticals = VERTICALS.filter(v => !allowed || allowed.includes(v.key));

  // Plan banner signal.
  const [plan, setPlan] = useState<PlanInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/billing').then(r => (r.ok ? r.json() : null)),
      fetch('/api/billing/credits').then(r => (r.ok ? r.json() : null)),
    ])
      .then(([billing, credits]) => {
        const sub = billing?.subscription;
        if (cancelled || !sub) return;
        const label = PLAN_LABELS[sub.plan] || (sub.plan ? `AINOS ${String(sub.plan)}` : 'AINOS Plan');
        const end = sub.currentPeriodEnd
          ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : null;
        setPlan({ label, validTill: end, trial: sub.status === 'trial', credits: typeof credits?.balance === 'number' ? credits.balance : null });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="ainos-overview">
      <div className="overview-container">
        <h1 className="sr-only">AINOS Business Dashboard</h1>

        {/* Blocked-workspace notice from middleware redirect */}
        {noAccess && !toastDismissed && (
          <motion.div {...fadeUp(0.02)} className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 mb-6">
            <p className="text-sm text-amber-800">You don&apos;t have access to {noAccess.title} — ask your company admin to grant this workspace.</p>
            <button
              onClick={() => setToastDismissed(true)}
              aria-label="Dismiss"
              className="w-8 h-8 rounded-full flex items-center justify-center text-amber-600 hover:bg-amber-100 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Plan banner — subscription + credits always in sight (Zoho-style) */}
        <motion.div {...fadeUp(0.01)}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-2xl px-4 py-2.5 mb-5 text-white shadow-[0_6px_18px_-8px_rgb(76_29_149_/_0.45)]"
          style={{ background: 'linear-gradient(90deg, #4c1d95, #6d28d9)' }}>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-[13px] font-bold">{plan ? plan.label : 'AINOS Trial'}</span>
            {plan?.trial && <span className="text-xs text-white/85">Trial period active</span>}
            {plan && !plan.trial && plan.validTill && <span className="text-xs text-white/85">Valid till {plan.validTill}</span>}
            {typeof plan?.credits === 'number' && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 border border-white/25">{plan.credits} credits</span>
            )}
            {!plan && <span className="text-xs text-white/85">Explore every workspace, then pick your plan</span>}
          </div>
          <Link href="/billing" className="inline-flex items-center gap-1 text-xs font-bold hover:underline whitespace-nowrap">
            {plan ? 'Manage plan' : 'View plans'} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        {/* Workspaces — Zoho-style showcase tiles, one clear entry per vertical */}
        <motion.section {...fadeUp(0.08)} aria-label="Your workspaces" className="mb-6">
          <div className="flex items-end justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Your Workspaces</h2>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Open the tools your team uses each day</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
            {myVerticals.map((v, i) => {
              const Icon = v.icon;
              const items = NAV_GROUPS.find(g => g.key === v.key)?.items ?? [];
              const preview = items.slice(0, 4);
              return (
                <motion.div key={v.key} {...fadeUp(0.1 + i * 0.02)} className="relative rounded-2xl bg-white border border-neutral-100 p-2.5 sm:p-4 shadow-[0_4px_20px_-8px_rgb(0_0_0_/_0.08)] hover:shadow-[0_12px_30px_-10px_rgb(109_40_217_/_0.22)] hover:border-purple-200 transition-all">
                  <Link href={v.landingHref} className="flex flex-col gap-2 sm:gap-3 min-w-0 h-full">
                    <div className="flex items-center sm:items-start gap-2 sm:gap-3">
                      <span className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(76,29,149,0.08)' }}>
                        <Icon className="w-4 h-4 sm:w-[22px] sm:h-[22px]" style={{ color: '#4c1d95' }} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                          <span className="sm:hidden">{v.shortTitle}</span>
                          <span className="hidden sm:inline">{v.title}</span>
                        </h3>
                        <p className="hidden sm:block text-xs leading-snug mt-0.5 text-neutral-500 line-clamp-2">{v.tagline}</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-wrap gap-1.5">
                      {preview.map(t => (
                        <span key={t.href} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-50 border border-neutral-100 text-[11px] font-medium text-neutral-600">
                          <t.icon className="w-3 h-3" style={{ color: '#6d28d9' }} />{t.label}
                        </span>
                      ))}
                      {items.length > preview.length && (
                        <span className="px-2 py-0.5 rounded-lg bg-neutral-50 border border-neutral-100 text-[11px] font-medium text-neutral-600">+{items.length - preview.length} more</span>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-0.5 sm:pt-1">
                      <span className="text-[10px] sm:text-[11px] font-medium text-neutral-500">{items.length} tools</span>
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold" style={{ color: '#5b21b6' }}>
                        <span className="hidden sm:inline">Open</span> <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Recent invoices + collections */}
        <motion.div {...fadeUp(0.14)} className="overview-widgets">
          <RecentInvoicesCard data={data} loaded={loaded} appearance="lavender" />
          <CollectionsCard data={data} loaded={loaded} rate={collectionRate} appearance="lavender" />
        </motion.div>
      </div>
    </div>
  );
}
