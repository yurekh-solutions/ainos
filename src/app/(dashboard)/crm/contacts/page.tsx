'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Search, Users, Tag, Phone, Mail, Building2, Target } from 'lucide-react';

interface Contact {
  _id: string; name: string; email?: string; phone?: string; company?: string;
  tags: string[]; source: string; dealValue?: number; stage: string; lastContacted?: string;
}

const stageColors: Record<string, string> = { lead: '#a78bfa', qualified: 'hsl(252 60% 55%)', proposal: '#34d399', negotiation: '#94a3b8', won: '#34d399', lost: '#64748b' };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', tags: '', source: 'manual', dealValue: '', stage: 'lead' });

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (stageFilter) params.set('stage', stageFilter);
      const res = await fetch(`/api/contacts?${params}`);
      if (res.ok) setContacts(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), dealValue: Number(form.dealValue) || 0 }),
      });
      if (res.ok) { setForm({ name: '', email: '', phone: '', company: '', tags: '', source: 'manual', dealValue: '', stage: 'lead' }); setShowForm(false); fetchContacts(); }
    } catch (e) { console.error(e); }
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase())
  );

  const stageCounts = contacts.reduce((acc, c) => { acc[c.stage] = (acc[c.stage] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Contacts</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage your leads and customer relationships</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))', boxShadow: '0 8px 24px -6px hsl(var(--primary) / 0.4)' }}>
            <Plus className="w-4 h-4" /> Add Contact
          </motion.button>
        </motion.div>

        {/* Stage Pipeline */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {Object.entries(stageColors).map(([stage, color]) => (
            <button key={stage} onClick={() => setStageFilter(stageFilter === stage ? '' : stage)}
              className={`p-3 rounded-xl border text-center transition-all ${stageFilter === stage ? 'ring-2 ring-[hsl(var(--primary))] border-[hsl(var(--primary))]' : 'glass-card'}`}
              style={{ borderColor: stageFilter === stage ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
              <p className="text-xs font-medium capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>{stage}</p>
              <p className="text-lg font-bold mt-1" style={{ color }}>{stageCounts[stage] || 0}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#94a3b8' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); }} placeholder="Search contacts..."
            className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-sm placeholder:opacity-50" />
        </div>

        {/* Contact List */}
        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} />
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No contacts found</p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Add your first contact</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((contact, i) => (
                <motion.div key={contact._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-5 rounded-2xl hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold"
                      style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.5))` }}>
                      {contact.name[0]?.toUpperCase()}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: stageColors[contact.stage] }}>{contact.stage}</span>
                  </div>
                  <h3 className="font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{contact.name}</h3>
                  {contact.company && <p className="text-xs flex items-center gap-1 mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}><Building2 className="w-3 h-3" />{contact.company}</p>}
                  {contact.email && <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#94a3b8' }}><Mail className="w-3 h-3" />{contact.email}</p>}
                  {contact.phone && <p className="text-xs flex items-center gap-1 mt-1" style={{ color: '#94a3b8' }}><Phone className="w-3 h-3" />{contact.phone}</p>}
                  {contact.dealValue ? <p className="text-sm font-bold mt-3" style={{ color: 'hsl(var(--primary))' }}>Rs.{contact.dealValue.toLocaleString('en-IN')}</p> : null}
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {contact.tags.map((tag, j) => (
                        <span key={j} className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}><Tag className="w-2.5 h-2.5" />{tag}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

        {/* Add Contact Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Contact</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                  <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                </div>
                <input placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Deal value" type="number" value={form.dealValue} onChange={e => setForm({ ...form, dealValue: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                  <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                    {Object.keys(stageColors).map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
                <input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Add Contact</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
