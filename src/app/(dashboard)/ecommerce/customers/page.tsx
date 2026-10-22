'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Mail, Phone, MapPin, ShoppingCart, DollarSign } from 'lucide-react';

interface EcomOrder { id: string; customerName: string; customerEmail?: string; total?: number; status: string; createdAt: string; }

interface Customer {
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrder?: string;
}

export default function EcomCustomersPage() {
  const [orders, setOrders] = useState<EcomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    try { const res = await fetch('/api/ecommerce/orders'); if (res.ok) setOrders(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Aggregate customers from orders
  const customerMap = orders.reduce((acc, o) => {
    const key = o.customerEmail || o.customerName;
    if (!acc[key]) acc[key] = { name: o.customerName, email: o.customerEmail || '', orderCount: 0, totalSpent: 0, lastOrder: undefined };
    acc[key].orderCount++;
    acc[key].totalSpent += o.total || 0;
    if (!acc[key].lastOrder || new Date(o.createdAt) > new Date(acc[key].lastOrder!)) acc[key].lastOrder = o.createdAt;
    return acc;
  }, {} as Record<string, Customer>);

  const customers = Object.values(customerMap);
  const filtered = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = customers.reduce((a, c) => a + c.totalSpent, 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Customers</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{customers.length} customers from orders</p></div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{ label: 'Total Customers', value: customers.length, icon: Users, color: '#6D28D9' },
            { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(0)}`, icon: DollarSign, color: '#10b981' },
            { label: 'Avg Spend', value: `₹${customers.length ? (totalRevenue / customers.length).toFixed(0) : 0}`, icon: ShoppingCart, color: '#8B5CF6' }].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl p-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg" style={{ background: s.color + '20' }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
                <div><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p><p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p></div></div>
            </motion.div>))}
        </div>

        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>

        {loading ? <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p> :
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
            <table className="w-full text-sm">
              <thead><tr style={{ background: 'hsl(var(--card))' }}>
                {['Customer', 'Email', 'Orders', 'Total Spent', 'Last Order'].map(h => <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr key={c.email || c.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                    <td className="px-4 py-3"><div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#6D28D9' }}>{c.name.charAt(0).toUpperCase()}</div>
                      <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.name}</span></div></td>
                    <td className="px-4 py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.email || '-'}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>{c.orderCount}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#10b981' }}>₹{c.totalSpent.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.lastOrder ? new Date(c.lastOrder).toLocaleDateString() : '-'}</td>
                  </motion.tr>))}
              </tbody>
            </table>
          </div>}
      </motion.div>
    </div>
  );
}
