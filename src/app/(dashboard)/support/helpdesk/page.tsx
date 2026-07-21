'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Headphones, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface Ticket { _id: string; subject: string; description: string; priority: string; status: string; category?: string; createdAt: string; }

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium', category: '' });

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try { const res = await fetch('/api/helpdesk'); if (res.ok) setTickets(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/helpdesk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'open' }),
      });
      if (res.ok) { setForm({ subject: '', description: '', priority: 'medium', category: '' }); setShowForm(false); fetchTickets(); }
    } catch (e) { console.error(e); }
  };

  const priorityColors: Record<string, string> = { low: '#34d399', medium: '#a78bfa', high: 'hsl(252 60% 55%)', urgent: '#94a3b8' };
  const statusColors: Record<string, string> = { open: 'hsl(252 60% 55%)', in_progress: '#a78bfa', resolved: '#34d399', closed: '#94a3b8' };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Helpdesk</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Support tickets & issues</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))', boxShadow: '0 8px 24px -6px hsl(var(--primary) / 0.4)' }}>
            <Plus className="w-4 h-4" /> New Ticket
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[{ l: 'Open', v: tickets.filter(t => t.status === 'open').length, c: 'hsl(var(--primary))' },
            { l: 'In Progress', v: tickets.filter(t => t.status === 'in_progress').length, c: '#a78bfa' },
            { l: 'Resolved', v: tickets.filter(t => t.status === 'resolved').length, c: '#34d399' },
            { l: 'Urgent', v: tickets.filter(t => t.priority === 'urgent').length, c: '#94a3b8' }].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5 rounded-2xl">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : tickets.length === 0 ? (
            <div className="text-center py-20"><Headphones className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No support tickets</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map((ticket, i) => (
                <motion.div key={ticket._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-5 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold line-clamp-1" style={{ color: 'hsl(var(--foreground))' }}>{ticket.subject}</h3>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize flex-shrink-0 ml-2" style={{ background: statusColors[ticket.status] }}>{ticket.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{ticket.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize" style={{ background: `${priorityColors[ticket.priority]}20`, color: priorityColors[ticket.priority] }}>{ticket.priority}</span>
                    <p className="text-xs flex items-center gap-1" style={{ color: '#94a3b8' }}><Clock className="w-3 h-3" />{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                  {ticket.category && <p className="text-xs mt-2 capitalize" style={{ color: '#94a3b8' }}>{ticket.category}</p>}
                </motion.div>
              ))}
            </div>
          )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Support Ticket</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Subject *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <textarea required placeholder="Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                  <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Create Ticket</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
