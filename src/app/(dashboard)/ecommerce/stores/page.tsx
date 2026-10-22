'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Store, Search, X, Globe, Package, ShoppingCart } from 'lucide-react';

export default function EcomStoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', currency: 'INR', domain: '' });

  useEffect(() => { fetchStores(); }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/ecommerce/stores');
      if (res.ok) setStores(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ecommerce/stores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      if (res.ok) { setForm({ name: '', description: '', currency: 'INR', domain: '' }); setShowForm(false); fetchStores(); }
    } catch (e) { console.error(e); }
  };

  const filtered = stores.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));
  const totalProducts = stores.reduce((a, s) => a + (s._count?.products || 0), 0);
  const totalOrders = stores.reduce((a, s) => a + (s._count?.orders || 0), 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Online Stores</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage your eCommerce stores</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
            <Plus className="w-4 h-4" /> New Store
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Stores', value: stores.length, icon: Store, color: '#6D28D9' },
            { label: 'Total Products', value: totalProducts, icon: Package, color: '#8B5CF6' },
            { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: '#A78BFA' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl p-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: s.color + '20' }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p><p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stores..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm"
            style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
        </div>

        {/* Stores Grid */}
        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p> :
          filtered.length === 0 ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No stores found</p> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((store, i) => (
              <motion.div key={store.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-xl p-5 border cursor-pointer hover:shadow-lg transition-shadow"
                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg" style={{ background: '#6D28D920' }}>
                    <Globe className="w-5 h-5" style={{ color: '#8B5CF6' }} />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: store.status === 'active' ? '#10b98120' : '#f59e0b20', color: store.status === 'active' ? '#10b981' : '#f59e0b' }}>
                    {store.status}
                  </span>
                </div>
                <h3 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>{store.name}</h3>
                <p className="text-xs mb-3 line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{store.description || 'No description'}</p>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {store._count?.products || 0} products</span>
                  <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> {store._count?.orders || 0} orders</span>
                </div>
              </motion.div>
            ))}
          </div>
        }

        {/* Create Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>New Store</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Store Name</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Currency</label>
                    <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                      <option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
                    </select></div>
                  <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Domain</label>
                    <input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="store.example.com"
                      className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                </div>
                <button type="submit" className="w-full py-2.5 rounded-lg text-white text-sm font-medium"
                  style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>Create Store</button>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
