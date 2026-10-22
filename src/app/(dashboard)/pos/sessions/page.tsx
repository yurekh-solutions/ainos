'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Play, Square, Clock, DollarSign, ShoppingCart } from 'lucide-react';

interface POSSession { id: string; name: string; status: string; openedAt?: string; closedAt?: string; openedBy?: string; openingCash: number; closingCash?: number; totalSales: number; totalOrders: number; notes?: string; }

export default function POSSessionsPage() {
  const [sessions, setSessions] = useState<POSSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', openingCash: 0 });

  const fetchSessions = useCallback(async () => {
    try { const res = await fetch('/api/pos/sessions'); if (res.ok) setSessions(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const openSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pos/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setForm({ name: '', openingCash: 0 }); setShowForm(false); fetchSessions(); }
    } catch (e) { console.error(e); }
  };

  const closeSession = async (id: string) => {
    const closingCash = prompt('Closing cash amount:');
    if (closingCash === null) return;
    try {
      const res = await fetch(`/api/pos/sessions?id=${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', closingCash: parseFloat(closingCash), closedAt: new Date().toISOString() })
      });
      if (res.ok) fetchSessions();
    } catch (e) { console.error(e); }
  };

  const openSessions = sessions.filter(s => s.status === 'open');
  const closedSessions = sessions.filter(s => s.status === 'closed');
  const totalTodaySales = openSessions.reduce((a, s) => a + s.totalSales, 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>POS Sessions</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Open a register for each shift and track every sale with exact cash counts</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>
            <Plus className="w-4 h-4" /> Open Session
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{ label: 'Open Sessions', value: openSessions.length, icon: Play, color: '#10b981' },
            { label: 'Today Sales', value: `₹${totalTodaySales.toFixed(0)}`, icon: DollarSign, color: '#6D28D9' },
            { label: 'Total Orders', value: openSessions.reduce((a, s) => a + s.totalOrders, 0), icon: ShoppingCart, color: '#8B5CF6' }].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl p-4 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg" style={{ background: s.color + '20' }}><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
                <div><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p><p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{s.value}</p></div></div>
            </motion.div>))}
        </div>

        {openSessions.length > 0 && (
          <div><h3 className="text-sm font-semibold mb-3" style={{ color: '#10b981' }}>Active Sessions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openSessions.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl p-5 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{s.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1" style={{ background: '#10b98120', color: '#10b981' }}><Play className="w-3 h-3" />Open</span>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Opened by</span><span style={{ color: 'hsl(var(--foreground))' }}>{s.openedBy}</span></div>
                    <div className="flex justify-between"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Opening cash</span><span style={{ color: 'hsl(var(--foreground))' }}>₹{s.openingCash}</span></div>
                    <div className="flex justify-between"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Sales</span><span className="font-medium" style={{ color: '#10b981' }}>₹{s.totalSales.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Orders</span><span style={{ color: 'hsl(var(--foreground))' }}>{s.totalOrders}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/pos/register?session=${s.id}`} className="flex-1 py-2 rounded-lg text-center text-xs font-medium text-white" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>Open Register</a>
                    <button onClick={() => closeSession(s.id)} className="flex-1 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Close</button>
                  </div>
                </motion.div>))}
            </div>
          </div>)}

        {closedSessions.length > 0 && (
          <div><h3 className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>Closed Sessions</h3>
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
              <table className="w-full text-sm"><thead><tr style={{ background: 'hsl(var(--card))' }}>
                {['Name', 'Opened', 'Closed', 'Opening', 'Closing', 'Sales', 'Orders'].map(h => <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>)}
              </tr></thead><tbody>
                {closedSessions.map(s => (
                  <tr key={s.id} className="border-t" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>{s.name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.openedAt ? new Date(s.openedAt).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.closedAt ? new Date(s.closedAt).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>₹{s.openingCash}</td>
                    <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>₹{s.closingCash || 0}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#10b981' }}>₹{s.totalSales.toFixed(2)}</td>
                    <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>{s.totalOrders}</td>
                  </tr>))}
              </tbody></table>
            </div>
          </div>)}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Open New Session</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button></div>
              <form onSubmit={openSession} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Session Name</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Morning Shift" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <div><label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Opening Cash (₹)</label>
                  <input type="number" required value={form.openingCash} onChange={e => setForm({ ...form, openingCash: +e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} /></div>
                <button type="submit" className="w-full py-2.5 rounded-lg text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}>Open Session</button>
              </form>
            </motion.div>
          </div>)}
      </motion.div>
    </div>
  );
}
