'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ShoppingCart, Search, Truck, Package } from 'lucide-react';

interface SalesOrder { id: string; orderNumber: string; customer: string; items: { product: string; quantity: number; rate: number }[]; totalAmount: number; status: string; paymentStatus: string; deliveryDate?: string; createdAt: string; }

const statusColors: Record<string, string> = { draft: '#636e72', confirmed: '#0984e3', processing: '#fdcb6e', shipped: '#6c5ce7', delivered: '#00b894', cancelled: '#d63031' };
const payColors: Record<string, string> = { unpaid: '#d63031', partial: '#fdcb6e', paid: '#00b894' };

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ orderNumber: '', customer: '', product: '', quantity: '1', rate: '', deliveryDate: '', paymentStatus: 'unpaid' });

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try { const res = await fetch('/api/sales-orders'); if (res.ok) setOrders(await res.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = [{ product: form.product, quantity: Number(form.quantity), rate: Number(form.rate) }];
      const totalAmount = items.reduce((s, i) => s + i.quantity * i.rate, 0);
      const res = await fetch('/api/sales-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, items, totalAmount, status: 'draft' }) });
      if (res.ok) { setForm({ orderNumber: '', customer: '', product: '', quantity: '1', rate: '', deliveryDate: '', paymentStatus: 'unpaid' }); setShowForm(false); fetchOrders(); }
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await fetch('/api/sales-orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); fetchOrders(); } catch (e) { console.error(e); }
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || o.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalValue: orders.reduce((s, o) => s + o.totalAmount, 0),
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Sales Orders</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage orders and fulfillment</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> New Order
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Orders', value: stats.total, gradient: 'from-violet-500 to-purple-600' },
            { label: 'Processing', value: stats.processing, gradient: 'from-amber-500 to-orange-600' },
            { label: 'Shipped', value: stats.shipped, gradient: 'from-blue-500 to-cyan-600' },
            { label: 'Delivered', value: stats.delivered, gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Total Value', value: `₹${stats.totalValue.toLocaleString('en-IN')}`, gradient: 'from-purple-500 to-indigo-600' },
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
            <input type="text" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full glass-input pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="glass-input px-4 py-2.5 text-sm rounded-xl">
            <option value="all">All Status</option><option value="draft">Draft</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)' }}>
              <ShoppingCart className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p style={{ color: 'hsl(var(--foreground))' }}>No sales orders found</p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Order #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }} className="hover:opacity-80 transition-opacity">
                      <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{o.orderNumber}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>{o.customer}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{o.items?.length || 0} items</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>₹{o.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: statusColors[o.status] }}>{o.status}</span></td>
                      <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: payColors[o.paymentStatus] }}>{o.paymentStatus}</span></td>
                      <td className="px-4 py-3">
                        <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="text-[10px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer" style={{ background: 'hsl(var(--muted))', color: statusColors[o.status] }}>
                          <option value="draft">Draft</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
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
                  <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Sales Order</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input required placeholder="Order #" value={form.orderNumber} onChange={e => setForm({ ...form, orderNumber: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input required placeholder="Customer *" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <input placeholder="Product" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input type="number" placeholder="Rate (₹)" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={form.deliveryDate} onChange={e => setForm({ ...form, deliveryDate: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                      <option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Create Order</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
