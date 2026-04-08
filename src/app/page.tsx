'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, FileText, Users, TrendingUp, 
  Plus, ArrowRight, Activity, DollarSign 
} from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  status: string;
  totalAmount: number;
}

interface DashboardStats {
  totalAutomations: number;
  totalInvoices: number;
  totalCustomers: number;
  totalRevenue: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAutomations: 5,
    totalInvoices: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/customers'),
      ]);

      const invoices: Invoice[] = invoicesRes.ok ? await invoicesRes.json() : [];
      const customers = customersRes.ok ? await customersRes.json() : [];

      const revenue = invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      setStats({
        totalAutomations: 5,
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Active Automations', 
      value: stats.totalAutomations.toString(), 
      icon: Sparkles, 
      gradient: 'from-violet-500 to-purple-600',
      bgGlow: 'bg-violet-500/10'
    },
    { 
      label: 'Invoices', 
      value: stats.totalInvoices.toString(), 
      icon: FileText, 
      gradient: 'from-emerald-500 to-teal-600',
      bgGlow: 'bg-emerald-500/10'
    },
    { 
      label: 'Customers', 
      value: stats.totalCustomers.toString(), 
      icon: Users, 
      gradient: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-amber-500/10'
    },
    { 
      label: 'Revenue', 
      value: `$${stats.totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      gradient: 'from-rose-500 to-pink-600',
      bgGlow: 'bg-rose-500/10'
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: 'var(--page-gradient)' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
              Dashboard
            </h1>
            <p className="text-sm sm:text-base mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Welcome back! Here&apos;s what&apos;s happening with your business.
            </p>
          </div>
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{ 
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)'
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Billing Suit</span>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-card p-4 sm:p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {stat.label}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500 text-xs font-medium">+12%</span>
                    </div>
                  </div>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bgGlow} flex items-center justify-center`}>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Recent Activity
              </h2>
              <Link 
                href="/invoices" 
                className="text-sm font-medium flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: 'hsl(var(--primary))' }}
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { 
                  title: 'New invoice created', 
                  desc: 'Invoice #INV-001 for $1,250', 
                  time: '2 min ago', 
                  icon: FileText,
                  color: 'from-violet-500 to-purple-600',
                  bgColor: 'bg-violet-500/10'
                },
                { 
                  title: 'Payment received', 
                  desc: '$850 from John Smith', 
                  time: '1 hour ago', 
                  icon: DollarSign,
                  color: 'from-emerald-500 to-teal-600',
                  bgColor: 'bg-emerald-500/10'
                },
                { 
                  title: 'New customer added', 
                  desc: 'Sarah Johnson joined', 
                  time: '3 hours ago', 
                  icon: Users,
                  color: 'from-amber-500 to-orange-600',
                  bgColor: 'bg-amber-500/10'
                },
                { 
                  title: 'Automation triggered', 
                  desc: 'Invoice reminder sent', 
                  time: '5 hours ago', 
                  icon: Sparkles,
                  color: 'from-rose-500 to-pink-600',
                  bgColor: 'bg-rose-500/10'
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-[hsl(var(--muted))] cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate" style={{ color: 'hsl(var(--foreground))' }}>
                      {item.title}
                    </h3>
                    <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {item.desc}
                    </p>
                  </div>
                  <span className="text-xs whitespace-nowrap" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {item.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="glass-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                Quick Actions
              </h2>
              <div className="space-y-2">
                {[
                  { 
                    label: 'Create Invoice', 
                    desc: 'Generate a new invoice',
                    icon: FileText, 
                    href: '/invoices/new',
                    color: 'from-violet-500 to-purple-600',
                    bgColor: 'bg-violet-500/10'
                  },
                  { 
                    label: 'Add Customer', 
                    desc: 'Create new customer',
                    icon: Users, 
                    href: '/customers',
                    color: 'from-emerald-500 to-teal-600',
                    bgColor: 'bg-emerald-500/10'
                  },
                  { 
                    label: 'Automations', 
                    desc: 'Manage auto-tasks',
                    icon: Sparkles, 
                    href: '/automations',
                    color: 'from-amber-500 to-orange-600',
                    bgColor: 'bg-amber-500/10'
                  },
                ].map((action, index) => (
                  <Link key={action.label} href={action.href}>
                    <motion.div 
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[hsl(var(--muted))] cursor-pointer group"
                    >
                      <div className={`w-10 h-10 rounded-xl ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                          <action.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {action.label}
                        </p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {action.desc}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="glass-card-subtle p-5">
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                System Status
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'API Status', status: 'Operational', color: 'bg-emerald-500' },
                  { label: 'Automations', status: 'Running', color: 'bg-emerald-500' },
                  { label: 'Email Service', status: 'Connected', color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {item.label}
                    </span>
                    <span className="flex items-center gap-2 text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.color} animate-pulse`} />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
