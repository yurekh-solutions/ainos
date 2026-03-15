'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  FileText, Users, Package, DollarSign, TrendingUp, Plus, ArrowRight,
  Clock, CheckCircle2, AlertCircle, Sparkles, Activity, ArrowUpRight,
  Receipt, UserPlus, BoxIcon, Zap, Calendar, Target, Wallet, CreditCard,
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

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0, totalCustomers: 0, totalProducts: 0,
    totalRevenue: 0, pendingInvoices: 0, paidInvoices: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [invoicesRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/invoices'), fetch('/api/customers'), fetch('/api/products'),
      ]);
      const invoices: Invoice[] = invoicesRes.ok ? await invoicesRes.json() : [];
      const customers = customersRes.ok ? await customersRes.json() : [];
      const products = productsRes.ok ? await productsRes.json() : [];
      const revenue = invoices.filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
      setStats({
        totalInvoices: invoices.length, totalCustomers: customers.length,
        totalProducts: products.length, totalRevenue: revenue,
        pendingInvoices: invoices.filter((inv) => inv.status === 'pending').length,
        paidInvoices: invoices.filter((inv) => inv.status === 'paid').length,
      });
      setRecentInvoices(invoices.slice(0, 5));
      setAllInvoices(invoices);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  // Generate real chart data from invoices
  const monthlyData = allInvoices.reduce((acc: Record<string, { month: string; revenue: number; invoices: number }>, inv) => {
    const date = new Date(inv.createdAt);
    const month = date.toLocaleString('default', { month: 'short' });
    if (!acc[month]) acc[month] = { month, revenue: 0, invoices: 0 };
    acc[month].invoices += 1;
    if (inv.status === 'paid') acc[month].revenue += inv.totalAmount || 0;
    return acc;
  }, {});
  const revenueData = Object.values(monthlyData).slice(-6);

  // Weekly data (last 7 days)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = days.map(day => ({ day, amount: 0 }));
  allInvoices.forEach(inv => {
    const date = new Date(inv.createdAt);
    const dayIndex = date.getDay();
    if (inv.status === 'paid') {
      weeklyData[dayIndex].amount += inv.totalAmount || 0;
    }
  });

  const pieData = [
    { name: 'Paid', value: stats.paidInvoices || 1, color: '#10b981' },
    { name: 'Pending', value: stats.pendingInvoices || 1, color: '#f59e0b' },
    { name: 'Draft', value: Math.max(1, stats.totalInvoices - stats.paidInvoices - stats.pendingInvoices), color: '#6366f1' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
          <Zap className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">{getGreeting()}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Welcome, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{session?.user?.name?.split(' ')[0] || 'User'}</span>
            </h1>
          </div>
          <Link href="/invoices/new">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white text-sm font-medium shadow-lg shadow-indigo-500/25">
              <Plus className="w-4 h-4" /> New Invoice
            </motion.button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: Wallet, gradient: 'from-emerald-500 to-teal-500', change: '+12.5%' },
            { label: 'Invoices', value: stats.totalInvoices, icon: FileText, gradient: 'from-indigo-500 to-purple-500', change: '+8.2%' },
            { label: 'Customers', value: stats.totalCustomers, icon: Users, gradient: 'from-pink-500 to-rose-500', change: '+15.3%' },
            { label: 'Products', value: stats.totalProducts, icon: Package, gradient: 'from-amber-500 to-orange-500', change: '+4.1%' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 group hover:bg-white/10 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/50 text-xs font-medium uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 text-xs">{stat.change}</span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-50`} />
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="lg:col-span-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" /> Revenue Overview
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Revenue</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Invoices</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Line type="monotone" dataKey="invoices" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', strokeWidth: 0, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-pink-400" /> Invoice Status
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-white/60">{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Weekly Bar Chart & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="lg:col-span-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" /> Weekly Performance
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((item: { day: string; amount: number }, index: number) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Create Invoice', icon: Receipt, href: '/invoices/new', gradient: 'from-indigo-500 to-purple-500' },
                { label: 'Add Customer', icon: UserPlus, href: '/customers', gradient: 'from-pink-500 to-rose-500' },
                { label: 'Add Product', icon: BoxIcon, href: '/products', gradient: 'from-amber-500 to-orange-500' },
                { label: 'View Reports', icon: CreditCard, href: '/reports', gradient: 'from-emerald-500 to-teal-500' },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/70 text-sm group-hover:text-white transition-colors">{action.label}</span>
                    <ArrowRight className="w-4 h-4 text-white/30 ml-auto group-hover:text-white/60 transition-colors" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Invoices */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" /> Recent Invoices
            </h3>
            <Link href="/invoices" className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {recentInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-white/40 text-xs uppercase tracking-wide">
                    <th className="text-left py-2 px-3">Invoice</th>
                    <th className="text-left py-2 px-3">Customer</th>
                    <th className="text-left py-2 px-3">Amount</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice._id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 text-white text-sm font-medium">{invoice.invoiceNumber}</td>
                      <td className="py-3 px-3 text-white/60 text-sm">{invoice.customer?.name || 'N/A'}</td>
                      <td className="py-3 px-3 text-white text-sm">${invoice.totalAmount.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize border ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-white/40 text-sm">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">No invoices yet</p>
              <Link href="/invoices/new" className="text-indigo-400 text-sm hover:underline">Create your first invoice</Link>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
