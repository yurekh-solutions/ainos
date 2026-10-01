'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Radio, FileText, Zap, ArrowRight,
  ScrollText, Contact2, Boxes, BarChart3, Hourglass, BadgePercent, FileBarChart,
  Truck, FileSpreadsheet, BellRing, Paintbrush, Hash, SearchCheck, PenTool, Bot, MailOpen, Share2, Layers,
} from 'lucide-react';

interface Tool {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  stat: string;
  gradient: string;
  accent: string;
}

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  gradient: string;
  color: string;
}

// ─ Reusable Stat Card ──
function StatItem({ stat, delay }: { stat: StatCard; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="relative p-5 sm:p-6 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
        border: '1px solid hsl(var(--border) / 0.5)',
        boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
      }}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg mb-4`}>
        <stat.icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
      <p className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
      <p className="text-xs font-medium" style={{ color: stat.color }}>{stat.sub}</p>
    </motion.div>
  );
}

// ── Reusable Tool Card ──
function ToolCard({ tool, delay }: { tool: Tool; delay: number }) {
  const Icon = tool.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="relative p-6 rounded-2xl flex flex-col h-full overflow-hidden group"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
        border: '1px solid hsl(var(--border) / 0.5)',
        boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
      }}
    >
      <div className="flex items-start justify-between mb-5">
        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
        </span>
      </div>
      <h3 className="text-base font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>{tool.title}</h3>
      <p className="text-xs leading-relaxed mb-5 flex-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{tool.description}</p>
      <div className="mt-auto flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: tool.accent }}>{tool.stat}</p>
        <Link href={tool.href}>
          <motion.button whileHover={{ scale: 1.05, x: 3 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all" style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
            Open <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}

// ── Reusable Section Header ──
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
      <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{title}</h2>
      <span className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All systems active
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [templateCount, setTemplateCount] = useState<number | null>(null);
  const [financeStats, setFinanceStats] = useState({ invoices: 0, revenue: 0, pending: 0, products: 0 });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/invitations/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { count?: number } | null) => {
        if (!cancelled && data?.count) setTemplateCount(data.count);
      })
      .catch(() => {});

    // Fetch finance stats
    Promise.all([
      fetch('/api/invoices').then(r => r.ok ? r.json() : []),
      fetch('/api/products').then(r => r.ok ? r.json() : []),
    ]).then(([invoices, products]) => {
      if (cancelled) return;
      const invList = Array.isArray(invoices) ? invoices : [];
      const prodList = Array.isArray(products) ? products : [];
      const revenue = invList.reduce((s: number, inv: unknown) => s + ((inv as Record<string, unknown>).total as number || (inv as Record<string, unknown>).grandTotal as number || 0), 0);
      const pending = invList.filter((inv: unknown) => (inv as Record<string, unknown>).status !== 'paid').reduce((s: number, inv: unknown) => s + ((inv as Record<string, unknown>).total as number || (inv as Record<string, unknown>).grandTotal as number || 0), 0);
      setFinanceStats({
        invoices: invList.length,
        revenue,
        pending,
        products: prodList.length,
      });
    }).catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const templateLabel = templateCount ? `${templateCount}` : '500+';

  const marketingTools: Tool[] = [
    {
      title: 'Social Media',
      description: 'AI-powered captions, hooks & hashtags for every platform.',
      icon: Hash,
      href: '/marketing/email',
      stat: '6 platforms ready',
      gradient: 'from-violet-500 to-purple-600',
      accent: '#6c5ce7',
    },
    {
      title: 'SEO Platform',
      description: 'Site audits, keyword research, competitor & content insights.',
      icon: SearchCheck,
      href: '/marketing/seo',
      stat: '92/100 health score',
      gradient: 'from-emerald-500 to-teal-600',
      accent: '#00b894',
    },
    {
      title: 'Blog & Content',
      description: 'SEO-optimized content generation and one-click publishing.',
      icon: PenTool,
      href: '/marketing/blog',
      stat: '4 drafts ready',
      gradient: 'from-sky-500 to-blue-600',
      accent: '#0984e3',
    },
    {
      title: 'Blog Agent',
      description: 'Autonomous agent that researches, writes and publishes blogs.',
      icon: Bot,
      href: '/marketing/blog-agent',
      stat: 'Agent ready',
      gradient: 'from-amber-500 to-orange-600',
      accent: '#f59e0b',
    },
    {
      title: 'Invitations',
      description: `${templateLabel} festival & occasion invitation templates with your branding.`,
      icon: MailOpen,
      href: '/marketing/invitations',
      stat: `${templateLabel} templates`,
      gradient: 'from-pink-500 to-rose-600',
      accent: '#e84393',
    },
  ];

  const formatINR = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const suiteStats: StatCard[] = [
    { label: 'Marketing Tools', value: '5', sub: 'All active & ready', icon: Radio, gradient: 'from-violet-500 to-purple-600', color: '#6c5ce7' },
    { label: 'Invitation Templates', value: templateLabel, sub: 'Festivals & occasions covered', icon: MailOpen, gradient: 'from-pink-500 to-rose-600', color: '#e84393' },
    { label: 'Social Platforms', value: '6', sub: 'Captions, hooks & hashtags', icon: Share2, gradient: 'from-sky-500 to-blue-600', color: '#0984e3' },
    { label: 'SEO Health', value: '92/100', sub: 'Latest site audit score', icon: SearchCheck, gradient: 'from-emerald-500 to-teal-600', color: '#00b894' },
  ];

  const financeStatCards: StatCard[] = [
    { label: 'Total Invoices', value: financeStats.invoices.toString(), sub: 'All time', icon: ScrollText, gradient: 'from-indigo-500 to-blue-600', color: '#6366f1' },
    { label: 'Revenue', value: `₹${formatINR(financeStats.revenue)}`, sub: 'Total billed', icon: BarChart3, gradient: 'from-emerald-500 to-green-600', color: '#10b981' },
    { label: 'Pending', value: `${formatINR(financeStats.pending)}`, sub: 'Awaiting payment', icon: Hourglass, gradient: 'from-amber-500 to-orange-600', color: '#f59e0b' },
    { label: 'Products', value: financeStats.products.toString(), sub: 'In catalog', icon: Layers, gradient: 'from-rose-500 to-pink-600', color: '#f43f5e' },
  ];

  const allStats = [...suiteStats, ...financeStatCards];

  const financeTools: Tool[] = [
    { title: 'Invoices', description: 'Create GST-compliant invoices with CGST/SGST/IGST split, HSN codes & profit tracking.', icon: ScrollText, href: '/invoices', stat: `${financeStats.invoices} invoices`, gradient: 'from-indigo-500 to-blue-600', accent: '#6366f1' },
    { title: 'Customers', description: 'Manage customer database with GSTIN, PAN, state-wise billing addresses.', icon: Contact2, href: '/customers', stat: 'GST-ready profiles', gradient: 'from-cyan-500 to-teal-600', accent: '#06b6d4' },
    { title: 'Products', description: 'Product catalog with HSN codes, GST rates, cost price, MRP & barcodes.', icon: Boxes, href: '/products', stat: `${financeStats.products} items`, gradient: 'from-rose-500 to-pink-600', accent: '#f43f5e' },
    { title: 'Expenses', description: 'Track business expenses across categories — software, salaries, marketing & more.', icon: BadgePercent, href: '/finance/expenses', stat: 'Category-wise tracking', gradient: 'from-amber-500 to-orange-600', accent: '#f59e0b' },
    { title: 'Quotations', description: 'Send professional quotes to clients with multi-item support & tax breakdown.', icon: FileBarChart, href: '/finance/quotes', stat: 'Convert to invoice', gradient: 'from-violet-500 to-purple-600', accent: '#8b5cf6' },
    { title: 'Delivery Challans', description: 'Generate delivery challans for goods transport with sequential numbering.', icon: Truck, href: '/finance/challans', stat: 'DC series ready', gradient: 'from-teal-500 to-emerald-600', accent: '#14b8a6' },
    { title: 'Tally / Excel', description: 'Import & export data in Tally-compatible Excel format for accounting sync.', icon: FileSpreadsheet, href: '/finance/tally', stat: 'Excel export ready', gradient: 'from-green-500 to-emerald-600', accent: '#22c55e' },
    { title: 'Payment Reminders', description: 'Track overdue invoices & send WhatsApp payment reminders to clients.', icon: BellRing, href: '/finance/reminders', stat: `₹${formatINR(financeStats.pending)} pending`, gradient: 'from-red-500 to-rose-600', accent: '#ef4444' },
    { title: 'Template Designer', description: 'Customize invoice templates with 18 brand presets, colors, fonts & layouts.', icon: Paintbrush, href: '/finance/templates', stat: '18 presets', gradient: 'from-fuchsia-500 to-pink-600', accent: '#d946ef' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10 pb-8 sm:pb-12">

        {/* Greeting Header */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                {getGreeting()}, <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{session?.user?.name?.split(' ')[0] || 'User'}</span>
              </h1>
              <p className="text-sm sm:text-base mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Your Marketing Suite is live — create, publish & grow from one place.
              </p>
            </div>
            <div className="flex-shrink-0">
              {/* Notifications moved to TopBar */}
            </div>
          </div>
        </motion.header>

        {/* Marketing Suite Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6 sm:mb-8 p-5 sm:p-8 rounded-3xl overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 dark:from-purple-950 dark:via-indigo-950 dark:to-purple-900"
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 right-24 w-48 h-48 rounded-full bg-pink-400/20 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src="/ainos-robot.png"
              alt="AINOS Assistant"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg ring-2 ring-white/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-purple-200 mb-1">AINOS Marketing Suite</p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Everything you need to market your business</h2>
              <p className="text-sm text-purple-100/90 mb-4 max-w-2xl">
                Social captions, SEO audits, AI blogs and branded invitations — pick a tool below and start growing.
              </p>
              <div className="flex flex-wrap gap-2">
                {marketingTools.map((tool) => (
                  <Link key={tool.href} href={tool.href}>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-colors">
                      <tool.icon className="w-3.5 h-3.5" />
                      {tool.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Combined Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
          {allStats.map((stat: StatCard, i: number) => (
            <StatItem key={stat.label} stat={stat} delay={0.15 + i * 0.05} />
          ))}
        </div>

        {/* Finance Suite Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mb-6 sm:mb-8 p-5 sm:p-8 rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:from-indigo-950 dark:via-blue-950 dark:to-cyan-900"
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 right-24 w-48 h-48 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30">
              <ScrollText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-200 mb-1">AINOS Finance Suite</p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Complete billing & accounting for your business</h2>
              <p className="text-sm text-blue-100/90 mb-4 max-w-2xl">
                GST invoices, delivery challans, Tally export, payment reminders & branded templates — Vyapar-level features, zero cost.
              </p>
              <div className="flex flex-wrap gap-2">
                {financeTools.slice(0, 6).map((tool) => (
                  <Link key={tool.href} href={tool.href}>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-colors">
                      <tool.icon className="w-3.5 h-3.5" />
                      {tool.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Finance Tools */}
        <SectionHeader title="Your Finance Tools" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-10">
          {financeTools.map((tool, i) => (
            <ToolCard key={tool.title} tool={tool} delay={0.3 + i * 0.05} />
          ))}
        </div>

        {/* Marketing Tools */}
        <SectionHeader title="Your Marketing Tools" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {marketingTools.map((tool, i) => (
            <ToolCard key={tool.title} tool={tool} delay={0.4 + i * 0.06} />
          ))}
        </div>
      </div>
    </div>
  );
}
