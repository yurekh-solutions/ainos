'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, X, CheckCircle, Mail, Phone, AlertCircle } from 'lucide-react';

interface FollowUp {
  _id: string;
  contact: { name: string; email?: string; phone?: string };
  type: string;
  scheduledDate: string;
  status: string;
  message?: string;
}

const typeIcons: Record<string, React.ElementType> = { email: Mail, whatsapp: Phone, call: Phone };
const typeColors: Record<string, string> = { email: 'hsl(252 60% 55%)', whatsapp: '#34d399', call: '#a78bfa' };
const statusColors: Record<string, string> = { pending: '#a78bfa', done: '#34d399', missed: '#94a3b8' };

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ contact: '', type: 'call' as const, scheduledDate: '', message: '' });

  useEffect(() => { fetchFollowUps(); }, []);

  const fetchFollowUps = async () => {
    try {
      const res = await fetch('/api/follow-ups');
      if (res.ok) setFollowUps(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/follow-ups', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setForm({ contact: '', type: 'call', scheduledDate: '', message: '' }); setShowForm(false); fetchFollowUps(); }
    } catch (e) { console.error(e); }
  };

  const markDone = async (id: string) => {
    try {
      const res = await fetch(`/api/follow-ups/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'done' }) });
      if (res.ok) fetchFollowUps();
    } catch (e) { console.error(e); }
  };

  const pending = followUps.filter(f => f.status === 'pending');
  const done = followUps.filter(f => f.status === 'done');

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Follow-ups</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Never miss a follow-up with your leads</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))', boxShadow: '0 8px 24px -6px hsl(var(--primary) / 0.4)' }}>
            <Plus className="w-4 h-4" /> Schedule Follow-up
          </motion.button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending', value: pending.length, color: '#a78bfa', icon: Clock },
            { label: 'Completed', value: done.length, color: '#34d399', icon: CheckCircle },
            { label: 'Total', value: followUps.length, color: 'hsl(var(--primary))', icon: AlertCircle },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5 rounded-2xl">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Follow-up List */}
        {loading ? (
          <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} />
            <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No follow-ups scheduled</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Schedule your first follow-up</p>
          </div>
        ) : (
          <div className="space-y-3">
            {followUps.map((fu, i) => {
              const Icon = typeIcons[fu.type] || Phone;
              return (
                <motion.div key={fu._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-4 rounded-2xl flex items-center gap-4"
                  style={{ opacity: fu.status === 'done' ? 0.6 : 1 }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${typeColors[fu.type] || 'hsl(var(--primary))'}15` }}>
                    <Icon className="w-5 h-5" style={{ color: typeColors[fu.type] || 'hsl(var(--primary))' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{fu.contact?.name || 'Unknown Contact'}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: statusColors[fu.status] }}>{fu.status}</span>
                    </div>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>{fu.type} &middot; {new Date(fu.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {fu.message && <p className="text-xs mt-1 truncate" style={{ color: '#94a3b8' }}>{fu.message}</p>}
                  </div>
                  {fu.status === 'pending' && (
                    <button onClick={() => markDone(fu._id)} className="p-2 rounded-xl hover:opacity-70 transition-opacity flex-shrink-0">
                      <CheckCircle className="w-5 h-5" style={{ color: '#34d399' }} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Schedule Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Schedule Follow-up</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="Contact name *" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as typeof form.type })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                  <option value="call">Phone Call</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
                <input required type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                <textarea placeholder="Message / Notes" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50 resize-none" rows={3} />
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Schedule</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
