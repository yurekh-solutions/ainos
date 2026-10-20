'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  IndianRupee, BadgeCheck, Hourglass, UsersRound,
  FilePlus2, NotebookPen, CalendarDays, Calculator, Megaphone, Star, ArrowRight,
} from 'lucide-react';
import {
  CARD, HOVER, PAGE, CONTAINER, fadeUp, IconCircle, Skeleton, Tone,
  formatINR, formatCompact, FINANCE_TOOLS, marketingTools,
  useFinanceSummary, useTemplateCount, RecentInvoicesCard, CollectionsCard,
} from '@/components/dashboard/kit';

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

  const stats: { label: string; value: string; full: string; hint: string; icon: React.ElementType; tone: Tone }[] = [
    { label: 'Total billed', value: formatCompact(data.billed), full: formatINR(data.billed), hint: `${data.invoiceCount} invoice${data.invoiceCount === 1 ? '' : 's'}`, icon: IndianRupee, tone: 'green' },
    { label: 'Collected', value: formatCompact(data.collected), full: formatINR(data.collected), hint: `${collectionRate}% of billed`, icon: BadgeCheck, tone: 'purple' },
    { label: 'Outstanding', value: formatCompact(data.outstanding), full: formatINR(data.outstanding), hint: data.overdueCount ? `${data.overdueCount} overdue` : 'Nothing overdue', icon: Hourglass, tone: 'orange' },
    { label: 'Customers', value: data.customers.toString(), full: data.customers.toString(), hint: `${data.products} product${data.products === 1 ? '' : 's'} in catalog`, icon: UsersRound, tone: 'blue' },
  ];

  const mTools = marketingTools(templateLabel);
  const suites = [
    {
      title: 'Finance Suite',
      description: 'GST billing, quotations, expenses, challans and Tally sync for Indian businesses.',
      icon: Calculator,
      tools: FINANCE_TOOLS,
      href: '/dashboard/finance',
      meta: `${data.invoiceCount} invoices · ${data.products} products`,
    },
    {
      title: 'Marketing Suite',
      description: 'Social captions, SEO audits, blogs and branded invitations to grow your reach.',
      icon: Megaphone,
      tools: mTools,
      href: '/dashboard/marketing',
      meta: `${templateLabel} invitation templates`,
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
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15">
              <Star className="w-3 h-3 text-[#c4b5fd] fill-[#c4b5fd]" />
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
            <motion.div key={stat.label} {...fadeUp(0.04 + i * 0.03)} className={`${CARD} p-4 sm:p-5 min-w-0`}>
              <div className="flex items-start gap-3">
                <IconCircle icon={stat.icon} tone={stat.tone} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 truncate">{stat.label}</p>
                  {loaded ? (
                    <p title={stat.full} className="mt-1.5 text-lg sm:text-2xl font-semibold text-neutral-900 tabular-nums tracking-tight truncate">
                      {stat.value}
                    </p>
                  ) : (
                    <Skeleton className="mt-2 h-7 w-20" />
                  )}
                  <p className={`text-xs font-light mt-1 truncate ${i === 0 ? 'text-[#6d28d9]' : 'text-neutral-400'}`}>{stat.hint}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Suites */}
        <motion.section {...fadeUp(0.1)} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {suites.map(suite => (
            <Link key={suite.title} href={suite.href} className={`group ${CARD} ${HOVER} p-5 sm:p-6 flex flex-col min-w-0`}>
              <div className="flex items-start gap-4">
                <IconCircle icon={suite.icon} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-neutral-900">{suite.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-600 flex-shrink-0">
                      {suite.tools.length} tools
                    </span>
                  </div>
                  <p className="text-[13px] text-neutral-500 font-light leading-relaxed mt-1">{suite.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 sm:pl-16">
                {suite.tools.slice(0, 4).map(t => (
                  <span key={t.title} className="inline-flex items-center gap-1.5 text-xs text-neutral-600">
                    <t.icon className="w-3.5 h-3.5 text-[#6d28d9]" />
                    {t.title}
                  </span>
                ))}
                {suite.tools.length > 4 && (
                  <span className="text-xs text-neutral-400">+{suite.tools.length - 4} more</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 mt-auto pt-5 sm:pl-16">
                <span className="text-xs text-neutral-400 font-light truncate">{loaded ? suite.meta : '—'}</span>
                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#6d28d9] flex-shrink-0">
                  Open suite <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </motion.section>

        {/* Recent invoices + collections */}
        <motion.div {...fadeUp(0.14)} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
          <RecentInvoicesCard data={data} loaded={loaded} className="lg:col-span-2" />
          <CollectionsCard data={data} loaded={loaded} rate={collectionRate} />
        </motion.div>
      </div>
    </div>
  );
}
