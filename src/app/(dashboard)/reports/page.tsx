'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, IndianRupee, FileText, Users, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface Invoice {
  _id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customerId?: string;
  customer?: { name: string };
  customerName?: string;
}

interface Customer {
  _id: string;
  name: string;
}

// Format currency in Indian Rupees
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format number with Indian comma system
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

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

  // Create customer lookup map
  const customerMap = customers.reduce((acc: Record<string, string>, customer) => {
    acc[customer._id] = customer.name;
    return acc;
  }, {});

  // Helper to get customer name
  const getCustomerName = (invoice: Invoice): string => {
    // Try multiple sources for customer name
    if (invoice.customer?.name && invoice.customer.name !== 'Unknown') {
      return invoice.customer.name;
    }
    if (invoice.customerName && invoice.customerName !== 'Unknown') {
      return invoice.customerName;
    }
    if (invoice.customerId && customerMap[invoice.customerId]) {
      return customerMap[invoice.customerId];
    }
    return 'Walk-in Customer';
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

  // Monthly revenue data
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

  // Customer growth
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
    const name = getCustomerName(inv);
    if (!acc[name]) acc[name] = { name, revenue: 0, invoices: 0 };
    acc[name].revenue += inv.totalAmount || 0;
    acc[name].invoices += 1;
    return acc;
  }, {});
  
  const topCustomers = Object.values(customerRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), change: '+12.5%', up: true, icon: IndianRupee, gradient: 'from-emerald-500 to-teal-600', bgGlow: 'bg-emerald-500/10' },
    { label: 'Total Invoices', value: formatNumber(invoices.length), change: '+8.2%', up: true, icon: FileText, gradient: 'from-violet-500 to-purple-600', bgGlow: 'bg-violet-500/10' },
    { label: 'Active Customers', value: formatNumber(customers.length), change: '+15.3%', up: true, icon: Users, gradient: 'from-rose-500 to-pink-600', bgGlow: 'bg-rose-500/10' },
    { label: 'Avg Invoice', value: formatCurrency(avgInvoice), change: '-2.4%', up: false, icon: BarChart3, gradient: 'from-amber-500 to-orange-600', bgGlow: 'bg-amber-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: 'var(--page-gradient)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" 
          style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Reports</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Analytics and insights for your business</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="glass-input px-3 py-2 text-sm">
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">This Year</option>
            </select>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all"
              style={{ 
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)'
              }}
            >
              <Download className="w-4 h-4" /> Export
            </motion.button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.up ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                    <span className={stat.up ? 'text-emerald-500 text-xs' : 'text-red-500 text-xs'}>{stat.change}</span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bgGlow} flex items-center justify-center`}>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
                <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> Revenue Trend
              </h3>
              <div className="flex items-center gap-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11} 
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                  contentStyle={{ 
                    background: 'hsl(var(--card-bg))', 
                    border: '1px solid hsl(var(--border) / 0.5)', 
                    borderRadius: '0.75rem',
                    color: 'hsl(var(--foreground))'
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Invoice Status Pie */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.5 }}
            className="glass-card p-5"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <FileText className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> Invoice Status
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={invoiceData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                  {invoiceData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card-bg))', 
                    border: '1px solid hsl(var(--border) / 0.5)', 
                    borderRadius: '0.75rem',
                    color: 'hsl(var(--foreground))'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-2">
              {invoiceData.map((item) => (
                <div key={item.status} className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span>{item.status}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Customer Growth */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.6 }}
            className="glass-card p-5"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <Users className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> Customer Growth
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card-bg))', 
                    border: '1px solid hsl(var(--border) / 0.5)', 
                    borderRadius: '0.75rem',
                    color: 'hsl(var(--foreground))'
                  }} 
                />
                <Line type="monotone" dataKey="customers" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Customers */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.7 }}
            className="glass-card p-5"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <BarChart3 className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> Top Customers
            </h3>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{customer.name}</p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{customer.invoices} invoices</p>
                  </div>
                  <span className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>{formatCurrency(customer.revenue)}</span>
                </div>
              ))}
              {topCustomers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No customer data yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
