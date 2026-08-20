'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Users, Mail, Phone, Building2, TrendingUp, Filter, Search } from 'lucide-react';

interface Lead { id: string; name: string; email: string; phone?: string; company?: string; designation?: string; source: string; status: string; score?: number; estimatedValue?: number; notes?: string; tags?: string[]; createdAt: string; }

const statusColors: Record<string, string> = { new: '#6c5ce7', contacted: '#0984e3', qualified: '#00b894', proposal: '#fdcb6e', negotiation: '#e17055', converted: '#00b894', lost: '#636e72' };
const sourceIcons: Record<string, string> = { website: '🌐', referral: '', social: '📱', email: '📧', cold_call: '📞', event: '🎪', other: '' };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', designation: '', source: 'website', status: 'new', estimatedValue: '', notes: '' });

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) setLeads(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, estimatedValue: Number(form.estimatedValue) || 0 }),
      });
      if (res.ok) { setForm({ name: '', email: '', phone: '', company: '', designation: '', source: 'website', status: 'new', estimatedValue: '', notes: '' }); setShowForm(false); fetchLeads(); }
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/leads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      fetchLeads();
    } catch (e) { console.error(e); }
  };

  const filteredLeads = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.email.toLowerCase().includes(searchTerm.toLowerCase()) || l.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    totalValue: leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Leads</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage your sales pipeline</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Add Lead
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Leads', value: stats.total, icon: Users, gradient: 'from-violet-500 to-purple-600' },
            { label: 'New', value: stats.new, icon: TrendingUp, gradient: 'from-blue-500 to-cyan-600' },
            { label: 'Qualified', value: stats.qualified, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Converted', value: stats.converted, icon: TrendingUp, gradient: 'from-green-500 to-emerald-600' },
            { label: 'Pipeline Value', value: `Rs.${stats.totalValue.toLocaleString('en-IN')}`, icon: TrendingUp, gradient: 'from-amber-500 to-orange-600' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }} className="relative p-4 rounded-2xl group"
              style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.gradient} rounded-l-2xl`} />
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input type="text" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass-input pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="glass-input px-4 py-2.5 text-sm rounded-xl">
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {/* Leads Grid */}
        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filteredLeads.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)' }}>
              <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p style={{ color: 'hsl(var(--foreground))' }}>No leads found</p>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Add your first lead to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeads.map((lead, i) => (
                <motion.div key={lead.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }} className="relative p-5 rounded-2xl group"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: statusColors[lead.status] || '#6c5ce7' }} />
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${statusColors[lead.status] || '#6c5ce7'}, ${statusColors[lead.status] || '#6c5ce7'}dd)` }}>
                        {lead.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{lead.name}</p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{lead.designation || 'No designation'}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize"
                      style={{ background: statusColors[lead.status] || '#6c5ce7' }}>{lead.status}</span>
                  </div>

                  {lead.company && <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}><Building2 className="w-3 h-3" /> {lead.company}</p>}
                  <p className="text-xs mb-1 flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}><Mail className="w-3 h-3" /> {lead.email}</p>
                  {lead.phone && <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}><Phone className="w-3 h-3" /> {lead.phone}</p>}
                  
                  {lead.estimatedValue ? <p className="text-xs font-semibold mb-3" style={{ color: 'hsl(var(--primary))' }}>Value: Rs.{lead.estimatedValue.toLocaleString('en-IN')}</p> : null}
                  
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
                    <span className="text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{sourceIcons[lead.source] || '📋'} {lead.source.replace('_', ' ')}</span>
                    <select value={lead.status} onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer"
                      style={{ background: 'hsl(var(--muted))', color: statusColors[lead.status] }}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        {/* Add Lead Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-md p-6 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 20px 60px -10px rgb(0 0 0 / 0.3)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add New Lead</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input required placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <input required type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Designation" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input type="number" placeholder="Est. Value" value={form.estimatedValue} onChange={e => setForm({ ...form, estimatedValue: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                      <option value="website">Website</option><option value="referral">Referral</option><option value="social">Social</option><option value="email">Email</option><option value="cold_call">Cold Call</option><option value="event">Event</option><option value="other">Other</option>
                    </select>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                      <option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="negotiation">Negotiation</option>
                    </select>
                  </div>
                  <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" rows={3} />
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Create Lead</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
