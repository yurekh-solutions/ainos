'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, Users, DollarSign, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
// ArrowUpRight/ArrowDownRight kept for status colouring of the Low Stock card

export default function EcomAnalyticsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [oRes, pRes] = await Promise.all([fetch('/api/ecommerce/orders'), fetch('/api/ecommerce/products')]);
      if (oRes.ok) setOrders(await oRes.json());
      if (pRes.ok) setProducts(await pRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((a, o) => a + (o.total || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const lowStock = products.filter(p => p.stock <= 5).length;

  const statusBreakdown = orders.reduce((acc: Record<string, number>, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Analytics</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>See what sells, what earns, and what needs restocking</p></div>

        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Revenue (delivered)', value: `₹${totalRevenue.toFixed(0)}`, icon: DollarSign, color: '#10b981' },
                { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: '#6D28D9' },
                { label: 'Avg Order Value', value: `₹${avgOrderValue.toFixed(0)}`, icon: TrendingUp, color: '#8B5CF6' },
                { label: 'Low Stock Items', value: lowStock, icon: Package, color: lowStock > 0 ? '#ef4444' : '#10b981' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="rounded-xl p-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg" style={{ background: s.color + '20' }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p>
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
                </motion.div>))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Order Status</h3>
                <div className="space-y-3">
                  {Object.entries(statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-sm w-24 capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>{status}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: 'hsl(var(--background))' }}>
                        <div className="h-2 rounded-full" style={{ width: `${(count as number / totalOrders) * 100}%`, background: '#8B5CF6' }} />
                      </div>
                      <span className="text-sm font-medium w-8 text-right" style={{ color: 'hsl(var(--foreground))' }}>{count as number}</span>
                    </div>))}
                </div>
              </div>

              <div className="rounded-xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Recent Orders</h3>
                <div className="space-y-3">
                  {recentOrders.map(o => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'hsl(var(--border))' }}>
                      <div><p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{o.orderNumber}</p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{o.customerName}</p></div>
                      <div className="text-right"><p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{o.total?.toFixed(2)}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>{o.status}</span></div>
                    </div>))}
                  {recentOrders.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No orders yet</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
