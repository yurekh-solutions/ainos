'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ScrollText, Contact2, Boxes, Coins, FileBarChart, PackageCheck, Sheet, BellRing, Paintbrush,
  AtSign, SearchCheck, PenTool, Bot, MailOpen,
  IndianRupee, BadgeCheck, Hourglass, UsersRound,
  FilePlus2, NotebookPen, Receipt, CalendarClock, Calculator, Megaphone,
  CheckCircle2, Circle, ChevronRight, ArrowRight,
} from 'lucide-react';

interface Tool {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
}

type Suite = 'finance' | 'marketing';

// ── Neumorphic surface tokens (soft lavender base, single purple accent) ──
const BASE = 'bg-[#f3f1f7]';
const RAISED = `${BASE} rounded-3xl border border-white/70 shadow-[10px_10px_22px_#dcd7e6,-10px_-10px_22px_#ffffff]`;
const RAISED_SM = `${BASE} rounded-2xl border border-white/70 shadow-[6px_6px_14px_#dcd7e6,-6px_-6px_14px_#ffffff]`;
const INSET = `${BASE} shadow-[inset_3px_3px_7px_#dcd7e6,inset_-3px_-3px_7px_#ffffff]`;
const PRESS = 'transition-shadow duration-200 hover:shadow-[3px_3px_8px_#dcd7e6,-3px_-3px_8px_#ffffff] active:shadow-[inset_3px_3px_7px_#dcd7e6,inset_-3px_-3px_7px_#ffffff]';
const ACCENT = 'text-[#5b21b6]';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: 'easeOut' as const },
});

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Short Indian format for stat cards: ₹12.5L, ₹1.2Cr
const formatCompact = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1).replace(/\.0$/, '')}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, '')}L`;
  return formatINR(n);
};

const STATUS_STYLE: Record<string, string> = {
  paid: 'bg-purple-100/70 text-[#5b21b6]',
  overdue: 'bg-red-50 text-red-600',
  cancelled: 'bg-neutral-200/60 text-neutral-400 line-through',
};

function IconWell({ icon: Icon, size = 'md' }: { icon: React.ElementType; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'sm' ? 'w-9 h-9 rounded-xl' : size === 'lg' ? 'w-14 h-14 rounded-2xl' : 'w-11 h-11 rounded-xl';
  const glyph = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <div className={`${box} ${INSET} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`${glyph} ${ACCENT}`} />
    </div>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-neutral-500 font-light mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function ToolRow({ tool }: { tool: Tool }) {
  return (
    <Link href={tool.href} className={`group flex items-start gap-4 p-4 sm:p-5 ${RAISED_SM} ${PRESS}`}>
      <IconWell icon={tool.icon} />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-neutral-900">{tool.title}</p>
        <p className="text-sm text-neutral-500 font-light leading-relaxed mt-1 line-clamp-2">{tool.description}</p>
      </div>
      <ChevronRight className="w-4 h-4 mt-1 text-neutral-400 group-hover:text-[#5b21b6] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`rounded-md bg-[#e6e2ee] animate-pulse ${className}`} />;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [templateCount, setTemplateCount] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Suite>('finance');
  const [data, setData] = useState({
    billed: 0, collected: 0, outstanding: 0, overdueCount: 0,
    invoiceCount: 0, customers: 0, products: 0,
    recent: [] as InvoiceRow[],
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/invitations/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((d: { count?: number } | null) => {
        if (!cancelled && d?.count) setTemplateCount(d.count);
      })
      .catch(() => {});

    Promise.all([
      fetch('/api/invoices').then(r => r.ok ? r.json() : []),
      fetch('/api/products').then(r => r.ok ? r.json() : []),
      fetch('/api/customers').then(r => r.ok ? r.json() : []),
    ]).then(([invoices, products, customers]) => {
      if (cancelled) return;
      const invList = (Array.isArray(invoices) ? invoices : []) as Record<string, unknown>[];
      const amount = (inv: Record<string, unknown>) =>
        Number(inv.totalAmount ?? inv.total ?? inv.grandTotal ?? 0) || 0;
      const active = invList.filter(inv => inv.status !== 'cancelled');
      const billed = active.reduce((s, inv) => s + amount(inv), 0);
      const collected = active.filter(inv => inv.status === 'paid').reduce((s, inv) => s + amount(inv), 0);
      const overdueCount = active.filter(inv => inv.status === 'overdue').length;

      setData({
        billed,
        collected,
        outstanding: billed - collected,
        overdueCount,
        invoiceCount: invList.length,
        customers: Array.isArray(customers) ? customers.length : 0,
        products: Array.isArray(products) ? products.length : 0,
        recent: invList.slice(0, 5).map(inv => ({
          id: String(inv.id),
          invoiceNumber: String(inv.invoiceNumber ?? ''),
          customerName: String(inv.customerName || 'Walk-in customer'),
          amount: amount(inv),
          status: String(inv.status || 'draft'),
          date: String(inv.invoiceDate || inv.createdAt || ''),
        })),
      });
    }).catch(() => {}).finally(() => { if (!cancelled) setLoaded(true); });

    return () => { cancelled = true; };
  }, []);

  const templateLabel = templateCount ? `${templateCount}` : '500+';
  const collectionRate = data.billed > 0 ? Math.round((data.collected / data.billed) * 100) : 0;

  const stats = [
    { label: 'Total billed', value: formatCompact(data.billed), full: formatINR(data.billed), hint: `${data.invoiceCount} invoice${data.invoiceCount === 1 ? '' : 's'}`, icon: IndianRupee },
    { label: 'Collected', value: formatCompact(data.collected), full: formatINR(data.collected), hint: `${collectionRate}% of billed`, icon: BadgeCheck },
    { label: 'Outstanding', value: formatCompact(data.outstanding), full: formatINR(data.outstanding), hint: data.overdueCount ? `${data.overdueCount} overdue` : 'Nothing overdue', icon: Hourglass },
    { label: 'Customers', value: data.customers.toString(), full: data.customers.toString(), hint: `${data.products} product${data.products === 1 ? '' : 's'} in catalog`, icon: UsersRound },
  ];

  const setupSteps = [
    { label: 'Create your first invoice', href: '/invoices', done: data.invoiceCount > 0 },
    { label: 'Add a customer profile', href: '/customers', done: data.customers > 0 },
    { label: 'Add a product to your catalog', href: '/products', done: data.products > 0 },
  ];
  const doneCount = setupSteps.filter(s => s.done).length;
  const setupComplete = doneCount === setupSteps.length;

  const financeTools: Tool[] = [
    { title: 'Invoices', description: 'GST invoices with CGST/SGST/IGST split, HSN codes and profit tracking.', icon: ScrollText, href: '/invoices' },
    { title: 'Customers', description: 'Customer records with GSTIN, PAN and state-wise billing addresses.', icon: Contact2, href: '/customers' },
    { title: 'Products', description: 'Catalog with HSN codes, GST rates, cost price, MRP and barcodes.', icon: Boxes, href: '/products' },
    { title: 'Expenses', description: 'Track spending across software, salaries, marketing and more.', icon: Coins, href: '/finance/expenses' },
    { title: 'Quotations', description: 'Send professional quotes and convert them to invoices.', icon: FileBarChart, href: '/finance/quotes' },
    { title: 'Delivery Challans', description: 'Challans for goods transport with sequential numbering.', icon: PackageCheck, href: '/finance/challans' },
    { title: 'Tally / Excel', description: 'Import and export data in Tally-compatible Excel format.', icon: Sheet, href: '/finance/tally' },
    { title: 'Payment Reminders', description: 'Follow up on overdue invoices with WhatsApp reminders.', icon: BellRing, href: '/finance/reminders' },
    { title: 'Template Designer', description: 'Customise invoice layouts, colours and fonts for your brand.', icon: Paintbrush, href: '/finance/templates' },
  ];

  const marketingTools: Tool[] = [
    { title: 'Social Media', description: 'Captions, hooks and hashtags for every platform.', icon: AtSign, href: '/marketing/email' },
    { title: 'SEO Platform', description: 'Site audits, keyword research and competitor insights.', icon: SearchCheck, href: '/marketing/seo' },
    { title: 'Blog & Content', description: 'SEO-optimised articles with one-click publishing.', icon: PenTool, href: '/marketing/blog' },
    { title: 'Blog Agent', description: 'Researches, writes and publishes blogs on a schedule.', icon: Bot, href: '/marketing/blog-agent' },
    { title: 'Invitations', description: `${templateLabel} festival and occasion templates with your branding.`, icon: MailOpen, href: '/marketing/invitations' },
  ];

  const suites: { key: Suite; title: string; description: string; icon: React.ElementType; tools: Tool[]; meta: string }[] = [
    {
      key: 'finance',
      title: 'Finance Suite',
      description: 'GST billing, quotations, expenses, challans and Tally sync for Indian businesses.',
      icon: Calculator,
      tools: financeTools,
      meta: `${data.invoiceCount} invoices · ${data.products} products`,
    },
    {
      key: 'marketing',
      title: 'Marketing Suite',
      description: 'Social captions, SEO audits, blogs and branded invitations to grow your reach.',
      icon: Megaphone,
      tools: marketingTools,
      meta: `${templateLabel} invitation templates`,
    },
  ];

  const tools = tab === 'finance' ? financeTools : marketingTools;

  const openSuite = (key: Suite) => {
    setTab(key);
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  const formatDate = (d: string) => {
    const date = new Date(d);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`min-h-full ${BASE}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-8 sm:space-y-10">

        {/* Welcome */}
        <motion.section {...fadeUp()} className={`${RAISED} p-5 sm:p-8`}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="min-w-0">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${INSET}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#5b21b6]" />
                <span className="text-xs font-medium tracking-wide text-[#5b21b6]">AINOS Business Suite</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight mt-4">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 font-light mt-2 max-w-lg leading-relaxed">
                {data.overdueCount > 0
                  ? `You have ${data.overdueCount} overdue invoice${data.overdueCount === 1 ? '' : 's'} to follow up on.`
                  : 'Billing, accounts and marketing for your business — all in one workspace.'}
              </p>
              <p className="text-xs text-neutral-400 font-light mt-3">{today}</p>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-4 flex-shrink-0">
              <Link
                href="/invoices"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-sm font-medium shadow-[5px_5px_12px_#cfc7df,-5px_-5px_12px_#ffffff] active:scale-[0.98] transition-all"
              >
                <FilePlus2 className="w-4 h-4" />
                New invoice
              </Link>
              <Link
                href="/marketing/blog"
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full ${BASE} border border-white/70 shadow-[5px_5px_12px_#dcd7e6,-5px_-5px_12px_#ffffff] ${PRESS} text-neutral-800 text-sm font-medium`}
              >
                <NotebookPen className={`w-4 h-4 ${ACCENT}`} />
                Write a blog
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} {...fadeUp(0.05 + i * 0.04)} className={`${RAISED_SM} p-4 sm:p-5`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-neutral-500 font-light truncate">{stat.label}</span>
                <IconWell icon={stat.icon} size="sm" />
              </div>
              {loaded ? (
                <p title={stat.full} className="mt-3 text-xl sm:text-2xl font-semibold text-neutral-900 tabular-nums tracking-tight truncate">
                  {stat.value}
                </p>
              ) : (
                <Skeleton className="mt-3 h-7 w-20" />
              )}
              <p className="text-xs text-neutral-400 font-light mt-1 truncate">{stat.hint}</p>
            </motion.div>
          ))}
        </section>

        {/* Workspace — what AINOS gives you */}
        <motion.section {...fadeUp(0.12)}>
          <SectionTitle title="Your workspace" subtitle="Two suites, one login — pick where you want to work" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {suites.map(suite => (
              <button
                key={suite.key}
                onClick={() => openSuite(suite.key)}
                className={`group text-left p-5 sm:p-6 ${RAISED} ${PRESS}`}
              >
                <div className="flex items-start gap-4">
                  <IconWell icon={suite.icon} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">{suite.title}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-neutral-600 ${INSET}`}>
                        {suite.tools.length} tools
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 font-light leading-relaxed mt-1.5">{suite.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-5">
                  {suite.tools.slice(0, 4).map(t => (
                    <span key={t.href} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-neutral-600 ${INSET}`}>
                      <t.icon className={`w-3.5 h-3.5 ${ACCENT}`} />
                      {t.title}
                    </span>
                  ))}
                  {suite.tools.length > 4 && (
                    <span className="inline-flex items-center px-2 py-1.5 text-xs text-neutral-400">+{suite.tools.length - 4} more</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-[#e4e0ec]">
                  <span className="text-xs text-neutral-400 font-light truncate">{loaded ? suite.meta : '—'}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#5b21b6] flex-shrink-0">
                    Open suite <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Recent invoices + side column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.section {...fadeUp(0.18)} className="lg:col-span-2 min-w-0">
            <SectionTitle
              title="Recent invoices"
              subtitle="Your latest five bills"
              action={
                data.recent.length > 0 && (
                  <Link href="/invoices" className="inline-flex items-center gap-1 text-sm font-medium text-[#5b21b6] hover:text-[#4c1d95] flex-shrink-0">
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                )
              }
            />
            <div className={`${RAISED} p-2 sm:p-3`}>
              {!loaded ? (
                <div className="space-y-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="flex items-center gap-4 p-3 sm:px-4">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : data.recent.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="flex justify-center"><IconWell icon={Receipt} size="lg" /></div>
                  <p className="text-[15px] font-medium text-neutral-900 mt-5">No invoices yet</p>
                  <p className="text-sm text-neutral-500 font-light mt-1">Your invoices will show up here once you create one.</p>
                  <Link
                    href="/invoices"
                    className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-sm font-medium shadow-[5px_5px_12px_#cfc7df,-5px_-5px_12px_#ffffff] transition-colors"
                  >
                    Create invoice <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <ul className="space-y-1">
                  {data.recent.map(inv => (
                    <li key={inv.id}>
                      <Link href="/invoices" className="flex items-center gap-3 sm:gap-4 p-3 sm:px-4 rounded-2xl hover:bg-white/60 transition-colors">
                        <div className={`w-10 h-10 rounded-xl ${INSET} flex items-center justify-center flex-shrink-0 text-sm font-medium text-[#5b21b6]`}>
                          {inv.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{inv.customerName}</p>
                          <p className="text-xs text-neutral-500 font-light truncate mt-0.5">
                            {inv.invoiceNumber}{formatDate(inv.date) && ` · ${formatDate(inv.date)}`}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-neutral-900 tabular-nums">{formatINR(inv.amount)}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_STYLE[inv.status] || 'bg-neutral-200/60 text-neutral-600'}`}>
                            {inv.status}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.section>

          <motion.aside {...fadeUp(0.22)} className="space-y-8 min-w-0">
            {/* Collections */}
            <section>
              <SectionTitle title="Collections" subtitle="Paid vs billed" />
              <div className={`${RAISED} p-5 sm:p-6`}>
                <div className="flex items-baseline justify-between gap-3">
                  {loaded ? (
                    <p className="text-3xl font-semibold text-neutral-900 tabular-nums tracking-tight">{collectionRate}%</p>
                  ) : (
                    <Skeleton className="h-9 w-16" />
                  )}
                  <span className="text-sm text-neutral-500 font-light">collected</span>
                </div>
                <div className={`h-3 rounded-full ${INSET} p-0.5 mt-4`}>
                  <motion.div
                    className="h-full rounded-full bg-[#5b21b6]"
                    initial={{ width: 0 }}
                    animate={{ width: `${collectionRate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <dl className="grid grid-cols-2 gap-3 mt-5">
                  <div className={`min-w-0 p-3 rounded-2xl ${INSET}`}>
                    <dt className="text-xs text-neutral-500 font-light">Received</dt>
                    <dd className="text-sm font-medium text-neutral-900 tabular-nums truncate mt-0.5">{formatINR(data.collected)}</dd>
                  </div>
                  <div className={`min-w-0 p-3 rounded-2xl ${INSET}`}>
                    <dt className="text-xs text-neutral-500 font-light">Pending</dt>
                    <dd className="text-sm font-medium text-neutral-900 tabular-nums truncate mt-0.5">{formatINR(data.outstanding)}</dd>
                  </div>
                </dl>
                {data.overdueCount > 0 && (
                  <Link
                    href="/finance/reminders"
                    className="mt-4 flex items-center gap-3 p-3 rounded-2xl bg-red-50/70 hover:bg-red-50 transition-colors"
                  >
                    <CalendarClock className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="flex-1 text-sm text-red-700">{data.overdueCount} overdue — send reminders</span>
                    <ChevronRight className="w-4 h-4 text-red-400" />
                  </Link>
                )}
              </div>
            </section>

            {/* Getting started (hidden once complete) */}
            {loaded && !setupComplete && (
              <section>
                <SectionTitle title="Getting started" subtitle={`${doneCount} of ${setupSteps.length} steps complete`} />
                <div className={`${RAISED} p-2 sm:p-3`}>
                  {setupSteps.map((step) => (
                    <Link
                      key={step.label}
                      href={step.href}
                      className="group flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/60 transition-colors"
                    >
                      {step.done ? (
                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${ACCENT}`} />
                      ) : (
                        <Circle className="w-5 h-5 flex-shrink-0 text-neutral-300 group-hover:text-purple-300 transition-colors" />
                      )}
                      <span className={`flex-1 text-sm ${step.done ? 'text-neutral-400 line-through font-light' : 'text-neutral-700'}`}>
                        {step.label}
                      </span>
                      {!step.done && <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#5b21b6] transition-colors" />}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </motion.aside>
        </div>

        {/* Tools */}
        <motion.section id="tools" {...fadeUp(0.26)} className="scroll-mt-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
                {tab === 'finance' ? 'Finance tools' : 'Marketing tools'}
              </h2>
              <p className="text-sm text-neutral-500 font-light mt-0.5">
                {tab === 'finance' ? 'Billing, GST and everyday accounts' : 'Content, SEO and social in one place'}
              </p>
            </div>
            <div role="tablist" className={`inline-flex self-start sm:self-auto p-1.5 rounded-full ${INSET}`}>
              {suites.map(suite => (
                <button
                  key={suite.key}
                  role="tab"
                  aria-selected={tab === suite.key}
                  onClick={() => setTab(suite.key)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    tab === suite.key
                      ? `${BASE} text-[#5b21b6] shadow-[3px_3px_7px_#dcd7e6,-3px_-3px_7px_#ffffff]`
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {suite.key === 'finance' ? 'Finance' : 'Marketing'}
                  <span className={`ml-1.5 text-xs ${tab === suite.key ? 'text-purple-300' : 'text-neutral-400'}`}>
                    {suite.tools.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {tools.map((tool) => <ToolRow key={tool.href} tool={tool} />)}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
