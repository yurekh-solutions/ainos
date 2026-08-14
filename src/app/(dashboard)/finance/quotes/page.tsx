'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FileText, TrendingUp, Search, Calendar, DollarSign } from 'lucide-react';

interface Quote { _id: string; quoteNumber: string; clientName: string; items: { description: string; quantity: number; rate: number }[]; subtotal: number; tax: number; discount: number; totalAmount: number; status: string; validUntil: string; notes?: string; createdAt: string; }

const statusColors: Record<string, string> = { draft: '#636e72', sent: '#0984e3', viewed: '#fdcb6e', accepted: '#00b894', rejected: '#d63031', expired: '#636e72', converted: '#6c5ce7' };

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ quoteNumber: '', clientName: '', tax: '18', discount: '0', validUntil: '', notes: '', itemDesc: '', itemQty: '1', itemRate: '' });

  useEffect(() => { fetchQuotes(); }, []);

  const fetchQuotes = async () => {
    try { const res = await fetch('/api/quotes'); if (res.ok) setQuotes(await res.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = [{ description: form.itemDesc, quantity: Number(form.itemQty), rate: Number(form.itemRate) }];
      const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
      const tax = subtotal * Number(form.tax) / 100;
      const discount = subtotal * Number(form.discount) / 100;
      const totalAmount = subtotal + tax - discount;
      const res = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, items, subtotal, tax, discount, totalAmount }) });
      if (res.ok) { setForm({ quoteNumber: '', clientName: '', tax: '18', discount: '0', validUntil: '', notes: '', itemDesc: '', itemQty: '1', itemRate: '' }); setShowForm(false); fetchQuotes(); }
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await fetch('/api/quotes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); fetchQuotes(); } catch (e) { console.error(e); }
  };

  const filtered = quotes.filter(q => {
    const matchSearch = q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) || q.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    sent: quotes.filter(q => q.status === 'sent').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    totalValue: quotes.reduce((s, q) => s + q.totalAmount, 0),
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Quotations</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Create and manage estimates & quotes</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> New Quote
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Quotes', value: stats.total, gradient: 'from-violet-500 to-purple-600' },
            { label: 'Draft', value: stats.draft, gradient: 'from-gray-500 to-slate-600' },
            { label: 'Sent', value: stats.sent, gradient: 'from-blue-500 to-cyan-600' },
            { label: 'Accepted', value: stats.accepted, gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Total Value', value: `₹${stats.totalValue.toLocaleString('en-IN')}`, gradient: 'from-amber-500 to-orange-600' },
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

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input type="text" placeholder="Search quotes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full glass-input pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="glass-input px-4 py-2.5 text-sm rounded-xl">
            <option value="all">All Status</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="viewed">Viewed</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="expired">Expired</option>
          </select>
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)' }}>
              <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p style={{ color: 'hsl(var(--foreground))' }}>No quotations found</p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Quote #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Valid Until</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => (
                    <tr key={q._id} style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }} className="hover:opacity-80 transition-opacity">
                      <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{q.quoteNumber}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>{q.clientName}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>₹{q.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : '-'}</td>
                      <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: statusColors[q.status] }}>{q.status}</span></td>
                      <td className="px-4 py-3">
                        <select value={q.status} onChange={(e) => updateStatus(q._id, e.target.value)}
                          className="text-[10px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer" style={{ background: 'hsl(var(--muted))', color: statusColors[q.status] }}>
                          <option value="draft">Draft</option><option value="sent">Sent</option><option value="viewed">Viewed</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="expired">Expired</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-md p-6 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 20px 60px -10px rgb(0 0 0 / 0.3)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Quotation</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input required placeholder="Quote #" value={form.quoteNumber} onChange={e => setForm({ ...form, quoteNumber: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input required placeholder="Client Name *" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <input placeholder="Item Description" value={form.itemDesc} onChange={e => setForm({ ...form, itemDesc: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Quantity" value={form.itemQty} onChange={e => setForm({ ...form, itemQty: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input type="number" placeholder="Rate (₹)" value={form.itemRate} onChange={e => setForm({ ...form, itemRate: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="number" placeholder="Tax %" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input type="number" placeholder="Discount %" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input type="date" placeholder="Valid Until" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" rows={2} />
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Create Quote</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
