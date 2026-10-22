'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag, Search, X, Edit2, Trash2, Percent } from 'lucide-react';

interface Coupon { id: string; code: string; type: string; value: number; minOrder?: number; usageLimit?: number; usedCount: number; isActive: boolean; startDate?: string; endDate?: string; }

export default function EcomCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: 10, minOrder: 0, usageLimit: 0, isActive: true });

  const fetchCoupons = useCallback(async () => {
    try { const res = await fetch('/api/ecommerce/coupons'); if (res.ok) setCoupons(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editId ? `/api/ecommerce/coupons?id=${editId}` : '/api/ecommerce/coupons';
      const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { resetForm(); fetchCoupons(); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { const res = await fetch(`/api/ecommerce/coupons?id=${id}`, { method: 'DELETE' }); if (res.ok) fetchCoupons(); } catch (e) { console.error(e); }
  };

  const handleEdit = (c: Coupon) => { setForm({ code: c.code, type: c.type, value: c.value, minOrder: c.minOrder || 0, usageLimit: c.usageLimit || 0, isActive: c.isActive }); setEditId(c.id); setShowForm(true); };
  const resetForm = () => { setForm({ code: '', type: 'percentage', value: 10, minOrder: 0, usageLimit: 0, isActive: true }); setEditId(null); setShowForm(false); };
  const filtered = coupons.filter(c => c.code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Coupons</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{coupons.length} coupons</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
            <Plus className="w-4 h-4" /> New Coupon
          </motion.button>
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coupons..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>

        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><div className="p-2 rounded-lg" style={{ background: '#6D28D920' }}><Percent className="w-5 h-5" style={{ color: '#8B5CF6' }} /></div>
                    <span className="font-mono font-bold text-lg" style={{ color: 'hsl(var(--foreground))' }}>{c.code}</span></div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: c.isActive ? '#10b98120' : '#ef444420', color: c.isActive ? '#10b981' : '#ef4444' }}>{c.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-sm mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.type === 'percentage' ? `${c.value}% off` : `₹${c.value} off`}{c.minOrder ? ` • Min ₹${c.minOrder}` : ''}</p>
                <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span>{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''} used</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(c)} className="p-1 rounded hover:bg-white/10"><Edit2 className="w-4 h-4" style={{ color: '#8B5CF6' }} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button>
                  </div>
                </div>
              </motion.div>))}
          </div>}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{editId ? 'Edit' : 'New'} Coupon</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Code</label>
                  <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 rounded-lg border text-sm font-mono" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                      <option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select></div>
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Value</label>
                    <input type="number" required value={form.value} onChange={e => setForm({ ...form, value: +e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Min Order (₹)</label>
                    <input type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: +e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Usage Limit</label>
                    <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: +e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                </div>
                <button type="submit" className="w-full py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>{editId ? 'Update' : 'Create'} Coupon</button>
              </form>
            </motion.div>
          </div>)}
      </motion.div>
    </div>
  );
}
