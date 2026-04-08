'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  FileText, Users, Package, Plus,
  Sparkles, Activity, ArrowUpRight, ArrowUp,
  Receipt, UserPlus, BoxIcon, Zap, Target, Wallet,
  Clock, ChevronRight, TrendingUp, CircleDot,
  CalendarDays, Bell, MoreHorizontal, Eye, Layers,
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
  customerName?: string;
  customer?: { name: string };
}

interface Customer {
  _id: string;
  name: string;
  createdAt: string;
}

interface ActivityItem {
  icon: React.ElementType;
  title: string;
  desc: string;
  time: string;
  color: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0, totalCustomers: 0, totalProducts: 0,
    totalRevenue: 0, pendingInvoices: 0, paidInvoices: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [invoicesRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/invoices'), fetch('/api/customers'), fetch('/api/products'),
      ]);
      const invoices: Invoice[] = invoicesRes.ok ? await invoicesRes.json() : [];
      const customers: Customer[] = customersRes.ok ? await customersRes.json() : [];
      const products = productsRes.ok ? await productsRes.json() : [];
      const revenue = invoices.filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
      setStats({
        totalInvoices: invoices.length, totalCustomers: customers.length,
        totalProducts: products.length, totalRevenue: revenue,
        pendingInvoices: invoices.filter((inv) => inv.status === 'pending').length,
        paidInvoices: invoices.filter((inv) => inv.status === 'paid').length,
      });
      // Sort by createdAt descending and take most recent
      const sortedInvoices = invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentInvoices(sortedInvoices.slice(0, 4));
      setAllInvoices(sortedInvoices);
      setRecentCustomers(customers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3));
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const monthlyData = allInvoices.reduce((acc: Record<string, { month: string; revenue: number }>, inv) => {
    const date = new Date(inv.createdAt);
    const month = date.toLocaleString('default', { month: 'short' });
    if (!acc[month]) acc[month] = { month, revenue: 0 };
    if (inv.status === 'paid') acc[month].revenue += inv.totalAmount || 0;
    return acc;
  }, {});
  const revenueData = Object.values(monthlyData).slice(-6);
  if (revenueData.length === 0) {
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].forEach(m => revenueData.push({ month: m, revenue: 0 }));
  }

  const pieData = [
    { name: 'Paid', value: stats.paidInvoices || 1, color: '#8B9A7B' },
    { name: 'Pending', value: stats.pendingInvoices || 1, color: '#D4A574' },
    { name: 'Draft', value: Math.max(1, stats.totalInvoices - stats.paidInvoices - stats.pendingInvoices), color: '#CDC9C5' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; dot: string }> = {
      paid: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
      overdue: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
    };
    return styles[status] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
  };

  // Generate real activity data from invoices and customers
  const generateRecentActivity = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    
    // Add recent invoices
    recentInvoices.slice(0, 2).forEach((inv) => {
      activities.push({
        icon: Receipt,
        title: 'New invoice created',
        desc: `Invoice ${inv.invoiceNumber} for ₹${inv.totalAmount?.toLocaleString('en-IN') || '0'}`,
        time: getTimeAgo(inv.createdAt),
        color: '#C17A47',
      });
    });
    
    // Add paid invoices as payment received
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid').slice(0, 2);
    paidInvoices.forEach((inv) => {
      activities.push({
        icon: Wallet,
        title: 'Payment received',
        desc: `₹${inv.totalAmount?.toLocaleString('en-IN') || '0'} from ${inv.customerName || 'Customer'}`,
        time: getTimeAgo(inv.createdAt),
        color: '#8B9A7B',
      });
    });
    
    // Add recent customers
    recentCustomers.slice(0, 2).forEach((cust) => {
      activities.push({
        icon: UserPlus,
        title: 'New customer added',
        desc: `${cust.name} joined`,
        time: getTimeAgo(cust.createdAt),
        color: '#B5A89A',
      });
    });
    
    // If no real data, show welcome message
    if (activities.length === 0) {
      activities.push({
        icon: Sparkles,
        title: 'Welcome to AIONS',
        desc: 'Start by creating your first invoice',
        time: 'Just now',
        color: '#C17A47',
      });
    }
    
    return activities.slice(0, 4);
  };

  // Helper to format time ago
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-IN');
  };

  const recentActivity = generateRecentActivity();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F8F6F3 0%, #FCFAF7 50%, #F5F1EB 100%)' }}>
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full"
            style={{ border: '3px solid #E8E0D5', borderTopColor: '#C17A47' }}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Zap className="w-6 h-6 text-[#C17A47]" />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #F8F6F3 0%, #FCFAF7 50%, #F5F1EB 100%)' }}>
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, rgba(193,122,71,0.04) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] translate-y-1/2 -translate-x-1/4"
          style={{ background: 'radial-gradient(circle, rgba(139,154,123,0.04) 0%, transparent 60%)' }} />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8"
        >
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C17A47]/8 border border-[#C17A47]/10 mb-3"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C17A47]" />
              <span className="text-xs font-semibold text-[#C17A47]">{getGreeting()}</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl sm:text-3xl font-bold text-[#3A2D24]"
            >
              Welcome back, <span className="text-[#C17A47]">{session?.user?.name?.split(' ')[0] || 'User'}</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-[#8B7355] mt-1"
            >
              Here&apos;s what&apos;s happening with your business today
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-3"
          >
            <button className="p-2.5 rounded-xl bg-white border border-[#E8E0D5] hover:border-[#C17A47]/30 transition-colors">
              <Bell className="w-5 h-5 text-[#8B7355]" />
            </button>
            <Link href="/invoices/new">
              <motion.button 
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ 
                  background: 'linear-gradient(135deg, #C17A47 0%, #A85D2D 100%)',
                  boxShadow: '0 8px 24px -6px rgba(193,122,71,0.4)'
                }}
              >
                <Plus className="w-4 h-4" /> New Invoice
              </motion.button>
            </Link>
          </motion.div>
        </motion.header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-8">
          {[
            { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: Wallet, color: '#8B9A7B', change: '+12%' },
            { label: 'Active Invoices', value: stats.totalInvoices, icon: FileText, color: '#C17A47', change: '+8%' },
            { label: 'Customers', value: stats.totalCustomers, icon: Users, color: '#B5A89A', change: '+15%' },
            { label: 'Products', value: stats.totalProducts, icon: Package, color: '#D4A574', change: '+4%' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative p-5 rounded-2xl bg-white border border-[#E8E0D5]/80 overflow-hidden group cursor-pointer"
              style={{ boxShadow: '0 4px 20px -8px rgba(82,61,46,0.08)' }}
            >
              {/* Hover gradient */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${stat.color}05 0%, transparent 60%)` }} />
              
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[#8B7355] uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#3A2D24]">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUp className="w-3.5 h-3.5" style={{ color: stat.color }} />
                    <span className="text-xs font-semibold" style={{ color: stat.color }}>{stat.change}</span>
                    <span className="text-xs text-[#A89B8C]">vs last month</span>
                  </div>
                </div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}08 100%)` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
              
              {/* Bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: stat.color, opacity: 0.3 }} />
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-6">
          
          {/* Revenue Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="xl:col-span-8 p-5 sm:p-6 rounded-2xl bg-white border border-[#E8E0D5]/80"
            style={{ boxShadow: '0 4px 20px -8px rgba(82,61,46,0.08)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(193,122,71,0.12) 0%, rgba(193,122,71,0.05) 100%)' }}>
                  <Activity className="w-5 h-5 text-[#C17A47]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#3A2D24]">Revenue Overview</h3>
                  <p className="text-xs text-[#8B7355]">Monthly revenue trend</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#C17A47]" />
                  <span className="text-[#8B7355] font-medium">Revenue</span>
                </span>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C17A47" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#C17A47" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#B5A89A" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#B5A89A" fontSize={11} tickLine={false} axisLine={false} width={40} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#fff', 
                    border: '1px solid #E8E0D5', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#C17A47" strokeWidth={2.5} fill="url(#revenueGrad)" 
                  dot={{ fill: '#C17A47', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#C17A47', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Right Column */}
          <div className="xl:col-span-4 space-y-5">
            {/* Invoice Status */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 rounded-2xl bg-white border border-[#E8E0D5]/80"
              style={{ boxShadow: '0 4px 20px -8px rgba(82,61,46,0.08)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(181,168,154,0.15) 0%, rgba(181,168,154,0.05) 100%)' }}>
                    <Target className="w-5 h-5 text-[#B5A89A]" />
                  </div>
                  <h3 className="font-semibold text-[#3A2D24]">Invoice Status</h3>
                </div>
              </div>
              
              <div className="flex items-center justify-center py-2">
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none" paddingAngle={4}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs font-medium text-[#5A4D42]">{item.name}</span>
                    <span className="text-xs text-[#A89B8C]">({item.value})</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="p-5 rounded-2xl bg-white border border-[#E8E0D5]/80"
              style={{ boxShadow: '0 4px 20px -8px rgba(82,61,46,0.08)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(212,165,116,0.15) 0%, rgba(212,165,116,0.05) 100%)' }}>
                  <Zap className="w-5 h-5 text-[#D4A574]" />
                </div>
                <h3 className="font-semibold text-[#3A2D24]">Quick Actions</h3>
              </div>
              
              <div className="space-y-2">
                {[
                  { label: 'Create Invoice', icon: Receipt, href: '/invoices/new', color: '#C17A47' },
                  { label: 'Add Customer', icon: UserPlus, href: '/customers', color: '#8B9A7B' },
                  { label: 'Automations', icon: Layers, href: '/automations', color: '#D4A574' },
                ].map((action) => (
                  <Link key={action.label} href={action.href}>
                    <motion.div 
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8F6F3] transition-colors group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${action.color}12` }}>
                        <action.icon className="w-4.5 h-4.5" style={{ color: action.color }} />
                      </div>
                      <span className="flex-1 text-sm font-medium text-[#5A4D42]">{action.label}</span>
                      <ChevronRight className="w-4 h-4 text-[#B5A89A] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 mt-6">
          
          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E8E0D5]/80"
            style={{ boxShadow: '0 4px 20px -8px rgba(82,61,46,0.08)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(139,154,123,0.15) 0%, rgba(139,154,123,0.05) 100%)' }}>
                  <Clock className="w-5 h-5 text-[#8B9A7B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#3A2D24]">Recent Activity</h3>
                  <p className="text-xs text-[#8B7355]">Latest updates</p>
                </div>
              </div>
              <Link href="/invoices" className="text-xs font-semibold text-[#C17A47] flex items-center gap-1 hover:underline">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F8F6F3] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}12` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#3A2D24] truncate">{item.title}</p>
                    <p className="text-xs text-[#8B7355] truncate">{item.desc}</p>
                  </div>
                  <span className="text-[10px] text-[#A89B8C] whitespace-nowrap">{item.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Invoices */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E8E0D5]/80"
            style={{ boxShadow: '0 4px 20px -8px rgba(82,61,46,0.08)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(193,122,71,0.12) 0%, rgba(193,122,71,0.05) 100%)' }}>
                  <FileText className="w-5 h-5 text-[#C17A47]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#3A2D24]">Recent Invoices</h3>
                  <p className="text-xs text-[#8B7355]">Your latest transactions</p>
                </div>
              </div>
              <Link href="/invoices" className="text-xs font-semibold text-[#C17A47] flex items-center gap-1 hover:underline">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            {recentInvoices.length > 0 ? (
              <div className="space-y-3">
                {recentInvoices.map((invoice, i) => {
                  const status = getStatusStyle(invoice.status);
                  return (
                    <motion.div
                      key={invoice._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F8F6F3] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#C17A47]/10">
                        <Receipt className="w-5 h-5 text-[#C17A47]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#3A2D24] truncate">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-[#8B7355] truncate">{invoice.customer?.name || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#3A2D24]">₹{invoice.totalAmount?.toLocaleString() || '0'}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {invoice.status}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-[#C17A47]/8 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-7 h-7 text-[#C17A47]/40" />
                </div>
                <p className="text-sm font-medium text-[#5A4D42]">No invoices yet</p>
                <p className="text-xs text-[#8B7355] mt-1">Create your first invoice</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* System Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-6 p-4 sm:p-5 rounded-2xl bg-white/60 border border-[#E8E0D5]/60 backdrop-blur-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-[#5A4D42]">All systems operational</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs">
              {[
                { label: 'API Status', status: 'Operational' },
                { label: 'Automations', status: 'Running' },
                { label: 'Email Service', status: 'Connected' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[#8B7355]">{item.label}</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CircleDot className="w-3 h-3" />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
