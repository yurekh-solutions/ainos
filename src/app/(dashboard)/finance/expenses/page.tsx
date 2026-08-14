'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, TrendingUp, Filter, Search, Calendar } from 'lucide-react';

interface Expense { _id: string; title: string; amount: number; category: string; date: string; vendor?: string; description?: string; status: string; createdAt: string; }

const statusColors: Record<string, string> = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', reimbursed: '#6c5ce7' };
const categories = ['Travel', 'Food', 'Office Supplies', 'Software', 'Marketing', 'Utilities', 'Rent', 'Salary', 'Other'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [form, setForm] = useState({ title: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], vendor: '', description: '' });

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (res.ok) setExpenses(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (res.ok) { setForm({ title: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], vendor: '', description: '' }); setShowForm(false); fetchExpenses(); }
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/expenses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      fetchExpenses();
    } catch (e) { console.error(e); }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchCategory = filterCategory === 'all' || e.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const stats = {
    total: expenses.reduce((sum, e) => sum + e.amount, 0),
    pending: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
    approved: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
    count: expenses.length,
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Expenses</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Track and manage business expenses</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Add Expense
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Expenses', value: `Rs.${stats.total.toLocaleString('en-IN')}`, gradient: 'from-violet-500 to-purple-600' },
            { label: 'Pending', value: `Rs.${stats.pending.toLocaleString('en-IN')}`, gradient: 'from-amber-500 to-orange-600' },
            { label: 'Approved', value: `Rs.${stats.approved.toLocaleString('en-IN')}`, gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Total Count', value: stats.count, gradient: 'from-blue-500 to-cyan-600' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }} className="relative p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.gradient} rounded-l-2xl`} />
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input type="text" placeholder="Search expenses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass-input pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="glass-input px-4 py-2.5 text-sm rounded-xl">
            <option value="all">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="reimbursed">Reimbursed</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="glass-input px-4 py-2.5 text-sm rounded-xl">
            <option value="all">All Categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Expenses Table */}
        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filteredExpenses.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)' }}>
              <DollarSign className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p style={{ color: 'hsl(var(--foreground))' }}>No expenses found</p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id} style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }} className="hover:opacity-80 transition-opacity">
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{expense.title}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{expense.category}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>Rs.{expense.amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(expense.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: statusColors[expense.status] }}>{expense.status}</span></td>
                      <td className="px-4 py-3">
                        <select value={expense.status} onChange={(e) => updateStatus(expense._id, e.target.value)}
                          className="text-[10px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer" style={{ background: 'hsl(var(--muted))', color: statusColors[expense.status] }}>
                          <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="reimbursed">Reimbursed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {/* Add Expense Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-md p-6 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 20px 60px -10px rgb(0 0 0 / 0.3)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Expense</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input required placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="number" placeholder="Amount *" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input placeholder="Vendor" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" rows={3} />
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Add Expense</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
