'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ScrollText, Contact2, Boxes, Coins, FileBarChart, FileCheck, PackageCheck, Sheet, BellRing, Paintbrush, AtSign, SearchCheck, PenTool, MessageSquareText, MailOpen, Send, Receipt, CalendarClock, CheckCircle2, ChevronRight, ArrowRight, ArrowUpRight, Plus } from 'lucide-react';

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
export type Tone = 'purple' | 'green' | 'orange' | 'blue' | 'red' | 'grey' | 'cyan' | 'pink' | 'indigo';
const TONES: Record<Tone, string> = {
  purple: 'bg-violet-50 text-[#6d28d9]',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-orange-50 text-orange-500',
  blue: 'bg-blue-50 text-blue-600',
  red: 'bg-rose-50 text-rose-500',
  grey: 'bg-neutral-100 text-neutral-500',
  cyan: 'bg-cyan-50 text-cyan-600',
  pink: 'bg-pink-50 text-pink-600',
  indigo: 'bg-indigo-50 text-indigo-600',
};

// Rich gradient faces — used for tool tiles. Kept inside the AINOS deep-violet
// ramp (single accent, no rainbow) so every landing page stays on-brand.
const GRADIENTS: Record<Tone, string> = {
  purple: 'from-violet-500 to-purple-600',
  green: 'from-violet-600 to-purple-700',
  orange: 'from-purple-600 to-violet-700',
  blue: 'from-violet-600 to-purple-700',
  red: 'from-purple-600 to-violet-700',
  grey: 'from-violet-500 to-purple-600',
  cyan: 'from-purple-500 to-violet-600',
  pink: 'from-purple-500 to-violet-600',
  indigo: 'from-violet-500 to-purple-600',
};

