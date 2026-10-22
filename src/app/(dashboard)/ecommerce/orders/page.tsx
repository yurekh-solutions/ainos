'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Search, X, Eye, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';

interface EcomOrder { id: string; orderNumber: string; customerName: string; customerEmail?: string; total?: number; status: string; paymentStatus: string; createdAt: string; }

const STATUS_COLORS: Record<string, string> = { pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6', shipped: '#6366f1', delivered: '#10b981', cancelled: '#ef4444', refunded: '#6b7280' };
const STATUS_ICONS: Record<string, typeof Clock> = { pending: Clock, confirmed: Clock, processing: Clock, shipped: Truck, delivered: CheckCircle, cancelled: XCircle, refunded: XCircle };

export default function EcomOrdersPage() {
  const [orders, setOrders] = useState<EcomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<EcomOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    try { const url = filterStatus ? `/api/ecommerce/orders?status=${filterStatus}` : '/api/ecommerce/orders'; const res = await fetch(url); if (res.ok) setOrders(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    try { const res = await fetch(`/api/ecommerce/orders?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); if (res.ok) fetchOrders(); } catch (e) { console.error(e); }
  };

  const filtered = orders.filter(o => o.orderNumber?.toLowerCase().includes(search.toLowerCase()) || o.customerName?.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((a, o) => a + (o.total || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Orders</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{orders.length} total orders</p></div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{ label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: '#6D28D9' },
            { label: 'Revenue', value: `₹${totalRevenue.toFixed(0)}`, icon: CheckCircle, color: '#10b981' },
            { label: 'Pending', value: pendingCount, icon: Clock, color: '#f59e0b' }].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl p-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg" style={{ background: s.color + '20' }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
                <div><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p><p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p></div></div>
            </motion.div>))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <option value="">All Status</option>{['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p> :
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
            <table className="w-full text-sm"><thead><tr style={{ background: 'hsl(var(--card))' }}>
              {['Order', 'Customer', 'Total', 'Status', 'Payment', 'Date', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>)}
            </tr></thead><tbody>
              {filtered.map((o, i) => { const Icon = STATUS_ICONS[o.status] || Clock;
                return (<motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>{o.orderNumber}</td>
                  <td className="px-4 py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{o.customerName}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{o.total?.toFixed(2)}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: STATUS_COLORS[o.status] + '20', color: STATUS_COLORS[o.status] }}><Icon className="w-3 h-3" />{o.status}</span></td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: o.paymentStatus === 'paid' ? '#10b98120' : '#f59e0b20', color: o.paymentStatus === 'paid' ? '#10b981' : '#f59e0b' }}>{o.paymentStatus}</span></td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <button onClick={() => setSelected(o)} className="p-1 rounded hover:bg-white/10"><Eye className="w-4 h-4" style={{ color: '#8B5CF6' }} /></button>
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="px-2 py-1 rounded border text-xs" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div></td>
                </motion.tr>);})}
            </tbody></table>
          </div>}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Order {selected.orderNumber}</h2>
                <button onClick={() => setSelected(null)}><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button></div>
              <div className="space-y-3 text-sm"><div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Customer:</span> <span style={{ color: 'hsl(var(--foreground))' }}>{selected.customerName}</span></div>
                <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Email:</span> <span style={{ color: 'hsl(var(--foreground))' }}>{selected.customerEmail || '-'}</span></div>
                <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Total:</span> <span className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>₹{selected.total?.toFixed(2)}</span></div>
                <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Status:</span> <span style={{ color: STATUS_COLORS[selected.status] }}>{selected.status}</span></div>
                <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Date:</span> <span style={{ color: 'hsl(var(--foreground))' }}>{new Date(selected.createdAt).toLocaleString()}</span></div></div>
            </motion.div>
          </div>)}
      </motion.div>
    </div>
  );
}
