'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Warehouse as WarehouseIcon, MapPin } from 'lucide-react';

interface Warehouse { _id: string; name: string; location?: string; capacity?: number; manager?: string; }

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', capacity: '', manager: '' });

  useEffect(() => { fetchWarehouses(); }, []);

  const fetchWarehouses = async () => {
    try { const res = await fetch('/api/warehouses'); if (res.ok) setWarehouses(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/warehouses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
      });
      if (res.ok) { setForm({ name: '', location: '', capacity: '', manager: '' }); setShowForm(false); fetchWarehouses(); }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Warehouses</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage storage locations</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Add Warehouse
          </motion.button>
        </motion.div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : warehouses.length === 0 ? (
            <div className="text-center py-20"><WarehouseIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No warehouses yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map((wh, i) => (
                <motion.div key={wh._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.5))' }}>
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                    <div><h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{wh.name}</h3></div>
                  </div>
                  {wh.location && <p className="text-xs flex items-center gap-1 mt-2" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}><MapPin className="w-3 h-3" />{wh.location}</p>}
                  {wh.capacity && <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>Capacity: {wh.capacity} units</p>}
                  {wh.manager && <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>Manager: {wh.manager}</p>}
                </motion.div>
              ))}
            </div>
          )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Warehouse</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Warehouse name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Capacity" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                  <input placeholder="Manager" value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)' }}>Add Warehouse</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
