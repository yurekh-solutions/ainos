'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  IndianRupee, Hourglass, UsersRound,
  Wallet, Calculator, Megaphone, ArrowRight, ArrowDown, ArrowUp,
} from 'lucide-react';
import {
  fadeUp, IconCircle, Skeleton, Tone, plural,
  formatINR, formatCompact, FINANCE_TOOLS, marketingTools,
  useFinanceSummary, useTemplateCount, RecentInvoicesCard, CollectionsCard,
} from '@/components/dashboard/kit';

const TOOL_TONES: Tone[] = ['purple', 'blue', 'purple', 'orange', 'blue'];

function SuiteIllustration({ kind }: { kind: 'finance' | 'marketing' }) {
  const id = `overview-${kind}`;
  return (
    <svg viewBox="0 0 240 190" className={`overview-art overview-art-${kind}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#b59aff" /><stop offset="0.45" stopColor="#8751ef" /><stop offset="1" stopColor="#4e1bb8" />
        </linearGradient>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffffff" /><stop offset="1" stopColor="#d5c5ff" />
        </linearGradient>
        <linearGradient id={`${id}-dark`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#7745de" /><stop offset="1" stopColor="#361180" />
        </linearGradient>
        <radialGradient id={`${id}-shine`}>
          <stop stopColor="#c2a6ff" /><stop offset="1" stopColor="#7540e0" />
        </radialGradient>
        <filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#6f43bc" floodOpacity="0.25" />
        </filter>
      </defs>
      {kind === 'finance' ? (
        <>
          <path d="M12 165C-4 126 13 102 47 103c26 0 27 18 52 3s44-7 58 14 43-2 71 22v41H12Z" fill="#ded1ff" />
          <ellipse cx="133" cy="169" rx="85" ry="10" fill="#a482e4" opacity="0.2" />
          <g filter={`url(#${id}-shadow)`} transform="translate(96 30) rotate(12)">
            <path d="M0 3Q0-3 7-3h58q7 0 7 7v96H0Z" fill={`url(#${id}-body)`} />
            <path d="M8 4h59v89H8Z" fill={`url(#${id}-paper)`} />
            <path d="M16 18h21m-21 12h41m-41 12h30m-30 12h41" stroke="#c0a7f4" strokeWidth="5" strokeLinecap="round" />
            <path d="M12 72h27l7-10 8 5 8-15" fill="none" stroke="#8d60de" strokeWidth="3" />
          </g>
          <path d="M59 136l14-35q2-5 9-5h47l-17 41Z" fill={`url(#${id}-body)`} />
          <path d="M59 136h63l9 12H68q-11 0-9-12Z" fill="#5525aa" />
          <g filter={`url(#${id}-shadow)`} transform="translate(143 80) rotate(12)">
            <rect width="60" height="83" rx="9" fill={`url(#${id}-dark)`} />
            <rect x="7" y="8" width="46" height="20" rx="3" fill="#cdb7ff" />
            <path d="M34 16h12" stroke="#7750bf" strokeWidth="3" />
            {[0, 1, 2, 3].map(row => [0, 1, 2].map(col => (
              <rect key={`${row}-${col}`} x={9 + col * 15} y={36 + row * 10} width="10" height="6" rx="2" fill={col === 2 ? '#ac89f1' : '#dfceff'} />
            )))}
          </g>
        </>
      ) : (
        <>
          <ellipse cx="133" cy="173" rx="65" ry="10" fill="#ae8bdf" opacity="0.19" />
          <g filter={`url(#${id}-shadow)`} transform="rotate(20 130 100)">
            <path d="M142 102h17l-2 58q-1 8-8 8h-8l-8-48Z" fill={`url(#${id}-dark)`} />
            <path d="M147 107h11l-2 50q-1 5-6 5h-5Z" fill="#9866ed" />
            <rect x="152" y="67" width="38" height="48" rx="19" fill={`url(#${id}-dark)`} />
            <path d="M91 52l78 19v39l-78 27Z" fill={`url(#${id}-body)`} />
            <path d="M99 57l69 17v9L99 67Z" fill="#c5a5ff" opacity="0.75" />
            <ellipse cx="91" cy="94" rx="25" ry="46" fill="#a979ff" />
            <ellipse cx="91" cy="94" rx="20" ry="40" fill={`url(#${id}-dark)`} />
            <ellipse cx="91" cy="94" rx="15" ry="33" fill={`url(#${id}-shine)`} />
            <path d="M88 62c-11 9-16 39-9 59" fill="none" stroke="#d4b8ff" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="101" cy="93" rx="7" ry="13" fill="#b28af7" />
          </g>
          <g transform="translate(184 25) rotate(18)" filter={`url(#${id}-shadow)`}>
            <rect width="30" height="30" rx="7" fill={`url(#${id}-dark)`} />
            <path d="M8 10h14v9H15l-4 4v-4H8Z" fill="#eee5ff" />
          </g>
          <g transform="translate(193 142) rotate(20)" filter={`url(#${id}-shadow)`}>
            <rect width="28" height="28" rx="7" fill={`url(#${id}-body)`} />
            <path d="M7 12h5l3-5 3 1-1 5h4l-2 8H9Z" fill="#eee5ff" />
          </g>
          <circle cx="57" cy="143" r="10" fill="#ab82f2" /><circle cx="57" cy="143" r="4" fill="#ece1ff" />
          <path d="M212 83l8-5m-5 18h8" stroke="#a479ed" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function DashboardPage() {
  const { data, loaded, collectionRate } = useFinanceSummary();
  const templateLabel = useTemplateCount();

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

  const mTools = marketingTools(templateLabel);
  const suites = [
    {
      title: 'Finance Suite',
      description: 'GST billing, quotations, expenses, challans and Tally sync for Indian businesses.',
      kind: 'finance' as const,
      icon: Calculator,
      tools: FINANCE_TOOLS,
      shortcuts: [...FINANCE_TOOLS.slice(0, 4), mTools[2]],
      href: '/dashboard/finance',
    },
    {
      title: 'Marketing Suite',
      description: 'Social captions, SEO audits, blogs and branded invitations to grow your reach.',
      kind: 'marketing' as const,
      icon: Megaphone,
      tools: mTools,
      shortcuts: [mTools[0], mTools[1], mTools[3]],
      href: '/dashboard/marketing',
    },
  ];

  return (
    <div className="ainos-overview">
      <div className="overview-container">
        <h1 className="sr-only">AINOS Business Dashboard</h1>

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

        {/* Suites */}
        <motion.section {...fadeUp(0.1)} className="overview-suites" aria-label="Your business suites">
          {suites.map(suite => (
            <section key={suite.title} className={`overview-card overview-suite overview-suite-${suite.kind}`}>
              <div className="overview-suite-header">
                <IconCircle icon={suite.icon} size="lg" />
                <div className="overview-suite-heading">
                  <h2>{suite.title}</h2>
                  <p>{suite.description}</p>
                </div>
                <span className="overview-tool-count">{suite.tools.length} tools</span>
              </div>
              <div className="overview-shortcuts">
                {suite.shortcuts.map((t, i) => (
                  <Link key={t.title} href={t.href} className="overview-shortcut">
                    <IconCircle icon={t.icon} tone={TOOL_TONES[i % TOOL_TONES.length]} size="sm" />
                    <span className="min-w-0">
                      <span className="overview-shortcut-title">{t.title}</span>
                      <span className="overview-shortcut-detail">{t.short}</span>
                    </span>
                  </Link>
                ))}
              </div>
              <div className="overview-suite-footer">
                <SuiteIllustration kind={suite.kind} />
                <Link href={suite.href} className="overview-explore">
                  Explore All Tools <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          ))}
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
