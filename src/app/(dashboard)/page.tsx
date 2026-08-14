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
    active: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-500/20', label: 'Active' },
    expired: { bg: 'bg-amber-500/10 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-500/20', label: 'Expired' },
    locked: { bg: 'bg-gray-500/10 dark:bg-gray-500/15', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400', border: 'border-gray-500/20', label: 'Locked' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--page-gradient)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-2 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Greeting Header */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {getGreeting()}, <span style={{ color: 'hsl(var(--foreground-muted))' }}>{session?.user?.name?.split(' ')[0] || 'User'}</span>.
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Your ecosystem is running smoothly. {stats.totalInvoices} active tools, {stats.pendingInvoices} alerts.
          </p>
        </motion.header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'System Health', value: '100%', sub: 'All systems operational', icon: Activity, color: '#00b894', gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Active Users', value: `${stats.totalCustomers}`, sub: `Across ${Math.ceil(stats.totalInvoices / 5)} tools`, icon: Users, color: '#6c5ce7', gradient: 'from-violet-500 to-purple-600' },
            { label: 'AI Operations', value: `${(stats.totalInvoices * 10).toLocaleString()}`, sub: 'Tasks automated this week', icon: Sparkles, color: '#6c5ce7', gradient: 'from-purple-500 to-indigo-600' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="relative p-6 rounded-2xl overflow-hidden group"
              style={{ 
                background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
                border: '1px solid hsl(var(--border) / 0.5)',
                boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
              }}>
              {/* Animated Background Icon */}
              <motion.div 
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-0 right-0 w-36 h-36 -translate-y-6 translate-x-6 opacity-10 group-hover:opacity-20 transition-opacity"
              >
                <stat.icon className="w-full h-full" style={{ color: stat.color }} />
              </motion.div>
              
              {/* Gradient Accent Bar */}
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.gradient} rounded-l-2xl`} />
              
              {/* Content */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </motion.div>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
                </div>
                <p className="text-4xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
                <p className="text-xs font-medium" style={{ color: stat.color }}>{stat.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Apps & ERPs Section */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Your Apps & ERPs</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}><span className="w-2 h-2 rounded-full bg-emerald-500" /> Active</span>
            <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}><span className="w-2 h-2 rounded-full bg-amber-500" /> Expired</span>
            <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}><Lock className="w-3 h-3" /> Locked</span>
          </div>
        </div>

        {/* App Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {appCards.map((app, i) => {
            const Icon = app.icon;
            const status = statusConfig[app.status];
            const isLocked = app.status === 'locked';
            const isExpired = app.status === 'expired';

            return (
              <motion.div 
                key={app.title} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.15 + i * 0.04 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="relative p-6 rounded-2xl flex flex-col h-full group overflow-hidden"
                style={{
                  background: isExpired 
                    ? 'linear-gradient(135deg, hsl(25 60% 95%) 0%, hsl(25 40% 92%) 100%)' 
                    : 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
                  border: `1px solid ${isLocked ? 'hsl(var(--border) / 0.5)' : isExpired ? 'hsl(25 40% 85%)' : 'hsl(var(--border) / 0.5)'}`,
                  boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
                }}>

                {/* Top Row: Icon + Status */}
                <div className="flex items-start justify-between mb-5">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${app.color}20 0%, ${app.color}10 100%)`,
                      border: `1px solid ${app.color}30`,
                    }}>
                    <Icon className="w-6 h-6" style={{ color: app.color }} />
                  </motion.div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${status.bg} ${status.text} border ${status.border} backdrop-blur-sm`}>
                    {app.status === 'locked' ? <Lock className="w-3 h-3" /> : <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />}
                    {status.label}
                  </span>
                </div>

                {/* Content */}
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{app.category}</p>
                <h3 className="text-base font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>{app.title}</h3>
                <p className="text-xs leading-relaxed mb-5 flex-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{app.description}</p>

                {/* Bottom: Stat + Action */}
                {isLocked ? (
                  <div className="mt-auto">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                      style={{ 
                        background: 'linear-gradient(135deg, hsl(252 60% 55%) 0%, hsl(252 65% 65%) 100%)', 
                        boxShadow: '0 4px 14px hsl(252 60% 55% / 0.4)',
                      }}>
                      <Lock className="w-4 h-4" /> Subscribe to Unlock
                    </motion.button>
                    <p className="text-[10px] text-center mt-3 font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{app.stat}</p>
                  </div>
                ) : isExpired ? (
                  <div className="mt-auto flex items-center justify-between">
                    <p className="text-xs font-medium text-amber-600">{app.stat}</p>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-600 border-2 border-amber-500/30 hover:bg-amber-500/10 transition-all">
                      Renew
                    </motion.button>
                  </div>
                ) : (
                  <div className="mt-auto flex items-center justify-between">
                    <p className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{app.stat}</p>
                    <Link href={app.href}>
                      <motion.button 
                        whileHover={{ scale: 1.05, x: 3 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                        style={{ 
                          color: 'hsl(var(--primary))', 
                          background: 'hsl(var(--primary) / 0.1)', 
                          border: '1px solid hsl(var(--primary) / 0.2)',
                        }}>
                        Open <ArrowRight className="w-3.5 h-3.5" />
                      </motion.button>
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
