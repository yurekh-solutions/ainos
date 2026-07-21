'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, ShoppingCart, Package } from 'lucide-react';

interface PurchaseOrder { _id: string; orderNumber: string; supplier: string; status: string; totalAmount: number; orderDate: string; expectedDelivery?: string; items: Array<{ item: string; quantity: number; unitPrice: number }>; }

export default function OrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ orderNumber: '', supplier: '', expectedDelivery: '', items: [{ item: '', quantity: '1', unitPrice: '' }] });

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try { const res = await fetch('/api/purchase-orders'); if (res.ok) setOrders(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = form.items.map(i => ({ item: i.item, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) }));
    const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items, totalAmount, status: 'draft' }),
      });
      if (res.ok) { setForm({ orderNumber: '', supplier: '', expectedDelivery: '', items: [{ item: '', quantity: '1', unitPrice: '' }] }); setShowForm(false); fetchOrders(); }
    } catch (e) { console.error(e); }
  };

  const statusColors: Record<string, string> = { draft: '#94a3b8', pending: '#a78bfa', approved: 'hsl(252 60% 55%)', received: '#34d399', cancelled: '#64748b' };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Purchase Orders</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage supplier orders</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> New Order
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[{ l: 'Total Orders', v: orders.length, c: 'hsl(252 60% 55%)' },
            { l: 'Pending', v: orders.filter(o => o.status === 'pending').length, c: '#a78bfa' },
            { l: 'Received', v: orders.filter(o => o.status === 'received').length, c: '#34d399' },
            { l: 'Total Value', v: `Rs.${orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString('en-IN')}`, c: '#34d399' }].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : orders.length === 0 ? (
            <div className="text-center py-20"><ShoppingCart className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No purchase orders</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order, i) => (
                <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div><h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{order.orderNumber}</h3><p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{order.supplier}</p></div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: statusColors[order.status] }}>{order.status}</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>{order.items?.length || 0} items</p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>Ordered: {new Date(order.orderDate).toLocaleDateString()}</p>
                    {order.expectedDelivery && <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</p>}
                    <p className="text-sm font-bold mt-2" style={{ color: 'hsl(var(--primary))' }}>Rs.{order.totalAmount?.toLocaleString('en-IN')}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Purchase Order</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Order number *" value={form.orderNumber} onChange={e => setForm({ ...form, orderNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <input required placeholder="Supplier *" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <input type="date" value={form.expectedDelivery} onChange={e => setForm({ ...form, expectedDelivery: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Items</p>
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2">
                      <input required placeholder="Item" value={item.item} onChange={e => { const items = [...form.items]; items[idx].item = e.target.value; setForm({ ...form, items }); }}
                        className="px-3 py-2 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={e => { const items = [...form.items]; items[idx].quantity = e.target.value; setForm({ ...form, items }); }}
                        className="px-3 py-2 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                      <input type="number" placeholder="Price" value={item.unitPrice} onChange={e => { const items = [...form.items]; items[idx].unitPrice = e.target.value; setForm({ ...form, items }); }}
                        className="px-3 py-2 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { item: '', quantity: '1', unitPrice: '' }] })}
                    className="text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>+ Add Item</button>
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)' }}>Create Order</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
