'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, X, Edit2, Trash2, Package } from 'lucide-react';

interface PosProduct { id: string; name: string; sku?: string; barcode?: string; price: number; isInStock: boolean; quickKey?: string; category?: { name: string }; }

export default function POSProductsPage() {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: 0, sku: '', barcode: '', quickKey: '', isInStock: true });

  const fetchProducts = useCallback(async () => {
    try { const res = await fetch('/api/pos/products'); if (res.ok) setProducts(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editId ? `/api/pos/products?id=${editId}` : '/api/pos/products';
      const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { resetForm(); fetchProducts(); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try { const res = await fetch(`/api/pos/products?id=${id}`, { method: 'DELETE' }); if (res.ok) fetchProducts(); } catch (e) { console.error(e); }
  };

  const handleEdit = (p: PosProduct) => { setForm({ name: p.name, price: p.price, sku: p.sku || '', barcode: p.barcode || '', quickKey: p.quickKey || '', isInStock: p.isInStock }); setEditId(p.id); setShowForm(true); };
  const resetForm = () => { setForm({ name: '', price: 0, sku: '', barcode: '', quickKey: '', isInStock: true }); setEditId(null); setShowForm(false); };
  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search));

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>POS Products</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Items your staff can quickly bill at the counter</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
            <Plus className="w-4 h-4" /> Add Product
          </motion.button>
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or barcode..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>

        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p> :
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
            <table className="w-full text-sm"><thead><tr style={{ background: 'hsl(var(--card))' }}>
              {['Product', 'SKU', 'Barcode', 'Price', 'Stock', 'Quick Key', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>)}
            </tr></thead><tbody>
              {filtered.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>{p.name}</td>
                  <td className="px-4 py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.sku || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.barcode || '-'}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{p.price.toFixed(2)}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: p.isInStock ? '#10b98120' : '#ef444420', color: p.isInStock ? '#10b981' : '#ef4444' }}>{p.isInStock ? 'In Stock' : 'Out'}</span></td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: '#6D28D920', color: '#8B5CF6' }}>{p.quickKey || '-'}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <button onClick={() => handleEdit(p)} className="p-1 rounded hover:bg-white/10"><Edit2 className="w-4 h-4" style={{ color: '#8B5CF6' }} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button>
                  </div></td>
                </motion.tr>))}
            </tbody></table>
          </div>}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{editId ? 'Edit' : 'Add'} POS Product</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Name</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Price (₹)</label>
                    <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Quick Key</label>
                    <input value={form.quickKey} onChange={e => setForm({ ...form, quickKey: e.target.value })} placeholder="F1" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>SKU</label>
                    <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Barcode</label>
                    <input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isInStock} onChange={e => setForm({ ...form, isInStock: e.target.checked })} className="w-4 h-4 rounded" />
                  <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>In Stock</span>
                </label>
                <button type="submit" className="w-full py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>{editId ? 'Update' : 'Add'} Product</button>
              </form>
            </motion.div>
          </div>)}
      </motion.div>
    </div>
  );
}
