'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Mail, Send, BarChart3 } from 'lucide-react';

interface EmailCampaign { _id: string; name: string; subject: string; status: string; recipients: number; openRate?: number; clickRate?: number; sentDate?: string; }

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', content: '', recipients: '' });

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    try { const res = await fetch('/api/email-campaigns'); if (res.ok) setCampaigns(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/email-campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recipients: Number(form.recipients), status: 'draft' }),
      });
      if (res.ok) { setForm({ name: '', subject: '', content: '', recipients: '' }); setShowForm(false); fetchCampaigns(); }
    } catch (e) { console.error(e); }
  };

  const statusColors: Record<string, string> = { draft: '#94a3b8', scheduled: '#a78bfa', sent: '#34d399', active: 'hsl(252 60% 55%)' };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Email Campaigns</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Marketing automation</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))', boxShadow: '0 8px 24px -6px hsl(var(--primary) / 0.4)' }}>
            <Plus className="w-4 h-4" /> New Campaign
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[{ l: 'Total', v: campaigns.length, c: 'hsl(var(--primary))' },
            { l: 'Sent', v: campaigns.filter(c => c.status === 'sent').length, c: '#34d399' },
            { l: 'Avg Open Rate', v: `${campaigns.length ? (campaigns.reduce((s, c) => s + (c.openRate || 0), 0) / campaigns.length).toFixed(1) : 0}%`, c: '#34d399' },
            { l: 'Total Recipients', v: campaigns.reduce((s, c) => s + c.recipients, 0).toLocaleString(), c: '#a78bfa' }].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5 rounded-2xl">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : campaigns.length === 0 ? (
            <div className="text-center py-20"><Mail className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No campaigns yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((camp, i) => (
                <motion.div key={camp._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-5 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{camp.name}</h3>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: statusColors[camp.status] }}>{camp.status}</span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{camp.subject}</p>
                  <div className="space-y-1.5">
                    <p className="text-xs flex items-center gap-1" style={{ color: '#94a3b8' }}><Send className="w-3 h-3" />{camp.recipients} recipients</p>
                    {camp.openRate !== undefined && <p className="text-xs flex items-center gap-1" style={{ color: '#94a3b8' }}><BarChart3 className="w-3 h-3" />{camp.openRate}% open rate</p>}
                    {camp.clickRate !== undefined && <p className="text-xs flex items-center gap-1" style={{ color: '#94a3b8' }}><BarChart3 className="w-3 h-3" />{camp.clickRate}% click rate</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Campaign</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Campaign name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <input required placeholder="Subject *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <textarea required placeholder="Email content *" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <input required type="number" placeholder="Number of recipients *" value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Create Campaign</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
