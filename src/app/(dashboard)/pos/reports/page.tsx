'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, TrendingUp, CreditCard, Banknote, Smartphone, Calendar } from 'lucide-react';

interface POSOrder { id: string; total?: number; paymentMethod: string; status: string; createdAt: string; }

export default function POSReportsPage() {
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try { const res = await fetch('/api/pos/orders'); if (res.ok) setOrders(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const completed = orders.filter(o => o.status === 'completed');
  const totalSales = completed.reduce((a, o) => a + (o.total || 0), 0);
  const avgOrder = completed.length ? totalSales / completed.length : 0;
  const cashSales = completed.filter(o => o.paymentMethod === 'cash').reduce((a, o) => a + (o.total || 0), 0);
  const cardSales = completed.filter(o => o.paymentMethod === 'card').reduce((a, o) => a + (o.total || 0), 0);
  const upiSales = completed.filter(o => o.paymentMethod === 'upi').reduce((a, o) => a + (o.total || 0), 0);

  // Group by date
  const byDate = completed.reduce((acc, o) => {
    const date = new Date(o.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = { count: 0, total: 0 };
    acc[date].count++;
    acc[date].total += o.total || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const dateEntries = Object.entries(byDate).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).slice(0, 7);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>POS Reports</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Sales analytics and reconciliation</p></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Sales', value: `₹${totalSales.toFixed(0)}`, icon: DollarSign, color: '#10b981' },
            { label: 'Orders', value: completed.length, icon: ShoppingCart, color: '#6D28D9' },
            { label: 'Avg Order', value: `₹${avgOrder.toFixed(0)}`, icon: TrendingUp, color: '#8B5CF6' },
            { label: 'Voided', value: orders.filter(o => o.status === 'voided').length, icon: ShoppingCart, color: '#ef4444' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl p-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg" style={{ background: s.color + '20' }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
                <div><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p><p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p></div></div>
            </motion.div>))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Payment Breakdown</h3>
            <div className="space-y-3">
              {[{ label: 'Cash', value: cashSales, icon: Banknote, color: '#10b981' },
                { label: 'Card', value: cardSales, icon: CreditCard, color: '#3b82f6' },
                { label: 'UPI', value: upiSales, icon: Smartphone, color: '#8B5CF6' }].map(pm => (
                <div key={pm.label} className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: pm.color + '20' }}><pm.icon className="w-4 h-4" style={{ color: pm.color }} /></div>
                  <div className="flex-1"><div className="flex justify-between"><span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{pm.label}</span>
                    <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{pm.value.toFixed(2)}</span></div>
                    <div className="w-full h-1.5 rounded-full mt-1" style={{ background: 'hsl(var(--background))' }}>
                      <div className="h-1.5 rounded-full" style={{ width: totalSales ? `${(pm.value / totalSales) * 100}%` : '0%', background: pm.color }} /></div>
                  </div>
                </div>))}
            </div>
          </div>

          <div className="rounded-xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Daily Sales (Last 7 Days)</h3>
            <div className="space-y-2">
              {dateEntries.map(([date, data]) => (
                <div key={date} className="flex items-center gap-3">
                  <span className="text-xs w-24" style={{ color: 'hsl(var(--muted-foreground))' }}>{date}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'hsl(var(--background))' }}>
                    <div className="h-2 rounded-full" style={{ width: `${(data.total / Math.max(...dateEntries.map(d => d[1].total))) * 100}%`, background: '#8B5CF6' }} /></div>
                  <span className="text-xs font-medium w-16 text-right" style={{ color: 'hsl(var(--foreground))' }}>₹{data.total.toFixed(0)}</span>
                  <span className="text-xs w-8 text-right" style={{ color: 'hsl(var(--muted-foreground))' }}>{data.count}</span>
                </div>))}
              {dateEntries.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No sales data yet</p>}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
