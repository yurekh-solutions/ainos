'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ScrollText, Contact2, Boxes, Coins, FileBarChart, PackageCheck, Sheet, BellRing, Paintbrush,
  AtSign, SearchCheck, PenTool, Bot, MailOpen,
  IndianRupee, Hourglass, Receipt, Layers,
  FilePlus2, UserRoundPlus, Megaphone, NotebookPen,
  CheckCircle2, Circle, ChevronRight, ArrowUpRight,
} from 'lucide-react';

interface Tool {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

interface Stat {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
}

const ACCENT = 'text-[#5b21b6]';

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">{title}</h2>
      <p className="text-sm text-neutral-500 font-light mt-0.5">{subtitle}</p>
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const [templateCount, setTemplateCount] = useState<number | null>(null);
  const [financeStats, setFinanceStats] = useState({ invoices: 0, revenue: 0, pending: 0, products: 0, customers: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/invitations/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { count?: number } | null) => {
        if (!cancelled && data?.count) setTemplateCount(data.count);
      })
      .catch(() => {});

    Promise.all([
      fetch('/api/invoices').then(r => r.ok ? r.json() : []),
      fetch('/api/products').then(r => r.ok ? r.json() : []),
      fetch('/api/customers').then(r => r.ok ? r.json() : []),
    ]).then(([invoices, products, customers]) => {
      if (cancelled) return;
      const invList = Array.isArray(invoices) ? invoices : [];
      const prodList = Array.isArray(products) ? products : [];
      const custList = Array.isArray(customers) ? customers : [];
      const amount = (inv: unknown) => (inv as Record<string, unknown>).total as number || (inv as Record<string, unknown>).grandTotal as number || 0;
      const revenue = invList.reduce((s: number, inv: unknown) => s + amount(inv), 0);
      const pending = invList.filter((inv: unknown) => (inv as Record<string, unknown>).status !== 'paid').reduce((s: number, inv: unknown) => s + amount(inv), 0);
      setFinanceStats({
        invoices: invList.length,
        revenue,
        pending,
        products: prodList.length,
        customers: custList.length,
      });
    }).catch(() => {}).finally(() => { if (!cancelled) setLoaded(true); });

    return () => { cancelled = true; };
  }, []);

  const templateLabel = templateCount ? `${templateCount}` : '500+';
  const formatINR = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const stats: Stat[] = [
    { label: 'Revenue', value: `₹${formatINR(financeStats.revenue)}`, hint: 'Total billed', icon: IndianRupee },
    { label: 'Pending', value: `₹${formatINR(financeStats.pending)}`, hint: 'Awaiting payment', icon: Hourglass },
    { label: 'Invoices', value: financeStats.invoices.toString(), hint: 'All time', icon: Receipt },
    { label: 'Products', value: financeStats.products.toString(), hint: 'In catalog', icon: Layers },
  ];

  const quickActions: Tool[] = [
    { title: 'New invoice', description: 'Bill a customer', icon: FilePlus2, href: '/invoices' },
    { title: 'Add customer', description: 'Save GST details', icon: UserRoundPlus, href: '/customers' },
    { title: 'Create caption', description: 'For social posts', icon: Megaphone, href: '/marketing/email' },
    { title: 'Write a blog', description: 'SEO-ready article', icon: NotebookPen, href: '/marketing/blog' },
  ];

  const setupSteps = [
    { label: 'Create your first invoice', href: '/invoices', done: financeStats.invoices > 0 },
    { label: 'Add a customer profile', href: '/customers', done: financeStats.customers > 0 },
    { label: 'Add a product to your catalog', href: '/products', done: financeStats.products > 0 },
  ];
  const doneCount = setupSteps.filter(s => s.done).length;

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-full bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* Greeting */}
        <header className="mb-6 sm:mb-8">
          <p className="text-sm text-neutral-500 font-light">{today}</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight mt-1">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-light mt-2 max-w-xl leading-relaxed">
            Here&apos;s how your business is doing today.
          </p>
        </header>

        {/* Overview */}
        <section className="rounded-2xl bg-white border border-neutral-200 mb-6 sm:mb-8 overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`p-4 sm:p-6 ${i % 2 === 0 ? 'border-r border-neutral-100' : ''} ${i < 2 ? 'border-b lg:border-b-0 border-neutral-100' : ''} ${i === 1 ? 'lg:border-r' : ''}`}
                >
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Icon className={`w-4 h-4 ${ACCENT}`} />
                    <span className="text-sm font-light">{stat.label}</span>
                  </div>
                  <p className={`mt-3 text-xl sm:text-2xl font-semibold tabular-nums tracking-tight break-words ${loaded ? 'text-neutral-900' : 'text-neutral-300'}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-neutral-400 font-light mt-1">{stat.hint}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick actions + Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 mb-10 sm:mb-12">
          <section className="lg:col-span-3">
            <SectionTitle title="Quick actions" subtitle="Jump straight into common tasks" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group flex flex-col p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 hover:border-purple-200 hover:bg-purple-50/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${ACCENT}`} />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-[#5b21b6] transition-colors" />
                    </div>
                    <p className="text-[15px] font-medium text-neutral-900 mt-4">{action.title}</p>
                    <p className="text-sm text-neutral-500 font-light mt-0.5">{action.description}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="lg:col-span-2">
            <SectionTitle title="Getting started" subtitle={`${doneCount} of ${setupSteps.length} steps complete`} />
            <div className="rounded-2xl bg-white border border-neutral-200 p-4 sm:p-5">
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden mb-4">
                <div
                  className="h-full rounded-full bg-[#5b21b6] transition-all duration-500"
                  style={{ width: `${(doneCount / setupSteps.length) * 100}%` }}
                />
              </div>
              <div className="space-y-1">
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
            </div>
          </section>
        </div>

        {/* Finance */}
        <section className="mb-10 sm:mb-12">
          <SectionTitle title="Finance" subtitle="Billing, GST and everyday accounts" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {financeTools.map((tool) => <ToolRow key={tool.href} tool={tool} />)}
          </div>
        </section>

        {/* Marketing */}
        <section>
          <SectionTitle title="Marketing" subtitle="Content, SEO and social in one place" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {marketingTools.map((tool) => <ToolRow key={tool.href} tool={tool} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
