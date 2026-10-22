'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Search, Eye, X, CreditCard, Banknote, Smartphone, Trash2 } from 'lucide-react';

interface POSOrder { id: string; orderNumber: string; items?: unknown; subtotal?: number; tax?: number; discount?: number; total?: number; status: string; paymentMethod: string; amountPaid?: number; customerName?: string; createdAt: string; }

const PAYMENT_ICONS: Record<string, typeof Banknote> = { cash: Banknote, card: CreditCard, upi: Smartphone };
const STATUS_COLORS: Record<string, string> = { completed: '#10b981', voided: '#ef4444', refunded: '#f59e0b' };

export default function POSOrdersPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<POSOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    try { const res = await fetch('/api/pos/orders'); if (res.ok) setOrders(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const voidOrder = async (id: string) => {
    if (!confirm('Void this order?')) return;
    try { const res = await fetch(`/api/pos/orders?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'voided' }) }); if (res.ok) fetchOrders(); } catch (e) { console.error(e); }
  };

  const filtered = orders.filter(o => o.orderNumber?.toLowerCase().includes(search.toLowerCase()) || o.customerName?.toLowerCase().includes(search.toLowerCase()));
  const totalSales = orders.filter(o => o.status === 'completed').reduce((a, o) => a + (o.total || 0), 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>POS Orders</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{orders.length} orders</p></div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{ label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: '#6D28D9' },
            { label: 'Total Sales', value: `₹${totalSales.toFixed(0)}`, icon: Banknote, color: '#10b981' },
            { label: 'Avg Order', value: `₹${orders.length ? (totalSales / orders.filter(o => o.status === 'completed').length).toFixed(0) : 0}`, icon: CreditCard, color: '#8B5CF6' }].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl p-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg" style={{ background: s.color + '20' }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
                <div><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p><p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p></div></div>
            </motion.div>))}
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>

        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p> :
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
            <table className="w-full text-sm"><thead><tr style={{ background: 'hsl(var(--card))' }}>
              {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>)}
            </tr></thead><tbody>
              {filtered.map((o, i) => { const PayIcon = PAYMENT_ICONS[o.paymentMethod] || Banknote;
                return (
                  <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>{o.orderNumber}</td>
                    <td className="px-4 py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{o.customerName || 'Walk-in'}</td>
                    <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{Array.isArray(o.items) ? o.items.length : 0}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{o.total?.toFixed(2)}</td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}><PayIcon className="w-3 h-3" />{o.paymentMethod}</span></td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: (STATUS_COLORS[o.status] || '#6b7280') + '20', color: STATUS_COLORS[o.status] || '#6b7280' }}>{o.status}</span></td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(o.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3"><div className="flex gap-1">
                      <button onClick={() => setSelected(o)} className="p-1 rounded hover:bg-white/10"><Eye className="w-4 h-4" style={{ color: '#8B5CF6' }} /></button>
                      {o.status === 'completed' && <button onClick={() => voidOrder(o.id)} className="p-1 rounded hover:bg-white/10"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button>}
                    </div></td>
                  </motion.tr>);})}
            </tbody></table>
          </div>}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Order {selected.orderNumber}</h2>
                <button onClick={() => setSelected(null)}><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button></div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Customer:</span><span style={{ color: 'hsl(var(--foreground))' }}>{selected.customerName || 'Walk-in'}</span></div>
                <div className="flex justify-between"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal:</span><span style={{ color: 'hsl(var(--foreground))' }}>₹{selected.subtotal?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Tax:</span><span style={{ color: 'hsl(var(--foreground))' }}>₹{selected.tax?.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-2" style={{ borderColor: 'hsl(var(--border))' }}><span style={{ color: 'hsl(var(--foreground))' }}>Total:</span><span style={{ color: '#8B5CF6' }}>₹{selected.total?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Paid:</span><span style={{ color: '#10b981' }}>₹{selected.amountPaid?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Method:</span><span className="capitalize" style={{ color: 'hsl(var(--foreground))' }}>{selected.paymentMethod}</span></div>
              </div>
            </motion.div>
          </div>)}
      </motion.div>
    </div>
  );
}
