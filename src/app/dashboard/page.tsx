'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Radio, FileText, Zap, ArrowRight,
  ScrollText, Contact2, Boxes, BarChart3, Hourglass, BadgePercent, FileBarChart,
  Truck, FileSpreadsheet, BellRing, Paintbrush, Hash, SearchCheck, PenTool, Bot, MailOpen, Share2, Layers,
  Plus, TrendingUp, Users, Calendar, Clock, CheckCircle2, Circle, Sparkles, Megaphone, Receipt, Wallet,
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
          className="relative mb-6 sm:mb-8 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 40%, #4c1d95 70%, #6d28d9 100%)',
          }}
        >
          {/* Animated Gradient Orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-50"
              style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(60px)' }}
            />
            <motion.div
              animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-32 right-20 w-96 h-96 rounded-full opacity-40"
              style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(80px)' }}
            />
            <motion.div
              animate={{ x: [0, 15, 0], y: [0, 15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full opacity-30"
              style={{ background: 'radial-gradient(circle, #c084fc 0%, transparent 70%)', filter: 'blur(50px)' }}
            />
          </div>

          {/* Shimmer Effect */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute top-0 left-0 w-1/2 h-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
              }}
            />
          </div>

          {/* Dot Grid Pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />

          {/* Content */}
          <div className="relative p-6 sm:p-10">
            {/* Top Row: Badge + Stats */}
            <div className="flex items-center justify-between mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/90">AINOS Marketing Suite</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden sm:flex items-center gap-3 px-5 py-2.5 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Active Tools</p>
                  <p className="text-xl font-bold text-white">{marketingTools.length}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Status</p>
                  <p className="text-sm font-semibold text-emerald-400">Live</p>
                </div>
              </motion.div>
            </div>

            {/* Main Heading */}
            <div className="mb-6">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-[1.1] tracking-tight"
              >
                Everything you need to
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #f5f3ff 0%, #c4b5fd 30%, #f0abfc 60%, #fbbf24 100%)',
                  }}
                >
                  market your business
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-sm sm:text-base text-white/60 max-w-2xl leading-relaxed font-light"
              >
                Social captions, SEO audits, AI blogs and branded invitations — pick a tool below and start growing.
              </motion.p>
            </div>

            {/* Tool Buttons */}
            <div className="flex flex-wrap gap-2.5">
              {marketingTools.map((tool, idx) => (
                <Link key={tool.href} href={tool.href}>
                  <motion.span
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.06, type: 'spring', stiffness: 200 }}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/90 transition-all cursor-pointer"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.2)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.4)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(124,58,237,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <tool.icon className="w-4 h-4" />
                    {tool.title}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </motion.span>
                </Link>
              ))}
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

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {[
            { icon: Plus, label: 'New Invoice', href: '/invoices', gradient: 'from-violet-500 to-purple-600' },
            { icon: Users, label: 'Add Customer', href: '/customers', gradient: 'from-cyan-500 to-blue-600' },
            { icon: Megaphone, label: 'Create Caption', href: '/marketing/email', gradient: 'from-pink-500 to-rose-600' },
            { icon: Sparkles, label: 'AI Blog Post', href: '/marketing/blog', gradient: 'from-amber-500 to-orange-600' },
          ].map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              whileHover={{ y: -3 }}
            >
              <Link href={action.href} className="block p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-all group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-900">{action.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Getting Started Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8 sm:mb-10 p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Getting Started</h3>
              <p className="text-xs text-gray-500">Complete these steps to set up your workspace</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {[
              { label: 'Create your first invoice', href: '/invoices', done: financeStats.invoices > 0 },
              { label: 'Add a customer profile', href: '/customers', done: false },
              { label: 'Set up your company details', href: '/company', done: false },
              { label: 'Generate a social media caption', href: '/marketing/email', done: false },
            ].map((item, i) => (
              <Link key={item.label} href={item.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                {item.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 group-hover:text-purple-400 transition-colors" />
                )}
                <span className={`text-sm ${item.done ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>{item.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 sm:mb-10 p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
                <p className="text-xs text-gray-500">Your latest actions across AINOS</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: Receipt, text: 'Invoice system ready', time: 'Just now', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { icon: Megaphone, text: 'Marketing Suite activated', time: 'Just now', color: 'text-purple-500', bg: 'bg-purple-50' },
              { icon: Wallet, text: 'Finance dashboard configured', time: 'Just now', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: TrendingUp, text: 'SEO audit score: 92/100', time: 'Today', color: 'text-amber-500', bg: 'bg-amber-50' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50">
                <div className={`w-8 h-8 rounded-lg ${activity.bg} flex items-center justify-center flex-shrink-0`}>
                  <activity.icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{activity.text}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
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
