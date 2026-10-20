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

// ── Surface tokens: flat white widgets on a light grey canvas, no borders ──
const CARD = 'bg-white rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)]';
const HOVER = 'transition-shadow duration-200 hover:shadow-[0_6px_16px_-4px_rgba(16,24,40,0.10)]';
const ACCENT = 'text-[#5b21b6]';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: 'easeOut' as const },
});

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Short Indian format for stat cards: ₹12.5L, ₹1.2Cr
const formatCompact = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1).replace(/\.0$/, '')}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, '')}L`;
  return formatINR(n);
};

const STATUS_STYLE: Record<string, string> = {
  paid: 'bg-purple-50 text-[#5b21b6]',
  overdue: 'bg-red-50 text-red-600',
  cancelled: 'bg-neutral-100 text-neutral-400 line-through',
};

function IconBox({ icon: Icon, size = 'md' }: { icon: React.ElementType; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'sm' ? 'w-9 h-9 rounded-lg' : size === 'lg' ? 'w-12 h-12 rounded-xl' : 'w-10 h-10 rounded-xl';
  const glyph = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className={`${box} bg-purple-50 flex items-center justify-center flex-shrink-0`}>
      <Icon className={`${glyph} ${ACCENT}`} />
    </div>
  );
}

// Widget header lives inside the card, Zoho-style
function WidgetHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-neutral-900">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-500 font-light mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function ToolItem({ tool }: { tool: Tool }) {
  return (
    <Link href={tool.href} className="group flex items-start gap-3.5 p-4 rounded-xl hover:bg-[#f7f5fb] transition-colors">
      <IconBox icon={tool.icon} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 group-hover:text-[#5b21b6] transition-colors">{tool.title}</p>
        <p className="text-[13px] text-neutral-500 font-light leading-relaxed mt-0.5 line-clamp-2">{tool.description}</p>
      </div>
      <ChevronRight className="w-4 h-4 mt-0.5 text-neutral-300 group-hover:text-[#5b21b6] transition-colors flex-shrink-0" />
    </Link>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`rounded-md bg-neutral-100 animate-pulse ${className}`} />;
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
    <div className="min-h-full bg-[#f5f6f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">

        {/* Page header */}
        <motion.header {...fadeUp()} className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 pb-1">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5b21b6]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#5b21b6]">AINOS Business Suite</span>
            </span>
            <h1 className="text-2xl sm:text-[28px] font-semibold text-neutral-900 tracking-tight mt-3">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-sm text-neutral-500 font-light mt-1.5 max-w-xl leading-relaxed">
              {data.overdueCount > 0
                ? `You have ${data.overdueCount} overdue invoice${data.overdueCount === 1 ? '' : 's'} to follow up on.`
                : 'Billing, accounts and marketing for your business — all in one workspace.'}
              <span className="text-neutral-400"> · {today}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-3 flex-shrink-0">
            <Link
              href="/marketing/blog"
              className={`inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-white text-neutral-700 hover:text-[#5b21b6] text-sm font-medium ${CARD} ${HOVER}`}
            >
              <NotebookPen className={`w-4 h-4 ${ACCENT}`} />
              Write a blog
            </Link>
            <Link
              href="/invoices"
              className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-sm font-medium shadow-sm transition-colors"
            >
              <FilePlus2 className="w-4 h-4" />
              New invoice
            </Link>
          </div>
        </motion.header>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} {...fadeUp(0.04 + i * 0.03)} className={`${CARD} p-4 sm:p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 truncate">{stat.label}</p>
                  {loaded ? (
                    <p title={stat.full} className="mt-2 text-xl sm:text-2xl font-semibold text-neutral-900 tabular-nums tracking-tight truncate">
                      {stat.value}
                    </p>
                  ) : (
                    <Skeleton className="mt-2 h-7 w-20" />
                  )}
                </div>
                <div className="hidden sm:block"><IconBox icon={stat.icon} size="sm" /></div>
              </div>
              <p className="text-xs text-neutral-400 font-light mt-2 truncate">{stat.hint}</p>
            </motion.div>
          ))}
        </section>

        {/* Workspace */}
        <motion.section {...fadeUp(0.1)} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {suites.map(suite => (
            <button
              key={suite.key}
              onClick={() => openSuite(suite.key)}
              className={`group text-left ${CARD} ${HOVER} p-5 sm:p-6 flex flex-col`}
            >
              <div className="flex items-start gap-4">
                <IconBox icon={suite.icon} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-neutral-900">{suite.title}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-xs font-medium text-neutral-600 flex-shrink-0">
                      {suite.tools.length} tools
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 font-light leading-relaxed mt-1">{suite.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 sm:pl-16">
                {suite.tools.slice(0, 4).map(t => (
                  <span key={t.href} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f7f5fb] text-xs text-neutral-600">
                    <t.icon className={`w-3.5 h-3.5 ${ACCENT}`} />
                    {t.title}
                  </span>
                ))}
                {suite.tools.length > 4 && (
                  <span className="inline-flex items-center px-1.5 py-1 text-xs text-neutral-400">+{suite.tools.length - 4} more</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 mt-auto pt-5 sm:pl-16">
                <span className="text-xs text-neutral-400 font-light truncate">{loaded ? suite.meta : '—'}</span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-[#5b21b6] flex-shrink-0">
                  Open suite <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
          ))}
        </motion.section>

        {/* Recent invoices + side widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
          <motion.section {...fadeUp(0.14)} className={`${CARD} lg:col-span-2 min-w-0`}>
            <WidgetHeader
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
            <div className="px-2 sm:px-3 pb-3">
              {!loaded ? (
                <div className="space-y-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <Skeleton className="w-9 h-9 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : data.recent.length === 0 ? (
                <div className="px-6 pt-6 pb-10 text-center">
                  <div className="flex justify-center"><IconBox icon={Receipt} size="lg" /></div>
                  <p className="text-sm font-medium text-neutral-900 mt-4">No invoices yet</p>
                  <p className="text-sm text-neutral-500 font-light mt-1">Your invoices will show up here once you create one.</p>
                  <Link
                    href="/invoices"
                    className="inline-flex items-center gap-2 mt-5 px-4 h-10 rounded-lg bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-sm font-medium transition-colors"
                  >
                    Create invoice <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <>
                  {/* Column labels (tablet and up) */}
                  <div className="hidden sm:flex items-center gap-4 px-3 py-2 rounded-lg bg-[#f7f8fa] text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                    <span className="flex-1">Customer</span>
                    <span className="w-32">Invoice</span>
                    <span className="w-28 text-right">Amount</span>
                    <span className="w-24 text-right">Status</span>
                  </div>
                  <ul className="mt-1">
                    {data.recent.map(inv => (
                      <li key={inv.id}>
                        <Link href="/invoices" className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg hover:bg-[#f7f5fb] transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 text-sm font-medium text-[#5b21b6]">
                              {inv.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">{inv.customerName}</p>
                              <p className="sm:hidden text-xs text-neutral-500 font-light truncate mt-0.5">
                                {inv.invoiceNumber}{formatDate(inv.date) && ` · ${formatDate(inv.date)}`}
                              </p>
                            </div>
                          </div>
                          <div className="hidden sm:block w-32 min-w-0">
                            <p className="text-sm text-neutral-700 truncate">{inv.invoiceNumber}</p>
                            <p className="text-xs text-neutral-400 font-light">{formatDate(inv.date)}</p>
                          </div>
                          <div className="text-right sm:w-28 flex-shrink-0">
                            <p className="text-sm font-medium text-neutral-900 tabular-nums">{formatINR(inv.amount)}</p>
                            <span className={`sm:hidden inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-medium capitalize ${STATUS_STYLE[inv.status] || 'bg-neutral-100 text-neutral-600'}`}>
                              {inv.status}
                            </span>
                          </div>
                          <div className="hidden sm:flex w-24 justify-end">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize ${STATUS_STYLE[inv.status] || 'bg-neutral-100 text-neutral-600'}`}>
                              {inv.status}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </motion.section>

          <motion.aside {...fadeUp(0.18)} className="space-y-4 sm:space-y-5 min-w-0">
            {/* Collections */}
            <section className={CARD}>
              <WidgetHeader title="Collections" subtitle="Paid vs billed" />
              <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                <div className="flex items-baseline justify-between gap-3">
                  {loaded ? (
                    <p className="text-3xl font-semibold text-neutral-900 tabular-nums tracking-tight">{collectionRate}%</p>
                  ) : (
                    <Skeleton className="h-9 w-16" />
                  )}
                  <span className="text-sm text-neutral-500 font-light">collected</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden mt-4">
                  <motion.div
                    className="h-full rounded-full bg-[#5b21b6]"
                    initial={{ width: 0 }}
                    animate={{ width: `${collectionRate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <dl className="grid grid-cols-2 gap-3 mt-5">
                  <div className="min-w-0 p-3 rounded-xl bg-[#f7f8fa]">
                    <dt className="text-xs text-neutral-500 font-light">Received</dt>
                    <dd className="text-sm font-medium text-neutral-900 tabular-nums truncate mt-0.5">{formatINR(data.collected)}</dd>
                  </div>
                  <div className="min-w-0 p-3 rounded-xl bg-[#f7f8fa]">
                    <dt className="text-xs text-neutral-500 font-light">Pending</dt>
                    <dd className="text-sm font-medium text-neutral-900 tabular-nums truncate mt-0.5">{formatINR(data.outstanding)}</dd>
                  </div>
                </dl>
                {data.overdueCount > 0 && (
                  <Link
                    href="/finance/reminders"
                    className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-red-50/70 hover:bg-red-50 transition-colors"
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
              <section className={CARD}>
                <WidgetHeader title="Getting started" subtitle={`${doneCount} of ${setupSteps.length} steps complete`} />
                <div className="px-2 sm:px-3 pb-3">
                  {setupSteps.map((step) => (
                    <Link
                      key={step.label}
                      href={step.href}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f7f5fb] transition-colors"
                    >
                      {step.done ? (
                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${ACCENT}`} />
                      ) : (
                        <Circle className="w-5 h-5 flex-shrink-0 text-neutral-300 group-hover:text-purple-300 transition-colors" />
                      )}
                      <span className={`flex-1 text-sm ${step.done ? 'text-neutral-400 line-through font-light' : 'text-neutral-700'}`}>
                        {step.label}
                      </span>
                      {!step.done && <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[#5b21b6] transition-colors" />}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </motion.aside>
        </div>

        {/* Tools */}
        <motion.section id="tools" {...fadeUp(0.22)} className={`${CARD} scroll-mt-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 sm:px-6 pt-5 pb-3">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-neutral-900">
                {tab === 'finance' ? 'Finance tools' : 'Marketing tools'}
              </h2>
              <p className="text-xs text-neutral-500 font-light mt-0.5">
                {tab === 'finance' ? 'Billing, GST and everyday accounts' : 'Content, SEO and social in one place'}
              </p>
            </div>
            <div role="tablist" className="inline-flex self-start sm:self-auto p-1 rounded-lg bg-neutral-100">
              {suites.map(suite => (
                <button
                  key={suite.key}
                  role="tab"
                  aria-selected={tab === suite.key}
                  onClick={() => setTab(suite.key)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    tab === suite.key
                      ? 'bg-white text-[#5b21b6] shadow-[0_1px_2px_rgba(16,24,40,0.08)]'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 px-2 sm:px-3 pb-3">
            {tools.map((tool) => <ToolItem key={tool.href} tool={tool} />)}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
