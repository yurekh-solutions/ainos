'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Search, Mail, Phone, MapPin, X, TrendingUp, UserPlus, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Customer } from '@/types/customer';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      if (res.ok) {
        setNewCustomer({ name: '', email: '', phone: '', address: '' });
        setShowForm(false);
        fetchCustomers();
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCustomers = customers.filter((c, i) => i % 2 === 0).length || customers.length;
  const newThisMonth = customers.filter(c => {
    const created = new Date(c.createdAt || Date.now());
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const companies = customers.filter(c => c.name?.includes('Inc') || c.name?.includes('Corp') || c.name?.includes('Ltd')).length;

  const customerData = [
    { name: 'Active', value: activeCustomers || 1, color: '#10b981' },
    { name: 'Regular', value: Math.max(1, customers.length - activeCustomers), color: '#6366f1' },
  ];

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Customers</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage your customer database</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all"
            style={{ 
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)'
            }}
          >
            <Plus className="w-4 h-4" /> Add Customer
          </motion.button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Customers', value: customers.length, icon: Users, gradient: 'from-violet-500 to-purple-600', bgGlow: 'bg-violet-500/10' },
            { label: 'Active', value: activeCustomers, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600', bgGlow: 'bg-emerald-500/10' },
            { label: 'New This Month', value: newThisMonth, icon: UserPlus, gradient: 'from-rose-500 to-pink-600', bgGlow: 'bg-rose-500/10' },
            { label: 'Companies', value: companies, icon: Building2, gradient: 'from-amber-500 to-orange-600', bgGlow: 'bg-amber-500/10' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative p-5 rounded-2xl overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
                border: '1px solid hsl(var(--border) / 0.5)',
                boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
              }}
            >
              {/* Gradient Accent Bar */}
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.gradient} rounded-l-2xl`} />
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
                  <p className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
                </div>
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  className={`w-12 h-12 rounded-xl ${stat.bgGlow} flex items-center justify-center`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chart & Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Pie Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-6 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
              border: '1px solid hsl(var(--border) / 0.5)',
              boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
            }}
          >
            <h3 className="font-bold mb-5 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-4 h-4 text-white" />
              </div>
              Customer Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={customerData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" stroke="none">
                  {customerData.map((_, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
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
            <div className="flex justify-center gap-4 mt-3">
              {customerData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: COLORS[i] }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="lg:col-span-2 p-6 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
              border: '1px solid hsl(var(--border) / 0.5)',
              boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
            }}
          >
            <h3 className="font-bold mb-5 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              Recent Activity
            </h3>
            <div className="space-y-3">
              {customers.slice(0, 4).map((customer, i) => (
                <motion.div 
                  key={customer.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer"
                  style={{ background: 'hsl(var(--muted) / 0.5)' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                    {customer.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{customer.name}</p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Added recently</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ 
                      background: 'hsl(142 76% 36% / 0.1)',
                      color: 'hsl(142 76% 36%)'
                    }}>
                    + New
                  </span>
                </motion.div>
              ))}
              {customers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No customers yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <div className="p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
            border: '1px solid hsl(var(--border) / 0.5)',
            boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
          }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass-input pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Add Customer Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95 }} 
                animate={{ scale: 1 }} 
                exit={{ scale: 0.95 }}
                className="w-full max-w-md glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Add New Customer</h3>
                  <button 
                    onClick={() => setShowForm(false)} 
                    className="p-1.5 rounded-lg transition-colors hover:bg-[hsl(var(--muted))]"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Name *" 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 text-sm"
                    required 
                  />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 text-sm"
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone" 
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 text-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="Address" 
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 text-sm"
                  />
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="submit" 
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all"
                      style={{ 
                        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                        boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)'
                      }}
                    >
                      Save Customer
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)} 
                      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ 
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--foreground))'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customers Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" 
              style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 p-8 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
                }}>
                <Users className="w-12 h-12 mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p style={{ color: 'hsl(var(--foreground))' }}>No customers found</p>
                <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Add your first customer to get started</p>
              </div>
            ) : (
              filteredCustomers.map((customer, index) => (
                <motion.div 
                  key={customer.id || index}
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="relative p-5 rounded-2xl group"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
                    border: '1px solid hsl(var(--border) / 0.5)',
                    boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)',
                  }}
                >
                  {/* Gradient Accent Bar */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-purple-600 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>
                        <span className="text-white font-bold text-lg">{customer.name[0]}</span>
                      </motion.div>
                      <div>
                        <p className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>{customer.name}</p>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ 
                            background: 'hsl(142 76% 36% / 0.1)',
                            color: 'hsl(142 76% 36%)'
                          }}>
                          Active Customer
                        </span>
                      </div>
                    </div>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <Phone className="w-3.5 h-3.5" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