export function IconCircle({ icon: Icon, tone = 'purple', size = 'md', variant = 'soft' }: { icon: React.ElementType; tone?: Tone; size?: 'sm' | 'md' | 'lg'; variant?: 'soft' | 'gradient' }) {
  const box = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const glyph = size === 'lg' ? 'w-[22px] h-[22px]' : size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';
  const face = variant === 'gradient' ? `bg-gradient-to-br text-white shadow-[0_4px_10px_-2px_rgba(16,24,40,0.25)] ${GRADIENTS[tone]}` : TONES[tone];
  return (
    <span className={`${box} ${face} rounded-full inline-flex items-center justify-center flex-shrink-0`}>
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
  cyan: 'bg-cyan-50 text-cyan-600',
  pink: 'bg-pink-50 text-pink-600',
  indigo: 'bg-indigo-50 text-indigo-600',
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
  tone?: Tone;
  /** 'advanced' tools sit behind a More tools expander; core tools are the daily loop. */
  tier?: 'core' | 'advanced';
}

// Ordered as the money journey runs: bill → collect → spend → file, then extras.
export const FINANCE_TOOLS: Tool[] = [
  { title: 'Invoices', short: 'Professional billing', description: 'Create GST-compliant invoices with automatic tax calculations and payment tracking.', icon: ScrollText, href: '/invoices', tone: 'purple', tier: 'core' },
  { title: 'Customers', short: 'Manage your clients', description: 'Store customer details with GSTIN, PAN and billing addresses for quick invoicing.', icon: Contact2, href: '/customers', tone: 'blue', tier: 'core' },
  { title: 'Expenses', short: 'Track business spending', description: 'Record and categorize expenses for software, salaries, marketing and operations.', icon: Coins, href: '/finance/expenses', tone: 'orange', tier: 'core' },
  { title: 'Payment Reminders', short: 'Collect payments faster', description: 'Send automated WhatsApp reminders for overdue invoices.', icon: BellRing, href: '/finance/reminders', tone: 'pink', tier: 'core' },
  { title: 'GST Reports', short: 'Filing-ready tax data', description: 'GSTR-1 and GSTR-3B summaries build themselves from the bills you already made.', icon: FileCheck, href: '/finance/gst-reports', tone: 'indigo', tier: 'core' },
  { title: 'Products', short: 'Your product catalog', description: 'Manage products with HSN codes, GST rates, pricing and inventory tracking.', icon: Boxes, href: '/products', tone: 'green', tier: 'advanced' },
  { title: 'Quotations', short: 'Win more deals', description: 'Send professional quotes and convert approved quotes to invoices instantly.', icon: FileBarChart, href: '/finance/quotes', tone: 'red', tier: 'advanced' },
  { title: 'Delivery Challans', short: 'Shipping documents', description: 'Generate delivery challans for goods transport with sequential numbering.', icon: PackageCheck, href: '/finance/challans', tone: 'cyan', tier: 'advanced' },
  { title: 'Tally / Excel', short: 'Data import & export', description: 'Import existing data or export reports in Tally-compatible Excel format.', icon: Sheet, href: '/finance/tally', tone: 'indigo', tier: 'advanced' },
  { title: 'Template Designer', short: 'Custom invoice layouts', description: 'Design professional invoice templates with your brand colors and fonts.', icon: Paintbrush, href: '/finance/templates', tone: 'purple', tier: 'advanced' },
];

export const marketingTools = (templateLabel: string): Tool[] => [
  { title: 'Email Campaigns', short: 'Send bulk emails that convert', description: 'Design, send and track email campaigns with open and click analytics.', icon: Send, href: '/marketing/campaigns', tone: 'blue' },
  { title: 'Social Media', short: 'Create engaging posts', description: 'Generate captions, hooks and hashtags for Instagram, LinkedIn, Twitter and Facebook.', icon: AtSign, href: '/marketing/social-media', tone: 'purple' },
  { title: 'SEO Platform', short: 'Rank higher on Google', description: 'Audit your website, research keywords and track competitor rankings.', icon: SearchCheck, href: '/marketing/seo', tone: 'indigo' },
  { title: 'Blog & Content', short: 'Publish quality articles', description: 'Write and publish SEO-optimized blog posts with AI assistance.', icon: PenTool, href: '/marketing/blog', tone: 'orange' },
  { title: 'Blog Agent', short: 'Automated content creation', description: 'AI researches topics, writes articles and publishes on your schedule.', icon: MessageSquareText, href: '/marketing/blog', tone: 'green' },
  { title: 'Invitations', short: `Professional event designs`, description: `Create branded invitations for festivals, events and special occasions.`, icon: MailOpen, href: '/marketing/invitations', tone: 'pink' },
];

export function ToolItem({ tool }: { tool: Tool }) {
  return (
    <Link href={tool.href} className="group flex items-start gap-3.5 p-4 rounded-xl hover:bg-[#f7f5fb] transition-colors">
      <IconCircle icon={tool.icon} tone={tool.tone} variant="gradient" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 group-hover:text-[#6d28d9] transition-colors">{tool.title}</p>
        <p className="text-[13px] text-neutral-500 font-light leading-relaxed mt-0.5 line-clamp-2">{tool.description}</p>
      </div>
      <ChevronRight className="w-4 h-4 mt-0.5 text-neutral-300 group-hover:text-[#6d28d9] transition-colors flex-shrink-0" />
    </Link>
  );
}

/** Professional grid tile: soft gradient card with an arrow affordance. */
export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={tool.href}
      className="group relative flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-neutral-100 bg-gradient-to-br from-white to-[#faf8fd] hover:border-violet-200 hover:shadow-[0_16px_34px_-14px_rgba(76,29,149,0.32)] hover:-translate-y-0.5 transition-all duration-200 min-w-0 overflow-hidden"
    >
      <div className="relative flex items-center justify-between">
        <IconCircle icon={tool.icon} tone={tool.tone} variant="gradient" size="lg" />
        <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-[#6d28d9] transition-colors" />
      </div>
      <div className="relative min-w-0">
        <p className="text-[13px] sm:text-sm font-semibold text-neutral-900 group-hover:text-[#6d28d9] transition-colors leading-snug">{tool.title}</p>
        <p className="text-[11px] sm:text-xs text-neutral-500 font-light mt-1 leading-relaxed line-clamp-2">{tool.short}</p>
      </div>
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

export function RecentInvoicesCard({ data, loaded, className = '', appearance = 'default' }: { data: FinanceSummary; loaded: boolean; className?: string; appearance?: 'default' | 'lavender' }) {
  const lavender = appearance === 'lavender';
  const columns = lavender ? 'overview-invoice-cols' : INVOICE_COLS;
  return (
    <section className={`${lavender ? 'overview-card overview-widget overview-invoices' : CARD} min-w-0 flex flex-col ${className}`}>
      {lavender && (
        <svg viewBox="0 0 440 220" className="overview-invoice-art" aria-hidden="true">
          <defs>
            <linearGradient id="overview-invoice-wave" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#ede5ff" /><stop offset="1" stopColor="#cbb5fa" />
            </linearGradient>
          </defs>
          <path d="M0 211c75-65 110 47 188-29S270 30 344 57s62 81 96 80v83H0Z" fill="#eee7ff" />
          <path d="M0 218c109-52 148 27 215-51S301 58 352 93s49 33 88 26v101H0Z" fill="url(#overview-invoice-wave)" />
          <g transform="translate(310 58) rotate(9)">
            <rect x="3" y="6" width="94" height="133" rx="7" fill="#b49adf" opacity="0.2" />
            <rect width="94" height="133" rx="7" fill="#fcfaff" />
            <path d="M16 20h10m11 0h41m-62 22h62m-62 14h48m-48 14h60m-60 20h20m14 0h26m-60 19h60" stroke="#d8c9f5" strokeWidth="5" strokeLinecap="round" />
          </g>
        </svg>
      )}
      <WidgetHeader
        title={lavender ? 'Recent Invoices' : 'Recent invoices'}
        subtitle="Your latest five bills at a glance"
        action={(lavender || data.recent.length > 0) && <ViewAll href="/invoices" />}
      />
      {loaded && (lavender || data.recent.length > 0) && (
        <div className="flex flex-wrap gap-2 px-5 sm:px-6 pb-4 -mt-1">
          {STATUS_SUMMARY.map(s => (
            <span key={s.key} className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#f7f8fa] text-xs text-neutral-600 ${lavender ? `overview-status overview-status-${s.key}` : ''}`}>
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
            <div className={`${columns} ${lavender ? 'overview-invoice-head' : ''} px-3 py-2.5 rounded-xl bg-[#f7f8fa] text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-neutral-400`}>
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
                    className={`${columns} ${lavender ? 'overview-invoice-row' : ''} px-3 py-3 rounded-xl hover:bg-[#f7f5fb] transition-colors`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0 text-xs sm:text-sm font-semibold text-[#6d28d9]">
                        {inv.customerName.charAt(0).toUpperCase()}
                      </span>
                      <p className={`text-[13px] sm:text-sm font-medium text-neutral-900 break-words ${lavender ? '' : 'line-clamp-2'}`}>{inv.customerName}</p>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[12px] sm:text-sm text-neutral-700 ${lavender ? 'break-words' : 'truncate'}`}>{inv.invoiceNumber}</p>
                      <p className="text-[11px] text-neutral-400 font-light">{formatDate(inv.date)}</p>
                    </div>
                    <p title={formatINR(inv.amount)} className={`text-[13px] sm:text-sm font-semibold text-neutral-900 tabular-nums text-right ${lavender ? 'break-words' : 'truncate'}`}>
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
            <div className="mt-auto pt-4 px-3 flex flex-wrap items-center justify-between gap-3">
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

export function CollectionsCard({ data, loaded, rate, className = '', appearance = 'default' }: { data: FinanceSummary; loaded: boolean; rate: number; className?: string; appearance?: 'default' | 'lavender' }) {
  const lavender = appearance === 'lavender';
  const legend = [
    { label: 'Received', value: data.collected, dot: lavender ? 'bg-emerald-500' : 'bg-[#6d28d9]' },
    { label: 'Pending', value: data.outstanding, dot: 'bg-orange-400' },
    { label: 'Total billed', value: data.billed, dot: 'bg-neutral-300' },
  ];

  return (
    <section className={`${lavender ? 'overview-card overview-widget overview-collections' : CARD} min-w-0 flex flex-col ${className}`}>
      <WidgetHeader title="Collections" subtitle="How much of your billing is paid" />
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex-1 flex flex-col">
        <div className={`flex items-center gap-5 sm:gap-6 ${lavender ? 'overview-collections-chart' : ''}`}>
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r={RING_R} fill="none" stroke={lavender ? '#e0d7f4' : '#fff1e6'} strokeWidth={lavender ? 9 : 12} />
              <motion.circle
                cx="60" cy="60" r={RING_R} fill="none" stroke={lavender ? '#10b981' : '#6d28d9'} strokeWidth={lavender ? 9 : 12} strokeLinecap="round"
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

/** The money journey: four stages, lit by whatever the business has already done.
 *  Stage four is a monthly ritual, never "complete" — it lights up as a habit, not a checkbox. */
export function FinanceJourneyCard({ data, loaded }: { data: FinanceSummary; loaded: boolean }) {
  const setupDone = loaded && data.customers > 0;
  const billed = loaded && data.invoiceCount > 0;
  const collectedAll = loaded && data.billed > 0 && data.outstanding <= 0;
  const stages = [
    {
      key: 'setup',
      title: 'Set up once',
      promise: 'Type every customer and product one time — after this, bills build themselves.',
      done: setupDone,
      href: '/customers',
      cta: setupDone ? 'Customers saved' : 'Add customers',
    },
    {
      key: 'bill',
      title: 'Bill your work',
      promise: 'A professional GST bill in about a minute — tax calculated for you.',
      done: billed,
      href: '/invoices',
      cta: billed ? 'Create the next invoice' : 'Create your first invoice',
    },
    {
      key: 'collect',
      title: 'Collect the money',
      promise: 'See who owes what, and send a WhatsApp reminder in one tap.',
      done: collectedAll,
      href: '/finance/reminders',
      cta: data.overdueCount > 0 ? `${plural(data.overdueCount, 'invoice')} overdue — remind` : 'Send reminders',
    },
    {
      key: 'gst',
      title: 'Stay GST-ready',
      promise: 'GSTR-1 and 3B data builds itself from your bills — download the pack, upload on the portal, filed in minutes.',
      done: false,
      href: '/finance/gst-reports',
      cta: 'Open GST reports',
    },
  ];
  // The stage to work on now: the first of the three linear steps still open.
  const current = stages.slice(0, 3).find(s => !s.done);

  return (
    <motion.section {...fadeUp(0.16)} className={CARD}>
      <WidgetHeader title="Your money journey" subtitle="Four steps — each one saves the work it names" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-4 pb-4">
        {stages.map((stage, i) => {
          const isCurrent = current?.key === stage.key;
          return (
            <Link
              key={stage.key}
              href={stage.href}
              className={`group flex flex-col gap-2 px-3.5 py-3.5 rounded-xl transition-colors ${
                isCurrent
                  ? 'bg-[#f3ecfe] ring-1 ring-[#c4b0f0]'
                  : stage.done
                    ? 'bg-[#f0faf4]'
                    : 'bg-[#f7f8fa] hover:bg-[#f7f5fb]'
              }`}
            >
              <div className="flex items-center gap-2">
                {stage.done ? (
                  <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </span>
                ) : (
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
                    isCurrent ? 'bg-[#6d28d9] text-white' : 'bg-white text-neutral-400 ring-1 ring-neutral-200'
                  }`}>
                    {i + 1}
                  </span>
                )}
                <span className={`text-[13px] font-semibold ${stage.done ? 'text-emerald-700' : isCurrent ? 'text-[#4c1d95]' : 'text-neutral-900'}`}>
                  {stage.title}
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-light leading-relaxed flex-1">{stage.promise}</p>
              <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${stage.done ? 'text-emerald-600' : 'text-[#6d28d9]'}`}>
                {stage.cta} <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              </span>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
}
