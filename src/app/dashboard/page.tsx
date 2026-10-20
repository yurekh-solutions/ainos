'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  IndianRupee, BadgeCheck, Hourglass, UsersRound,
  FilePlus2, NotebookPen, CalendarDays, Calculator, Megaphone, ArrowRight,
} from 'lucide-react';
import {
  CARD, HOVER, PAGE, CONTAINER, fadeUp, IconCircle, Skeleton, Tone, plural,
  formatINR, formatCompact, FINANCE_TOOLS, marketingTools,
  useFinanceSummary, useTemplateCount, RecentInvoicesCard, CollectionsCard,
} from '@/components/dashboard/kit';

const TOOL_TONES: Tone[] = ['purple', 'blue', 'green', 'orange'];

function useCampaignCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/email-campaigns')
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (!cancelled) setCount(Array.isArray(d) ? d.length : 0); })
      .catch(() => { if (!cancelled) setCount(0); });
    return () => { cancelled = true; };
  }, []);
  return count;
}

/** Isometric bar-chart monitor drawn in SVG so it stays crisp on the banner. */
function HeroIllustration({ className }: { className?: string }) {
  const base = 118;
  const bars = [
    { x: 74, h: 30 },
    { x: 98, h: 50 },
    { x: 122, h: 40 },
    { x: 146, h: 66 },
  ];
  const w = 16;
  const d = 7;
  return (
    <svg viewBox="0 0 220 150" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hero-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#c4b5fd" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="hero-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e0e7ff" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="hero-base" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {/* platform */}
      <path d="M38 124 L118 96 L198 124 L118 148 Z" fill="url(#hero-base)" />
      {/* screen */}
      <path d="M58 28 L180 6 Q186 5 186 11 L186 98 Q186 103 181 104 L60 124 Q54 125 54 119 L54 34 Q54 29 58 28 Z" fill="url(#hero-screen)" stroke="#ffffff" strokeOpacity="0.35" />
      <path d="M66 40 L110 32" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
      <path d="M66 50 L92 46" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
      {/* bars */}
      {bars.map(({ x, h }) => (
        <g key={x}>
          <path d={`M${x + w} ${base - h} L${x + w + d} ${base - h - d} L${x + w + d} ${base - d} L${x + w} ${base} Z`} fill="#6366f1" />
          <path d={`M${x} ${base - h} L${x + d} ${base - h - d} L${x + w + d} ${base - h - d} L${x + w} ${base - h} Z`} fill="#eef2ff" />
          <rect x={x} y={base - h} width={w} height={h} fill="url(#hero-bar)" />
        </g>
      ))}
      {/* trend line */}
      <path d="M78 76 L106 60 L130 68 L160 44" fill="none" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="160" cy="44" r="4" fill="#fde68a" />
    </svg>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, loaded, collectionRate } = useFinanceSummary();
  const templateLabel = useTemplateCount();
  const campaignCount = useCampaignCount();

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
      label: 'Collected', value: formatCompact(data.collected), full: formatINR(data.collected), icon: BadgeCheck, tone: 'purple', href: '/invoices',
      foot: (
        <span className="flex items-center gap-2">
          <span className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <span className="block h-full rounded-full bg-[#6d28d9] transition-[width] duration-700" style={{ width: `${collectionRate}%` }} />
          </span>
          <span className="text-neutral-500 tabular-nums">{collectionRate}%</span>
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

  const mTools = marketingTools(templateLabel);
  const suites = [
    {
      title: 'Finance Suite',
      description: 'GST billing, quotations, expenses, challans and Tally sync for Indian businesses.',
      icon: Calculator,
      tools: FINANCE_TOOLS,
      href: '/dashboard/finance',
      metrics: [
        { label: 'Invoices', value: data.invoiceCount.toString() },
        { label: 'Customers', value: data.customers.toString() },
        { label: 'Products', value: data.products.toString() },
      ],
    },
    {
      title: 'Marketing Suite',
      description: 'Social captions, SEO audits, blogs and branded invitations to grow your reach.',
      icon: Megaphone,
      tools: mTools,
      href: '/dashboard/marketing',
      metrics: [
        { label: 'Templates', value: templateLabel },
        { label: 'Campaigns', value: campaignCount === null ? '—' : campaignCount.toString() },
      ],
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  const todayLong = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayShort = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className={PAGE}>
      <div className={CONTAINER}>

        {/* Welcome banner */}
        <motion.section
          {...fadeUp()}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a1170] via-[#251266] to-[#3b1d9a] text-white shadow-[0_12px_30px_-12px_rgba(59,29,154,0.6)]"
        >
          <div className="pointer-events-none absolute -top-24 right-0 w-[420px] h-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.35),transparent)]" />
          <HeroIllustration className="pointer-events-none absolute right-2 top-3 w-28 sm:w-44 md:right-8 md:top-1/2 md:-translate-y-1/2 md:w-56 lg:w-64 opacity-95" />

          <div className="relative p-5 sm:p-7 lg:p-8 md:pr-72 lg:pr-80">
            <span className="hidden sm:inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15">
              <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <Image src="/ainos-alpha.png" alt="" width={14} height={13} className="w-3.5 h-auto" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90">AINOS Business Suite</span>
            </span>
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight sm:mt-4 pr-28 sm:pr-44 md:pr-0">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-[13px] sm:text-sm text-white/75 font-light mt-2 max-w-md leading-relaxed pr-24 sm:pr-40 md:pr-0">
              {data.overdueCount > 0
                ? `You have ${data.overdueCount} overdue invoice${data.overdueCount === 1 ? '' : 's'} to follow up on.`
                : 'Billing, accounts and marketing for your business — all in one workspace.'}
            </p>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4 sm:mt-6">
              <p className="inline-flex items-center gap-2 text-[13px] text-white/80">
                <CalendarDays className="w-4 h-4 text-white/60" />
                <span className="sm:hidden">{todayShort}</span>
                <span className="hidden sm:inline">{todayLong}</span>
              </p>
              <div className="grid grid-cols-2 sm:flex gap-3">
                <Link
                  href="/marketing/blog"
                  className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-full bg-white text-[#3b1d9a] hover:bg-violet-50 text-sm font-medium transition-colors"
                >
                  <NotebookPen className="w-4 h-4" />
                  Write a blog
                </Link>
                <Link
                  href="/invoices"
                  className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium ring-1 ring-white/15 transition-colors"
                >
                  <FilePlus2 className="w-4 h-4" />
                  New invoice
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} {...fadeUp(0.04 + i * 0.03)} className="min-w-0">
              <Link href={stat.href} className={`group ${CARD} ${HOVER} p-4 sm:p-5 h-full flex flex-col min-w-0`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-neutral-500 leading-snug pt-1">{stat.label}</p>
                  <IconCircle icon={stat.icon} tone={stat.tone} />
                </div>
                {loaded ? (
                  <p title={stat.full} className="mt-2 text-xl sm:text-[26px] font-semibold text-neutral-900 tabular-nums tracking-tight break-words">
                    {stat.value}
                  </p>
                ) : (
                  <Skeleton className="mt-3 h-7 w-20" />
                )}
                <div className="mt-auto pt-3 text-xs">{loaded ? stat.foot : <Skeleton className="h-4 w-24" />}</div>
              </Link>
            </motion.div>
          ))}
        </section>

        {/* Suites */}
        <motion.section {...fadeUp(0.1)} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {suites.map(suite => (
            <div key={suite.title} className={`${CARD} p-5 sm:p-6 flex flex-col min-w-0`}>
              <div className="flex items-start gap-4">
                <IconCircle icon={suite.icon} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-neutral-900">{suite.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-violet-50 text-[11px] font-medium text-[#6d28d9] flex-shrink-0">
                      {suite.tools.length} tools
                    </span>
                  </div>
                  <p className="text-[13px] text-neutral-500 font-light leading-relaxed mt-1">{suite.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 sm:gap-2 mt-4 -mx-2">
                {suite.tools.slice(0, 4).map((t, i) => (
                  <Link
                    key={t.title}
                    href={t.href}
                    className="group flex items-center gap-3 p-2 sm:p-2.5 rounded-xl hover:bg-[#f7f5fb] transition-colors min-w-0"
                  >
                    <IconCircle icon={t.icon} tone={TOOL_TONES[i % TOOL_TONES.length]} size="sm" />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-neutral-800 group-hover:text-[#6d28d9] leading-snug transition-colors">{t.title}</span>
                      <span className="block text-[11px] text-neutral-500 font-light leading-snug mt-0.5">{t.short}</span>
                    </span>
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4 mt-auto pt-5">
                <div className="flex items-center gap-5 sm:gap-6">
                  {suite.metrics.map(m => (
                    <div key={m.label} className="min-w-0">
                      <p className="text-base font-semibold text-neutral-900 tabular-nums">{loaded ? m.value : '—'}</p>
                      <p className="text-[11px] text-neutral-500 font-light">{m.label}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href={suite.href}
                  className="group inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-violet-50 text-[#6d28d9] hover:bg-[#6d28d9] hover:text-white text-[13px] font-medium transition-colors"
                >
                  All {suite.tools.length} tools
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </motion.section>

        {/* Recent invoices + collections */}
        <motion.div {...fadeUp(0.14)} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <RecentInvoicesCard data={data} loaded={loaded} className="lg:col-span-2" />
          <CollectionsCard data={data} loaded={loaded} rate={collectionRate} />
        </motion.div>
      </div>
    </div>
  );
}
