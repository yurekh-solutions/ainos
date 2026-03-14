'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FileText,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Receipt,
  UserPlus,
  BoxIcon,
  Zap,
} from 'lucide-react';

interface DashboardStats {
  totalInvoices: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customer?: { name: string };
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [invoicesRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/customers'),
        fetch('/api/products'),
      ]);

      const invoices = invoicesRes.ok ? await invoicesRes.json() : [];
      const customers = customersRes.ok ? await customersRes.json() : [];
      const products = productsRes.ok ? await productsRes.json() : [];

      const revenue = invoices
        .filter((inv: Invoice) => inv.status === 'paid')
        .reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);

      const pendingInvoices = invoices.filter((inv: Invoice) => inv.status === 'pending').length;
      const paidInvoices = invoices.filter((inv: Invoice) => inv.status === 'paid').length;

      setStats({
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        totalRevenue: revenue,
        pendingInvoices,
        paidInvoices,
      });

      setRecentInvoices(invoices.slice(0, 5));
      setRecentCustomers(customers.slice(0, 5));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-500/20 to-teal-600/20',
      trend: '+12.5%',
    },
    {
      label: 'Total Invoices',
      value: stats.totalInvoices,
      icon: FileText,
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-500/20 to-purple-600/20',
      trend: '+8.2%',
    },
    {
      label: 'Customers',
      value: stats.totalCustomers,
      icon: Users,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-500/20 to-rose-600/20',
      trend: '+15.3%',
    },
    {
      label: 'Products',
      value: stats.totalProducts,
      icon: Package,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-500/20 to-orange-600/20',
      trend: '+4.1%',
    },
  ];

  const quickActions = [
    { label: 'New Invoice', icon: Receipt, href: '/invoices/new', gradient: 'from-indigo-500 to-purple-600' },
    { label: 'Add Customer', icon: UserPlus, href: '/customers', gradient: 'from-pink-500 to-rose-600' },
    { label: 'Add Product', icon: BoxIcon, href: '/products', gradient: 'from-amber-500 to-orange-600' },
    { label: 'View Reports', icon: BarChart3, href: '/reports', gradient: 'from-emerald-500 to-teal-600' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'sent': return <Send className="w-4 h-4 text-blue-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">{getGreeting()}</span>
            </motion.div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, <span className="gradient-text">{session?.user?.name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-white/60 mt-1">Here&apos;s what&apos;s happening with your business today.</p>
          </div>
          <Link href="/invoices/new">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow">
              <Plus className="w-5 h-5" />
              Create Invoice
            </motion.button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
              <Zap className="w-5 h-5 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, index) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }} whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="glass-card p-5 relative overflow-hidden group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/60 text-sm font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 text-sm font-medium">{stat.trend}</span>
                      <span className="text-white/40 text-sm">vs last month</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickActions.map((action, index) => (
                  <Link key={action.label} href={action.href}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                      className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">{action.label}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Invoices */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-2 glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    Recent Invoices
                  </h2>
                  <Link href="/invoices" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                    View All <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                {recentInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {recentInvoices.map((invoice, index) => (
                      <motion.div key={invoice._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{invoice.invoiceNumber}</p>
                            <p className="text-white/50 text-xs">{invoice.customer?.name || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-white font-medium text-sm">${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize border ${getStatusColor(invoice.status)} flex items-center gap-1`}>
                            {getStatusIcon(invoice.status)}
                            {invoice.status}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-white/30" />
                    </div>
                    <p className="text-white/50 mb-2">No invoices yet</p>
                    <Link href="/invoices/new" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">Create your first invoice</Link>
                  </div>
                )}
              </motion.div>

              {/* Invoice Stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold text-white">Invoice Status</h2>
                </div>
                <div className="space-y-4">
                  <div className="relative pt-4">
                    <div className="flex h-4 rounded-full overflow-hidden bg-white/10">
                      <motion.div initial={{ width: 0 }} animate={{ width: stats.totalInvoices > 0 ? `${(stats.paidInvoices / stats.totalInvoices) * 100}%` : '0%' }}
                        transition={{ delay: 1, duration: 0.8 }} className="bg-gradient-to-r from-emerald-500 to-teal-500" />
                      <motion.div initial={{ width: 0 }} animate={{ width: stats.totalInvoices > 0 ? `${(stats.pendingInvoices / stats.totalInvoices) * 100}%` : '0%' }}
                        transition={{ delay: 1.2, duration: 0.8 }} className="bg-gradient-to-r from-amber-500 to-orange-500" />
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-white/80 text-sm">Paid</span>
                      </div>
                      <span className="text-white font-semibold">{stats.paidInvoices}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-white/80 text-sm">Pending</span>
                      </div>
                      <span className="text-white font-semibold">{stats.pendingInvoices}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        <span className="text-white/80 text-sm">Total</span>
                      </div>
                      <span className="text-white font-semibold">{stats.totalInvoices}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Customers */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-400" />
                  Recent Customers
                </h2>
                <Link href="/customers" className="flex items-center gap-1 text-pink-400 hover:text-pink-300 text-sm font-medium transition-colors">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {recentCustomers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {recentCustomers.map((customer, index) => (
                    <motion.div key={customer._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + index * 0.1 }} className="flex flex-col items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-3">
                        <span className="text-white font-semibold text-lg">{customer.name[0].toUpperCase()}</span>
                      </div>
                      <p className="text-white font-medium text-sm truncate w-full">{customer.name}</p>
                      <p className="text-white/50 text-xs truncate w-full">{customer.email}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-white/30" />
                  </div>
                  <p className="text-white/50 mb-2">No customers yet</p>
                  <Link href="/customers" className="text-pink-400 hover:text-pink-300 text-sm font-medium">Add your first customer</Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
