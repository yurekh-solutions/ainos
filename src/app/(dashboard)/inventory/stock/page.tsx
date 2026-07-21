'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Package, AlertTriangle, Search } from 'lucide-react';

interface StockItem { _id: string; name: string; sku: string; quantity: number; reorderLevel: number; unitCost: number; warehouse?: { _id?: string; name: string }; category?: string; }

export default function StockPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', quantity: '', reorderLevel: '', unitCost: '', warehouse: '', category: '' });

  useEffect(() => { fetchStock(); }, []);

  const fetchStock = async () => {
    try {
      const params = showLowStock ? '?lowStock=true' : '';
      const res = await fetch(`/api/stock${params}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        setStock(items);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/stock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), reorderLevel: Number(form.reorderLevel), unitCost: Number(form.unitCost) }),
      });
      if (res.ok) { setForm({ name: '', sku: '', quantity: '', reorderLevel: '', unitCost: '', warehouse: '', category: '' }); setShowForm(false); fetchStock(); }
    } catch (e) { console.error(e); }
  };

  const filtered = (Array.isArray(stock) ? stock : []).filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.sku?.toLowerCase().includes(search.toLowerCase()));
  const lowStockCount = (Array.isArray(stock) ? stock : []).filter(s => s.quantity <= s.reorderLevel).length;
  const totalValue = (Array.isArray(stock) ? stock : []).reduce((sum, s) => sum + ((s.quantity || 0) * (s.unitCost || 0)), 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Stock Management</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Track inventory levels</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Add Stock
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[{ l: 'Total Items', v: stock.length, c: 'hsl(252 60% 55%)' },
            { l: 'Low Stock', v: lowStockCount, c: '#a78bfa' },
            { l: 'Total Value', v: `Rs.${totalValue.toLocaleString('en-IN')}`, c: '#34d399' },
            { l: 'Warehouses', v: [...new Set(stock.map(s => s.warehouse?._id))].length, c: '#94a3b8' }].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stock..."
              className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
          </div>
          <button onClick={() => { setShowLowStock(!showLowStock); fetchStock(); }}
            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${showLowStock ? 'text-white border-transparent' : 'glass-card'}`}
            style={showLowStock ? { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' } : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
            <AlertTriangle className="w-4 h-4 inline mr-2" />Low Stock
          </button>
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-20"><Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No stock items</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item, i) => (
                <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div><h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{item.name}</h3><p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>SKU: {item.sku}</p></div>
                    {item.quantity <= item.reorderLevel && <AlertTriangle className="w-5 h-5 text-[#a78bfa]" />}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs"><span style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>Quantity</span><span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{item.quantity}</span></div>
                    <div className="flex justify-between text-xs"><span style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>Reorder Level</span><span style={{ color: 'hsl(var(--muted-foreground))' }}>{item.reorderLevel}</span></div>
                    <div className="flex justify-between text-xs"><span style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>Unit Cost</span><span className="font-bold" style={{ color: 'hsl(var(--primary))' }}>Rs.{item.unitCost?.toLocaleString('en-IN')}</span></div>
                    {item.warehouse && <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>Warehouse: {item.warehouse.name}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Stock Item</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Item name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <input required placeholder="SKU *" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <div className="grid grid-cols-3 gap-3">
                  <input required type="number" placeholder="Qty *" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                  <input type="number" placeholder="Reorder" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                  <input required type="number" placeholder="Cost *" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                </div>
                <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)' }}>Add Stock</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
