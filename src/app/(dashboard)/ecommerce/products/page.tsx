'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, X, Edit2, Trash2 } from 'lucide-react';

interface EcomProduct { id: string; name: string; slug?: string; description?: string; price: number; stock: number; sku?: string; status: string; categoryId?: string; }

export default function EcomProductsPage() {
  const [products, setProducts] = useState<EcomProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', price: 0, stock: 0, sku: '', status: 'active', category: '' });

  const fetchProducts = useCallback(async () => {
    try { const res = await fetch('/api/ecommerce/products'); if (res.ok) setProducts(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editId ? `/api/ecommerce/products?id=${editId}` : '/api/ecommerce/products';
      const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { resetForm(); fetchProducts(); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try { const res = await fetch(`/api/ecommerce/products?id=${id}`, { method: 'DELETE' }); if (res.ok) fetchProducts(); } catch (e) { console.error(e); }
  };

  const handleEdit = (p: EcomProduct) => { setForm({ name: p.name, slug: p.slug || '', description: p.description || '', price: p.price, stock: p.stock, sku: p.sku || '', status: p.status, category: p.categoryId || '' }); setEditId(p.id); setShowForm(true); };
  const resetForm = () => { setForm({ name: '', slug: '', description: '', price: 0, stock: 0, sku: '', status: 'active', category: '' }); setEditId(null); setShowForm(false); };

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Products</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{products.length} products in catalog</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
            <Plus className="w-4 h-4" /> Add Product
          </motion.button>
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
        </div>

        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p> :
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
            <table className="w-full text-sm">
              <thead><tr style={{ background: 'hsl(var(--card))' }}>
                {['Product', 'SKU', 'Price', 'Stock', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</td>
                    <td className="px-4 py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.sku || '-'}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{p.price?.toFixed(2)}</td>
                    <td className="px-4 py-3"><span style={{ color: p.stock > 10 ? '#10b981' : p.stock > 0 ? '#f59e0b' : '#ef4444' }}>{p.stock}</span></td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: p.status === 'active' ? '#10b98120' : '#f59e0b20', color: p.status === 'active' ? '#10b981' : '#f59e0b' }}>{p.status}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="p-1 rounded hover:bg-white/10"><Edit2 className="w-4 h-4" style={{ color: '#8B5CF6' }} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button>
                    </div></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        }

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg rounded-xl p-6 border max-h-[90vh] overflow-y-auto" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{editId ? 'Edit' : 'Add'} Product</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Name</label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Slug</label>
                    <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Price (₹)</label>
                    <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Stock</label>
                    <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: +e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>SKU</label>
                    <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                      <option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option>
                    </select></div>
                </div>
                <button type="submit" className="w-full py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>{editId ? 'Update' : 'Create'} Product</button>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
