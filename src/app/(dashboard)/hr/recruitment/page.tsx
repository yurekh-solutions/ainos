'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Users, Mail, Phone, Briefcase, Search, Star } from 'lucide-react';

interface Candidate { id: string; name: string; email: string; phone?: string; position: string; department?: string; source: string; status: string; experience?: number; expectedSalary?: number; skills?: string[]; rating?: number; createdAt: string; }

const statusColors: Record<string, string> = { applied: '#636e72', screening: '#0984e3', interview: '#fdcb6e', offer: '#6c5ce7', hired: '#00b894', rejected: '#d63031' };

export default function RecruitmentPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ name: '', email: '', phone: '', position: '', department: '', source: 'website', experience: '', expectedSalary: '', skills: '' });

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    try { const res = await fetch('/api/candidates'); if (res.ok) setCandidates(await res.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/candidates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, experience: Number(form.experience) || 0, expectedSalary: Number(form.expectedSalary) || 0, skills, status: 'applied' }) });
      if (res.ok) { setForm({ name: '', email: '', phone: '', position: '', department: '', source: 'website', experience: '', expectedSalary: '', skills: '' }); setShowForm(false); fetchCandidates(); }
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await fetch('/api/candidates', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); fetchCandidates(); } catch (e) { console.error(e); }
  };

  const filtered = candidates.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.position.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: candidates.length,
    screening: candidates.filter(c => c.status === 'screening').length,
    interview: candidates.filter(c => c.status === 'interview').length,
    offer: candidates.filter(c => c.status === 'offer').length,
    hired: candidates.filter(c => c.status === 'hired').length,
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Recruitment</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Applicant tracking & hiring pipeline</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Add Candidate
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Candidates', value: stats.total, gradient: 'from-violet-500 to-purple-600' },
            { label: 'Screening', value: stats.screening, gradient: 'from-blue-500 to-cyan-600' },
            { label: 'Interview', value: stats.interview, gradient: 'from-amber-500 to-orange-600' },
            { label: 'Offer', value: stats.offer, gradient: 'from-purple-500 to-indigo-600' },
            { label: 'Hired', value: stats.hired, gradient: 'from-emerald-500 to-teal-600' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }} className="relative p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.gradient} rounded-l-2xl`} />
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input type="text" placeholder="Search candidates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full glass-input pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="glass-input px-4 py-2.5 text-sm rounded-xl">
            <option value="all">All Status</option><option value="applied">Applied</option><option value="screening">Screening</option><option value="interview">Interview</option><option value="offer">Offer</option><option value="hired">Hired</option><option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)' }}>
              <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p style={{ color: 'hsl(var(--foreground))' }}>No candidates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }} className="relative p-5 rounded-2xl group"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: statusColors[c.status] || '#6c5ce7' }} />
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${statusColors[c.status] || '#6c5ce7'}, ${statusColors[c.status] || '#6c5ce7'}dd)` }}>
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{c.name}</p>
                        <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground))' }}><Briefcase className="w-3 h-3" /> {c.position}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: statusColors[c.status] || '#6c5ce7' }}>{c.status}</span>
                  </div>
                  <p className="text-xs mb-1 flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}><Mail className="w-3 h-3" /> {c.email}</p>
                  {c.phone && <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}><Phone className="w-3 h-3" /> {c.phone}</p>}
                  {c.department && <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Dept: {c.department}</p>}
                  {c.skills && c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.skills.slice(0, 4).map((skill, j) => (
                        <span key={j} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>{skill}</span>
                      ))}
                      {c.skills.length > 4 && <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>+{c.skills.length - 4}</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
                    <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.experience || 0} yrs exp</span>
                    <select value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer" style={{ background: 'hsl(var(--muted))', color: statusColors[c.status] }}>
                      <option value="applied">Applied</option><option value="screening">Screening</option><option value="interview">Interview</option><option value="offer">Offer</option><option value="hired">Hired</option><option value="rejected">Rejected</option>
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-md p-6 rounded-2xl max-h-[85vh] overflow-y-auto"
                style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 20px 60px -10px rgb(0 0 0 / 0.3)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Candidate</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input required placeholder="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <input required type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input required placeholder="Position *" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                      <option value="website">Website</option><option value="linkedin">LinkedIn</option><option value="referral">Referral</option><option value="agency">Agency</option><option value="other">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Experience (yrs)" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    <input type="number" placeholder="Expected Salary" value={form.expectedSalary} onChange={e => setForm({ ...form, expectedSalary: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  </div>
                  <input placeholder="Skills (comma separated)" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Add Candidate</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
