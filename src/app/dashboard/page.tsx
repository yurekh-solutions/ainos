'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  IndianRupee, Hourglass, UsersRound, Wallet, ArrowRight, ArrowDown, ArrowUp, ExternalLink, Check, X } from 'lucide-react';
import {
  fadeUp, IconCircle, Skeleton, Tone, plural,
  formatINR, formatCompact,
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

  // Plan banner + setup checklist signals.
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [teamCount, setTeamCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/team')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const arr = Array.isArray(d) ? d : (d?.users ?? d?.members ?? []);
        if (!cancelled && Array.isArray(arr)) setTeamCount(arr.length);
      })
      .catch(() => {});
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

  const outstandingFoot = data.overdueCount > 0
    ? { text: `${data.overdueCount} overdue`, cls: 'bg-rose-50 text-rose-600' }
    : data.outstanding > 0
      ? { text: 'Awaiting payment', cls: 'bg-orange-50 text-orange-600' }
      : { text: 'All settled', cls: 'bg-emerald-50 text-emerald-600' };

  const stats: { label: string; value: string; full: string; icon: React.ElementType; tone: Tone; href: string; foot: React.ReactNode }[] = [
    {
      label: 'Total billed', value: formatCompact(data.billed), full: formatINR(data.billed), icon: IndianRupee, tone: 'green', href: '/invoices',
      foot: <span className="text-neutral-500 font-light">Across <span className="font-medium text-neutral-800">{plural(data.invoiceCount, 'invoice')}</span></span>,
    },
    {
      label: 'Collected', value: formatCompact(data.collected), full: formatINR(data.collected), icon: Wallet, tone: 'purple', href: '/invoices',
      foot: (
        <span className={`overview-rate ${collectionRate > 0 ? 'is-positive' : ''}`}>
          {collectionRate > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {collectionRate}% collected
        </span>
      ),
    },
    {
      label: 'Outstanding', value: formatCompact(data.outstanding), full: formatINR(data.outstanding), icon: Hourglass, tone: 'orange', href: '/finance/reminders',
      foot: <span className={`inline-flex px-2.5 py-1 rounded-full font-medium ${outstandingFoot.cls}`}>{outstandingFoot.text}</span>,
    },
    {
      label: 'Customers', value: data.customers.toString(), full: data.customers.toString(), icon: UsersRound, tone: 'blue', href: '/customers',
      foot: data.customers === 0
        ? <span className="inline-flex items-center gap-1 font-medium text-[#6d28d9]">Add your first <ArrowRight className="w-3 h-3" /></span>
        : <span className="text-neutral-500 font-light">{plural(data.products, 'product')} in catalog</span>,
    },
  ];

  const setupSteps = [
    { label: 'Add your first customer', href: '/customers', done: data.customers > 0 },
    { label: 'Create your first invoice', href: '/invoices/new', done: data.invoiceCount > 0 },
    { label: 'Build your product catalog', href: '/products', done: data.products > 0 },
    { label: 'Invite a team member', href: '/team', done: teamCount !== null && teamCount > 1 },
  ];
  const setupDone = setupSteps.filter(s => s.done).length;

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

        {/* Stats */}
        <section className="overview-stats" aria-label="Business summary">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} {...fadeUp(0.04 + i * 0.03)} className="min-w-0">
              <Link href={stat.href} className={`overview-card overview-stat overview-tone-${stat.tone}`}>
                <IconCircle icon={stat.icon} tone={stat.tone} size="lg" />
                <div className="overview-stat-copy">
                  <p className="overview-stat-label">{stat.label}</p>
                  {loaded ? (
                    <p title={stat.full} className="overview-stat-value">{stat.value}</p>
                  ) : (
                    <Skeleton className="mt-2 h-7 w-20" />
                  )}
                  <div className="overview-stat-foot">{loaded ? stat.foot : <Skeleton className="h-4 w-20" />}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </section>

        {/* Workspaces — Zoho-style showcase tiles, one clear entry per vertical */}
        <motion.section {...fadeUp(0.08)} aria-label="Your workspaces" className="mb-6">
          <div className="flex items-end justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Your Workspaces</h2>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Each workspace groups the tools one team uses — open it with a single click</p>
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
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium" style={{ color: '#6d28d9', background: 'rgba(109,40,217,0.07)' }}>+{items.length - preview.length} more</span>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-0.5 sm:pt-1">
                      <span className="text-[10px] sm:text-[11px] font-medium text-neutral-500">{items.length} tools</span>
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold" style={{ color: '#5b21b6' }}>
                        <span className="hidden sm:inline">Open workspace</span> <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                  <Link
                    href={`/auth/signin?v=${v.key}&callbackUrl=${encodeURIComponent(v.landingHref)}`}
                    title={`${v.title} login page`}
                    className="hidden sm:flex absolute top-3 right-3 w-7 h-7 rounded-lg items-center justify-center text-neutral-300 hover:text-[#5b21b6] hover:bg-purple-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Setup checklist — guides new companies to their first real actions */}
        {loaded && setupDone < setupSteps.length && (
          <motion.section {...fadeUp(0.12)} aria-label="Your setup" className="mb-6 rounded-2xl bg-white border border-neutral-100 p-4 sm:p-5 shadow-[0_4px_20px_-8px_rgb(0_0_0_/_0.08)]">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Your Setup</h2>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: '#5b21b6', background: 'rgba(109,40,217,0.08)' }}>{setupDone}/{setupSteps.length} completed</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(setupDone / setupSteps.length) * 100}%`, background: 'linear-gradient(90deg, #4c1d95, #6d28d9)' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {setupSteps.map(s => (
                <Link key={s.label} href={s.href} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 min-w-0 transition-colors ${s.done ? 'border-emerald-100 bg-emerald-50/50' : 'border-neutral-100 bg-white hover:border-purple-200 hover:bg-purple-50/40'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-emerald-500 text-white' : 'bg-neutral-100'}`}>
                    {s.done ? <Check className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />}
                  </span>
                  <span className={`text-[13px] truncate ${s.done ? 'text-neutral-400 line-through' : 'font-medium text-neutral-800'}`}>{s.label}</span>
                  {!s.done && <ArrowRight className="w-3.5 h-3.5 ml-auto text-[#6d28d9] flex-shrink-0" />}
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recent invoices + collections */}
        <motion.div {...fadeUp(0.14)} className="overview-widgets">
          <RecentInvoicesCard data={data} loaded={loaded} appearance="lavender" />
          <CollectionsCard data={data} loaded={loaded} rate={collectionRate} appearance="lavender" />
        </motion.div>
      </div>
    </div>
  );
}
