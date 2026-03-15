'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, FileText, Users, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface Invoice {
  status: string;
  totalAmount: number;
  createdAt: string;
  customer?: { name: string };
}

interface Customer {
  _id: string;
  name: string;
}

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/customers'),
      ]);

      const invoicesData = invoicesRes.ok ? await invoicesRes.json() : [];
      const customersData = customersRes.ok ? await customersRes.json() : [];

      setInvoices(invoicesData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate real stats
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;
  const pendingCount = invoices.filter(inv => inv.status === 'pending').length;
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
  const avgInvoice = invoices.length > 0 
    ? Math.round(invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) / invoices.length)
    : 0;

  // Monthly revenue data (group by month)
  const monthlyData = invoices.reduce((acc: Record<string, { month: string; revenue: number; expenses: number }>, inv) => {
    const date = new Date(inv.createdAt);
    const month = date.toLocaleString('default', { month: 'short' });
    if (!acc[month]) acc[month] = { month, revenue: 0, expenses: 0 };
    if (inv.status === 'paid') acc[month].revenue += inv.totalAmount || 0;
    return acc;
  }, {});
  const revenueData = Object.values(monthlyData).slice(-6);

  // Invoice status data
  const invoiceData = [
    { status: 'Paid', value: paidCount || 1, color: '#10b981' },
    { status: 'Pending', value: pendingCount || 0, color: '#f59e0b' },
    { status: 'Overdue', value: overdueCount || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Customer growth (mock based on actual customer count)
  const customerGrowth = [
    { month: 'Jan', customers: Math.max(0, customers.length - 20) },
    { month: 'Feb', customers: Math.max(0, customers.length - 15) },
    { month: 'Mar', customers: Math.max(0, customers.length - 10) },
    { month: 'Apr', customers: Math.max(0, customers.length - 5) },
    { month: 'May', customers: Math.max(0, customers.length - 2) },
    { month: 'Jun', customers: customers.length },
  ];

  // Top customers by revenue
  const customerRevenue = invoices.reduce((acc: Record<string, { name: string; revenue: number; invoices: number }>, inv) => {
    const name = inv.customer?.name || 'Unknown';
    if (!acc[name]) acc[name] = { name, revenue: 0, invoices: 0 };
    acc[name].revenue += inv.totalAmount || 0;
    acc[name].invoices += 1;
    return acc;
  }, {});
  const topCustomers = Object.values(customerRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+12.5%', up: true, icon: DollarSign, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Total Invoices', value: invoices.length.toString(), change: '+8.2%', up: true, icon: FileText, gradient: 'from-indigo-500 to-purple-500' },
    { label: 'Active Customers', value: customers.length.toString(), change: '+15.3%', up: true, icon: Users, gradient: 'from-pink-500 to-rose-500' },
    { label: 'Avg Invoice', value: `$${avgInvoice}`, change: '-2.4%', up: false, icon: BarChart3, gradient: 'from-amber-500 to-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="text-white/50 text-sm">Analytics and insights for your business</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="30" className="bg-slate-900">Last 30 days</option>
              <option value="90" className="bg-slate-900">Last 90 days</option>
              <option value="365" className="bg-slate-900">This Year</option>
            </select>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white text-sm font-medium shadow-lg shadow-cyan-500/25">
              <Download className="w-4 h-4" /> Export
            </motion.button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 group hover:bg-white/10 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/50 text-xs font-medium uppercase">{stat.label}</p>
                  <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.up ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                    <span className={stat.up ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>{stat.change}</span>
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
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Revenue vs Expenses
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Expenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Invoice Status Pie */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Invoice Status
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={invoiceData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                  {invoiceData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-2">
              {invoiceData.map((item) => (
                <div key={item.status} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-white/60">{item.status}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Customer Growth */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-400" /> Customer Growth
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="customers" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', strokeWidth: 0, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Customers */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" /> Top Customers
            </h3>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{customer.name}</p>
                    <p className="text-white/40 text-xs">{customer.invoices} invoices</p>
                  </div>
                  <span className="text-white font-medium text-sm">${customer.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
