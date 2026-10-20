'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ScrollText, Contact2, Boxes, Coins, FileBarChart, PackageCheck, Sheet, BellRing, Paintbrush,
  AtSign, SearchCheck, PenTool, Bot, MailOpen,
  Receipt, CalendarClock, CheckCircle2, Circle, ChevronRight, ArrowRight, Plus,
} from 'lucide-react';

// ── Surfaces ──
export const CARD = 'bg-white rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_-2px_rgba(16,24,40,0.06)]';
export const HOVER = 'transition-shadow duration-200 hover:shadow-[0_10px_24px_-8px_rgba(16,24,40,0.14)]';
export const PAGE = 'min-h-full bg-[#f5f6f8] overflow-x-hidden';
export const CONTAINER = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5';

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay, ease: 'easeOut' as const },
});

// ── Soft tinted circles for icons ──
export type Tone = 'purple' | 'green' | 'orange' | 'blue' | 'red' | 'grey';
const TONES: Record<Tone, string> = {
  purple: 'bg-violet-50 text-[#6d28d9]',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-orange-50 text-orange-500',
  blue: 'bg-blue-50 text-blue-600',
  red: 'bg-rose-50 text-rose-500',
  grey: 'bg-neutral-100 text-neutral-500',
};

export function IconCircle({ icon: Icon, tone = 'purple', size = 'md' }: { icon: React.ElementType; tone?: Tone; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const glyph = size === 'lg' ? 'w-[22px] h-[22px]' : size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';
  return (
    <span className={`${box} ${TONES[tone]} rounded-full inline-flex items-center justify-center flex-shrink-0`}>
      <Icon className={glyph} />
    </span>
  );
}

// ── Pills ──
const PILL_TONES: Record<Tone, string> = {
  purple: 'bg-violet-50 text-[#6d28d9]',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-orange-50 text-orange-600',
  blue: 'bg-blue-50 text-blue-600',
  red: 'bg-rose-50 text-rose-600',
  grey: 'bg-neutral-100 text-neutral-500',
};

const STATUS_TONE: Record<string, Tone> = {
  paid: 'green', sent: 'blue', overdue: 'red', draft: 'grey', cancelled: 'grey',
  published: 'green', active: 'green', scheduled: 'blue', generating: 'blue', sending: 'blue',
};

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status.toLowerCase()] || 'grey';
  return (
    <span className={`inline-flex px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium capitalize whitespace-nowrap ${PILL_TONES[tone]} ${status === 'cancelled' ? 'line-through' : ''}`}>
      {status}
    </span>
  );
}

// ── Layout pieces ──
export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <motion.header {...fadeUp()} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">{title}</h1>
        <p className="text-sm text-neutral-500 font-light mt-1">{subtitle}</p>
      </div>
      {action}
    </motion.header>
  );
}

export function WidgetHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
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

