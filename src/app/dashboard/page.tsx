'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ScrollText, Contact2, Boxes, Coins, FileBarChart, PackageCheck, Sheet, BellRing, Paintbrush,
  AtSign, SearchCheck, PenTool, Bot, MailOpen,
  IndianRupee, BadgeCheck, Hourglass, UsersRound,
  FilePlus2, NotebookPen, Receipt, CalendarClock,
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

const ACCENT = 'text-[#5b21b6]';
const CARD = 'rounded-2xl bg-white border border-neutral-200';

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
  paid: 'bg-purple-50 text-[#5b21b6]',
  overdue: 'bg-red-50 text-red-600',
  cancelled: 'bg-neutral-100 text-neutral-400 line-through',
};

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-neutral-500 font-light mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function ToolRow({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <Link
      href={tool.href}
      className="group flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 hover:border-purple-200 hover:bg-purple-50/40 transition-colors"
    >
      <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
        <Icon className={`w-5 h-5 ${ACCENT}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-neutral-900">{tool.title}</p>
        <p className="text-sm text-neutral-500 font-light leading-relaxed mt-1 line-clamp-2">{tool.description}</p>
      </div>
      <ChevronRight className="w-4 h-4 mt-1 text-neutral-300 group-hover:text-[#5b21b6] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
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
  const [tab, setTab] = useState<'finance' | 'marketing'>('finance');
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

  const tools = tab === 'finance' ? financeTools : marketingTools;

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
    <div className="min-h-full bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">

        {/* Welcome */}
        <motion.section {...fadeUp()} className={`${CARD} relative overflow-hidden`}>
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(#e9e4f5_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_left,black,transparent)]"
          />
          <div className="relative p-5 sm:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="min-w-0">
              <p className="text-sm text-neutral-500 font-light">{today}</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight mt-1">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 font-light mt-2 max-w-md leading-relaxed">
                {data.overdueCount > 0
                  ? `You have ${data.overdueCount} overdue invoice${data.overdueCount === 1 ? '' : 's'} to follow up on.`
                  : 'Here’s a quick look at your business today.'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-3 flex-shrink-0">
              <Link
                href="/invoices"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-full bg-[#5b21b6] hover:bg-[#4c1d95] active:scale-[0.98] text-white text-sm font-medium transition-all"
              >
                <FilePlus2 className="w-4 h-4" />
                New invoice
              </Link>
              <Link
                href="/marketing/blog"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-full bg-white border border-neutral-200 hover:border-purple-200 hover:bg-purple-50 text-neutral-800 text-sm font-medium transition-colors"
              >
                <NotebookPen className={`w-4 h-4 ${ACCENT}`} />
                Write a blog
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} {...fadeUp(0.05 + i * 0.04)} className={`${CARD} p-4 sm:p-5`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-neutral-500 font-light truncate">{stat.label}</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-4 h-4 ${ACCENT}`} />
                  </div>
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
            );
          })}
        </section>

        {/* Recent invoices + side column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <motion.section {...fadeUp(0.15)} className="lg:col-span-2 min-w-0">
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
            <div className={`${CARD} overflow-hidden`}>
              {!loaded ? (
                <div className="divide-y divide-neutral-100">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 sm:px-5">
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
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto">
                    <Receipt className={`w-6 h-6 ${ACCENT}`} />
                  </div>
                  <p className="text-[15px] font-medium text-neutral-900 mt-4">No invoices yet</p>
                  <p className="text-sm text-neutral-500 font-light mt-1">Your invoices will show up here once you create one.</p>
                  <Link
                    href="/invoices"
                    className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-[#5b21b6] hover:bg-[#4c1d95] text-white text-sm font-medium transition-colors"
                  >
                    Create invoice <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {data.recent.map(inv => (
                    <li key={inv.id}>
                      <Link href="/invoices" className="flex items-center gap-3 sm:gap-4 p-4 sm:px-5 hover:bg-neutral-50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-neutral-600">
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
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_STYLE[inv.status] || 'bg-neutral-100 text-neutral-600'}`}>
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

          <motion.aside {...fadeUp(0.2)} className="space-y-6 sm:space-y-8 min-w-0">
            {/* Collections */}
            <section>
              <SectionTitle title="Collections" subtitle="Paid vs billed" />
              <div className={`${CARD} p-5`}>
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
                <dl className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-neutral-100">
                  <div className="min-w-0">
                    <dt className="text-xs text-neutral-500 font-light">Received</dt>
                    <dd className="text-sm font-medium text-neutral-900 tabular-nums truncate mt-0.5">{formatINR(data.collected)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-neutral-500 font-light">Pending</dt>
                    <dd className="text-sm font-medium text-neutral-900 tabular-nums truncate mt-0.5">{formatINR(data.outstanding)}</dd>
                  </div>
                </dl>
                {data.overdueCount > 0 && (
                  <Link
                    href="/finance/reminders"
                    className="mt-5 flex items-center gap-3 p-3 rounded-xl bg-red-50/60 hover:bg-red-50 transition-colors"
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
                <div className={`${CARD} p-3`}>
                  {setupSteps.map((step) => (
                    <Link
                      key={step.label}
                      href={step.href}
                      className="group flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-neutral-50 transition-colors"
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
        <motion.section {...fadeUp(0.25)}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">Your tools</h2>
              <p className="text-sm text-neutral-500 font-light mt-0.5">
                {tab === 'finance' ? 'Billing, GST and everyday accounts' : 'Content, SEO and social in one place'}
              </p>
            </div>
            <div role="tablist" className="inline-flex self-start sm:self-auto p-1 rounded-full bg-neutral-100">
              {(['finance', 'marketing'] as const).map(key => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                    tab === key ? 'bg-white text-[#5b21b6] shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {key}
                  <span className={`ml-1.5 text-xs ${tab === key ? 'text-purple-300' : 'text-neutral-400'}`}>
                    {key === 'finance' ? financeTools.length : marketingTools.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {tools.map((tool) => <ToolRow key={tool.href} tool={tool} />)}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
