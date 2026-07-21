'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Search, Bell, ChevronDown,
  Activity, Users, Sparkles,
  TrendingUp, FileText, Target, Mail,
  Package, UserPlus, ShieldCheck, Headphones,
  BarChart3, Layers, Lock, RefreshCw,
  ArrowRight, Zap,
} from 'lucide-react';

interface DashboardStats {
  totalInvoices: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
}

interface AppCard {
  category: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  status: 'active' | 'expired' | 'locked';
  stat?: string;
  statLabel?: string;
  color: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0, totalCustomers: 0, totalProducts: 0,
    totalRevenue: 0, pendingInvoices: 0, paidInvoices: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [invoicesRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/invoices'), fetch('/api/customers'), fetch('/api/products'),
      ]);
      const invoices = invoicesRes.ok ? await invoicesRes.json() : [];
      const customers = customersRes.ok ? await customersRes.json() : [];
      const products = productsRes.ok ? await productsRes.json() : [];
      const revenue = invoices.filter((inv: { status: string }) => inv.status === 'paid')
        .reduce((sum: number, inv: { totalAmount: number }) => sum + inv.totalAmount, 0);
      setStats({
        totalInvoices: invoices.length, totalCustomers: customers.length,
        totalProducts: products.length, totalRevenue: revenue,
        pendingInvoices: invoices.filter((inv: { status: string }) => inv.status === 'pending').length,
        paidInvoices: invoices.filter((inv: { status: string }) => inv.status === 'paid').length,
      });
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const appCards: AppCard[] = [
    { category: 'INTELLIGENCE', title: 'Ainos Analytics', description: 'Deep predictive insights and unified data visualization.', icon: TrendingUp, href: '/reports', status: 'active', stat: `${stats.totalInvoices} events today`, statLabel: 'events', color: '#6c5ce7' },
    { category: 'SALES', title: 'Smart CRM', description: 'AI-driven customer relationship and pipeline management.', icon: Target, href: '/crm/contacts', status: 'active', stat: `${stats.totalCustomers} active contacts`, statLabel: 'contacts', color: '#6c5ce7' },
    { category: 'INTELLIGENCE', title: 'AI Chat Assistant', description: 'Autonomous customer support and internal query resolution.', icon: Sparkles, href: '/ai/chat', status: 'active', stat: '98% resolution rate', statLabel: 'rate', color: '#6c5ce7' },
    { category: 'MARKETING', title: 'Email Marketing', description: 'Automated campaigns with generative copywriting.', icon: Mail, href: '/marketing/email', status: 'active', stat: 'Next campaign in 2h', statLabel: 'scheduled', color: '#6c5ce7' },
    { category: 'MARKETING', title: 'Automated Blog', description: 'SEO-optimized content generation and publishing.', icon: FileText, href: '/marketing/blog', status: 'active', stat: '4 drafts ready', statLabel: 'drafts', color: '#6c5ce7' },
    { category: 'OPERATIONS', title: 'Inventory OS', description: 'Real-time stock tracking and automated reordering.', icon: Package, href: '/inventory/stock', status: 'expired', stat: 'Requires renewal', statLabel: 'expired', color: '#e17055' },
    { category: 'FINANCE', title: 'Accounting ERP', description: 'Intelligent ledger, invoicing, and financial forecasting.', icon: FileText, href: '/invoices', status: 'locked', stat: 'Starting at $49/mo', statLabel: 'price', color: '#636e72' },
    { category: 'OPERATIONS', title: 'HR & Payroll', description: 'Unified employee lifecycle and automated payroll.', icon: UserPlus, href: '/hr/employees', status: 'locked', stat: 'Starting at $49/mo', statLabel: 'price', color: '#636e72' },
    { category: 'OPERATIONS', title: 'IT Helpdesk', description: 'Internal ticketing and asset management.', icon: Headphones, href: '/support/helpdesk', status: 'locked', stat: 'Starting at $49/mo', statLabel: 'price', color: '#636e72' },
  ];

  const statusConfig = {
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-500/20', label: 'Active' },
    expired: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400', border: 'border-amber-500/20', label: 'Expired' },
    locked: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400', border: 'border-gray-500/20', label: 'Locked' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, hsl(230 20% 5%) 0%, hsl(230 20% 7%) 100%)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-2 border-[hsl(230_12%_20%)] border-t-[hsl(252_60%_55%)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, hsl(230 20% 5%) 0%, hsl(230 20% 7%) 50%, hsl(230 18% 9%) 100%)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Greeting Header */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {getGreeting()}, <span className="text-white/90">{session?.user?.name?.split(' ')[0] || 'User'}</span>.
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Your ecosystem is running smoothly. {stats.totalInvoices} active tools, {stats.pendingInvoices} alerts.
          </p>
        </motion.header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'System Health', value: '100%', sub: 'All systems operational', icon: Activity, color: '#00b894', glow: 'rgba(0,184,148,0.15)' },
            { label: 'Active Users', value: `${stats.totalCustomers}`, sub: `Across ${Math.ceil(stats.totalInvoices / 5)} tools`, icon: Users, color: '#6c5ce7', glow: 'rgba(108,92,231,0.15)' },
            { label: 'AI Operations', value: `${(stats.totalInvoices * 10).toLocaleString()}`, sub: 'Tasks automated this week', icon: Sparkles, color: '#6c5ce7', glow: 'rgba(108,92,231,0.2)' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="relative p-5 rounded-xl overflow-hidden"
              style={{ background: 'hsl(230 18% 10%)', border: '1px solid hsl(230 12% 18%)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 -translate-y-4 translate-x-4 opacity-20">
                <stat.icon className="w-full h-full" style={{ color: stat.color }} />
              </div>
              <p className="text-xs text-white/50 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: stat.color }}>{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Apps & ERPs Section */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Your Apps & ERPs</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-white/60"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Active</span>
            <span className="flex items-center gap-1.5 text-white/60"><span className="w-2 h-2 rounded-full bg-amber-400" /> Expired</span>
            <span className="flex items-center gap-1.5 text-white/60"><Lock className="w-3 h-3" /> Locked</span>
          </div>
        </div>

        {/* App Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {appCards.map((app, i) => {
            const Icon = app.icon;
            const status = statusConfig[app.status];
            const isLocked = app.status === 'locked';
            const isExpired = app.status === 'expired';

            return (
              <motion.div key={app.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
                className="relative p-5 rounded-xl flex flex-col h-full"
                style={{
                  background: isExpired ? 'linear-gradient(135deg, hsl(25 60% 12%) 0%, hsl(25 40% 8%) 100%)' : 'hsl(230 18% 10%)',
                  border: `1px solid ${isLocked ? 'hsl(230 12% 16%)' : isExpired ? 'hsl(25 40% 25%)' : 'hsl(230 12% 18%)'}`,
                }}>

                {/* Top Row: Icon + Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${app.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: app.color }} />
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text} border ${status.border}`}>
                    {app.status === 'locked' ? <Lock className="w-2.5 h-2.5" /> : <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />}
                    {status.label}
                  </span>
                </div>

                {/* Content */}
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1">{app.category}</p>
                <h3 className="text-sm font-semibold text-white mb-1.5">{app.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed mb-4 flex-1">{app.description}</p>

                {/* Bottom: Stat + Action */}
                {isLocked ? (
                  <div className="mt-auto">
                    <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, hsl(252 60% 55%) 0%, hsl(252 65% 65%) 100%)', boxShadow: '0 4px 14px hsl(252 60% 55% / 0.3)' }}>
                      <Lock className="w-3.5 h-3.5" /> Subscribe to Unlock
                    </button>
                    <p className="text-[10px] text-white/30 text-center mt-2">{app.stat}</p>
                  </div>
                ) : isExpired ? (
                  <div className="mt-auto flex items-center justify-between">
                    <p className="text-xs text-amber-400/70">{app.stat}</p>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors">
                      Renew
                    </button>
                  </div>
                ) : (
                  <div className="mt-auto flex items-center justify-between">
                    <p className="text-xs text-white/40">{app.stat}</p>
                    <Link href={app.href}>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1">
                        Open <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