export function ViewAll({ href, onClick, label = 'View all' }: { href?: string; onClick?: () => void; label?: string }) {
  const cls = 'inline-flex items-center gap-1 text-[13px] font-medium text-[#6d28d9] hover:text-[#4c1d95] flex-shrink-0';
  const inner = <>{label} <ArrowRight className="w-3.5 h-3.5" /></>;
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

export function Skeleton({ className }: { className: string }) {
  return <div className={`rounded-md bg-neutral-100 animate-pulse ${className}`} />;
}

// ── Formatting ──
export const formatINR = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Short Indian format for stat cards: ₹12.5L, ₹1.2Cr
export const formatCompact = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1).replace(/\.0$/, '')}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, '')}L`;
  return formatINR(n);
};

export const formatDate = (d: string, withYear = false) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
};

// ── Tools ──
export interface Tool {
  title: string;
  description: string;
  short: string;
  icon: React.ElementType;
  href: string;
}

export const FINANCE_TOOLS: Tool[] = [
  { title: 'Invoices', short: 'GST billing', description: 'GST invoices with CGST/SGST/IGST split, HSN codes and profit tracking.', icon: ScrollText, href: '/invoices' },
  { title: 'Customers', short: 'Client records', description: 'Customer records with GSTIN, PAN and state-wise billing addresses.', icon: Contact2, href: '/customers' },
  { title: 'Products', short: 'Your catalog', description: 'Catalog with HSN codes, GST rates, cost price, MRP and barcodes.', icon: Boxes, href: '/products' },
  { title: 'Expenses', short: 'Track spending', description: 'Track spending across software, salaries, marketing and more.', icon: Coins, href: '/finance/expenses' },
  { title: 'Quotations', short: 'Quote to invoice', description: 'Send professional quotes and convert them to invoices.', icon: FileBarChart, href: '/finance/quotes' },
  { title: 'Delivery Challans', short: 'Goods transport', description: 'Challans for goods transport with sequential numbering.', icon: PackageCheck, href: '/finance/challans' },
  { title: 'Tally / Excel', short: 'Import & export', description: 'Import and export data in Tally-compatible Excel format.', icon: Sheet, href: '/finance/tally' },
  { title: 'Payment Reminders', short: 'Follow up dues', description: 'Follow up on overdue invoices with WhatsApp reminders.', icon: BellRing, href: '/finance/reminders' },
  { title: 'Template Designer', short: 'Layouts & fonts', description: 'Customise invoice layouts, colours and fonts for your brand.', icon: Paintbrush, href: '/finance/templates' },
];

export const marketingTools = (templateLabel: string): Tool[] => [
  { title: 'Social Media', short: 'Captions & hashtags', description: 'Captions, hooks and hashtags for every platform.', icon: AtSign, href: '/marketing/email' },
  { title: 'SEO Platform', short: 'Track & improve rankings', description: 'Site audits, keyword research and competitor insights.', icon: SearchCheck, href: '/marketing/seo' },
  { title: 'Blog & Content', short: 'Create & manage content', description: 'SEO-optimised articles with one-click publishing.', icon: PenTool, href: '/marketing/blog' },
  { title: 'Blog Agent', short: 'Automated blog writer', description: 'Researches, writes and publishes blogs on a schedule.', icon: Bot, href: '/marketing/blog' },
  { title: 'Invitations', short: `${templateLabel} branded designs`, description: `${templateLabel} festival and occasion templates with your branding.`, icon: MailOpen, href: '/marketing/invitations' },
];

export function ToolItem({ tool }: { tool: Tool }) {
  return (
    <Link href={tool.href} className="group flex items-start gap-3.5 p-4 rounded-xl hover:bg-[#f7f5fb] transition-colors">
      <IconCircle icon={tool.icon} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 group-hover:text-[#6d28d9] transition-colors">{tool.title}</p>
        <p className="text-[13px] text-neutral-500 font-light leading-relaxed mt-0.5 line-clamp-2">{tool.description}</p>
      </div>
      <ChevronRight className="w-4 h-4 mt-0.5 text-neutral-300 group-hover:text-[#6d28d9] transition-colors flex-shrink-0" />
    </Link>
  );
}

// ── Data ──
export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
}

export interface FinanceSummary {
  billed: number;
  collected: number;
  outstanding: number;
  overdueCount: number;
  invoiceCount: number;
  customers: number;
  products: number;
  statusCounts: Record<'paid' | 'sent' | 'draft' | 'overdue', number>;
  recent: InvoiceRow[];
}

const EMPTY_SUMMARY: FinanceSummary = {
  billed: 0, collected: 0, outstanding: 0, overdueCount: 0,
  invoiceCount: 0, customers: 0, products: 0,
  statusCounts: { paid: 0, sent: 0, draft: 0, overdue: 0 },
  recent: [],
};

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Billing numbers with the same semantics as the invoices page: totalAmount, cancelled excluded. */
export function useFinanceSummary() {
  const [data, setData] = useState<FinanceSummary>(EMPTY_SUMMARY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
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
      const countOf = (status: string) => invList.filter(inv => (inv.status || 'draft') === status).length;

      setData({
        billed,
        collected,
        outstanding: billed - collected,
        overdueCount: active.filter(inv => inv.status === 'overdue').length,
        invoiceCount: invList.length,
        customers: Array.isArray(customers) ? customers.length : 0,
        products: Array.isArray(products) ? products.length : 0,
        statusCounts: { paid: countOf('paid'), sent: countOf('sent'), draft: countOf('draft'), overdue: countOf('overdue') },
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

  const collectionRate = data.billed > 0 ? Math.round((data.collected / data.billed) * 100) : 0;
  return { data, loaded, collectionRate };
}

export function useTemplateCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/invitations/stats')
      .then(res => (res.ok ? res.json() : null))
      .then((d: { count?: number } | null) => { if (!cancelled && d?.count) setCount(d.count); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return count ? `${count}` : '500+';
}

// Header and rows are separate grids, so columns use fixed tracks to stay aligned
const INVOICE_COLS = 'grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_64px_64px] sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_104px_84px] items-center gap-2.5 sm:gap-4';

// ── Shared widgets ──
const STATUS_SUMMARY: { key: keyof FinanceSummary['statusCounts']; label: string; dot: string }[] = [
  { key: 'paid', label: 'Paid', dot: 'bg-emerald-500' },
  { key: 'sent', label: 'Sent', dot: 'bg-blue-500' },
  { key: 'draft', label: 'Draft', dot: 'bg-neutral-400' },
  { key: 'overdue', label: 'Overdue', dot: 'bg-rose-500' },
];

export function RecentInvoicesCard({ data, loaded, className = '' }: { data: FinanceSummary; loaded: boolean; className?: string }) {
  return (
    <section className={`${CARD} min-w-0 flex flex-col ${className}`}>
      <WidgetHeader
        title="Recent invoices"
        subtitle="Your latest five bills at a glance"
        action={data.recent.length > 0 && <ViewAll href="/invoices" />}
      />
      {loaded && data.recent.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 sm:px-6 pb-4 -mt-1">
          {STATUS_SUMMARY.map(s => (
            <span key={s.key} className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#f7f8fa] text-xs text-neutral-600">
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
              <span className="font-semibold text-neutral-900 tabular-nums">{data.statusCounts[s.key]}</span>
            </span>
          ))}
        </div>
      )}
      <div className="px-3 sm:px-4 pb-4 flex-1 flex flex-col">
        {!loaded ? (
          <div className="space-y-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-4 p-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : data.recent.length === 0 ? (
          <div className="px-6 pt-4 pb-8 text-center">
            <div className="flex justify-center"><IconCircle icon={Receipt} size="lg" /></div>
            <p className="text-sm font-medium text-neutral-900 mt-4">No invoices yet</p>
            <p className="text-sm text-neutral-500 font-light mt-1">Your invoices will show up here once you create one.</p>
            <Link
              href="/invoices"
              className="inline-flex items-center gap-2 mt-5 px-5 h-10 rounded-full bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-sm font-medium transition-colors"
            >
              Create invoice <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="min-w-0 flex-1 flex flex-col">
            <div className={`${INVOICE_COLS} px-3 py-2.5 rounded-xl bg-[#f7f8fa] text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-neutral-400`}>
              <span>Customer</span>
              <span>Invoice</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Status</span>
            </div>
            <ul className="mt-1 divide-y divide-neutral-100">
              {data.recent.map(inv => (
                <li key={inv.id}>
                  <Link
                    href="/invoices"
                    className={`${INVOICE_COLS} px-3 py-3 rounded-xl hover:bg-[#f7f5fb] transition-colors`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0 text-xs sm:text-sm font-semibold text-[#6d28d9]">
                        {inv.customerName.charAt(0).toUpperCase()}
                      </span>
                      <p className="text-[13px] sm:text-sm font-medium text-neutral-900 line-clamp-2 break-words">{inv.customerName}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] sm:text-sm text-neutral-700 truncate">{inv.invoiceNumber}</p>
                      <p className="text-[11px] text-neutral-400 font-light">{formatDate(inv.date)}</p>
                    </div>
                    <p title={formatINR(inv.amount)} className="text-[13px] sm:text-sm font-semibold text-neutral-900 tabular-nums text-right truncate">
                      <span className="sm:hidden">{formatCompact(inv.amount)}</span>
                      <span className="hidden sm:inline">{formatINR(inv.amount)}</span>
                    </p>
                    <div className="flex justify-end">
                      <StatusPill status={inv.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-4 px-3 flex items-center justify-between gap-3">
              <p className="text-xs text-neutral-400 font-light">
                Showing {data.recent.length} of {plural(data.invoiceCount, 'invoice')}
              </p>
              <Link href="/invoices" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6d28d9] hover:text-[#4c1d95]">
                <Plus className="w-3.5 h-3.5" /> New invoice
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

export function CollectionsCard({ data, loaded, rate, className = '' }: { data: FinanceSummary; loaded: boolean; rate: number; className?: string }) {
  const legend = [
    { label: 'Received', value: data.collected, dot: 'bg-[#6d28d9]' },
    { label: 'Pending', value: data.outstanding, dot: 'bg-orange-400' },
    { label: 'Total billed', value: data.billed, dot: 'bg-neutral-300' },
  ];

  return (
    <section className={`${CARD} min-w-0 flex flex-col ${className}`}>
      <WidgetHeader title="Collections" subtitle="How much of your billing is paid" />
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex-1 flex flex-col">
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r={RING_R} fill="none" stroke="#fff1e6" strokeWidth="12" />
              <motion.circle
                cx="60" cy="60" r={RING_R} fill="none" stroke="#6d28d9" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={RING_C}
                initial={{ strokeDashoffset: RING_C }}
                animate={{ strokeDashoffset: RING_C * (1 - (loaded ? rate : 0) / 100) }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ opacity: rate > 0 ? 1 : 0 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {loaded ? (
                <p className="text-2xl font-semibold text-neutral-900 tabular-nums tracking-tight">{rate}%</p>
              ) : (
                <Skeleton className="h-7 w-12" />
              )}
              <p className="text-[11px] text-neutral-500 font-light">collected</p>
            </div>
          </div>
          <dl className="flex-1 min-w-0 space-y-3">
            {legend.map(item => (
              <div key={item.label} className="min-w-0">
                <dt className="flex items-center gap-2 text-xs text-neutral-500 font-light">
                  <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                  {item.label}
                </dt>
                <dd className="text-sm sm:text-[15px] font-semibold text-neutral-900 tabular-nums mt-0.5 pl-4 break-words">
                  {loaded ? formatINR(item.value) : '—'}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-auto pt-5">
          {!loaded ? (
            <Skeleton className="h-11 w-full rounded-xl" />
          ) : data.overdueCount > 0 ? (
            <Link
              href="/finance/reminders"
              className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/70 hover:bg-rose-50 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <CalendarClock className="w-4 h-4 text-rose-600" />
              </span>
              <span className="flex-1 text-[13px] text-rose-700">{plural(data.overdueCount, 'invoice')} overdue — send reminders</span>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </Link>
          ) : data.outstanding > 0 ? (
            <Link
              href="/finance/reminders"
              className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/70 hover:bg-orange-50 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <CalendarClock className="w-4 h-4 text-orange-500" />
              </span>
              <span className="flex-1 text-[13px] text-orange-700">{formatINR(data.outstanding)} still to collect — follow up</span>
              <ChevronRight className="w-4 h-4 text-orange-300" />
            </Link>
          ) : data.billed > 0 ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/70">
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </span>
              <span className="flex-1 text-[13px] text-emerald-700">Every invoice is paid. Nice work.</span>
            </div>
          ) : (
            <p className="text-[13px] text-neutral-500 font-light p-3 rounded-xl bg-[#f7f8fa]">
              Collections show up here once you send your first invoice.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Onboarding checklist; renders nothing once every step is done. */
export function GettingStartedCard({ data, loaded }: { data: FinanceSummary; loaded: boolean }) {
  const steps = [
    { label: 'Create your first invoice', href: '/invoices', done: data.invoiceCount > 0 },
    { label: 'Add a customer profile', href: '/customers', done: data.customers > 0 },
    { label: 'Add a product to your catalog', href: '/products', done: data.products > 0 },
  ];
  const doneCount = steps.filter(s => s.done).length;
  if (!loaded || doneCount === steps.length) return null;

  return (
    <motion.section {...fadeUp(0.16)} className={CARD}>
      <WidgetHeader title="Getting started" subtitle={`${doneCount} of ${steps.length} steps complete`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-3 px-3 sm:px-4 pb-4">
        {steps.map(step => (
          <Link
            key={step.label}
            href={step.href}
            className="group flex items-center gap-3 px-3 py-3 rounded-xl md:bg-[#f7f8fa] hover:bg-[#f7f5fb] transition-colors"
          >
            {step.done ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#6d28d9]" />
            ) : (
              <Circle className="w-5 h-5 flex-shrink-0 text-neutral-300 group-hover:text-violet-300 transition-colors" />
            )}
            <span className={`flex-1 text-sm ${step.done ? 'text-neutral-400 line-through font-light' : 'text-neutral-700'}`}>
              {step.label}
            </span>
            {!step.done && <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[#6d28d9] transition-colors" />}
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
