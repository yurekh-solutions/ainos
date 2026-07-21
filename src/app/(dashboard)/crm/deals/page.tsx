'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Target, TrendingUp } from 'lucide-react';

interface Deal { _id: string; title: string; contact: { name: string }; value: number; stage: string; probability: number; closeDate?: string; }
interface DealStats { total: number; byStage: Record<string, number>; totalValue: number; winRate: number; }

const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const stageColors: Record<string, string> = { lead: '#a78bfa', qualified: 'hsl(252 60% 55%)', proposal: '#34d399', negotiation: '#94a3b8', won: '#34d399', lost: '#64748b' };

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealStats>({ total: 0, byStage: {}, totalValue: 0, winRate: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', contact: '', value: '', stage: 'lead', probability: '50', closeDate: '' });

  useEffect(() => { fetchDeals(); }, []);

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals');
      if (res.ok) { const data = await res.json(); setDeals(data.deals); setStats(data.stats); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/deals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, value: Number(form.value), probability: Number(form.probability) }),
      });
      if (res.ok) { setForm({ title: '', contact: '', value: '', stage: 'lead', probability: '50', closeDate: '' }); setShowForm(false); fetchDeals(); }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Deal Pipeline</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Track deals from lead to close</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))', boxShadow: '0 8px 24px -6px hsl(var(--primary) / 0.4)' }}>
            <Plus className="w-4 h-4" /> New Deal
          </motion.button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Deals', value: stats.total, color: 'hsl(var(--primary))' },
            { label: 'Pipeline Value', value: `Rs.${stats.totalValue.toLocaleString('en-IN')}`, color: '#34d399' },
            { label: 'Win Rate', value: `${stats.winRate}%`, color: '#a78bfa' },
            { label: 'Won', value: stats.byStage['won'] || 0, color: '#34d399' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5 rounded-2xl">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Kanban Board */}
        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {stages.map(stage => {
                const stageDeals = deals.filter(d => d.stage === stage);
                return (
                  <div key={stage} className="space-y-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: `${stageColors[stage]}15` }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: stageColors[stage] }} />
                      <span className="text-xs font-semibold capitalize" style={{ color: 'hsl(var(--foreground))' }}>{stage}</span>
                      <span className="ml-auto text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{stageDeals.length}</span>
                    </div>
                    {stageDeals.map(deal => (
                      <motion.div key={deal._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-3 rounded-xl cursor-pointer hover:shadow-md transition-shadow">
                        <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{deal.title}</p>
                        <p className="text-xs mt-1 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{deal.contact?.name || 'No contact'}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold" style={{ color: stageColors[stage] }}>Rs.{deal.value?.toLocaleString('en-IN') || 0}</span>
                          <span className="text-[10px]" style={{ color: '#94a3b8' }}>{deal.probability}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

        {/* New Deal Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Deal</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Deal title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <input required placeholder="Contact name *" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="number" placeholder="Value *" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                  <input type="number" placeholder="Probability %" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                    {stages.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                  <input type="date" value={form.closeDate} onChange={e => setForm({ ...form, closeDate: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Create Deal</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
