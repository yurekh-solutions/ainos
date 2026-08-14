'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Clock, Search, Calendar, CheckCircle } from 'lucide-react';

interface Timesheet { _id: string; employee: string; project: string; task: string; date: string; startTime: string; endTime: string; duration: number; billable: boolean; status: string; createdAt: string; }

const statusColors: Record<string, string> = { draft: '#636e72', submitted: '#0984e3', approved: '#00b894', rejected: '#d63031' };

export default function TimesheetPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ employee: '', project: '', task: '', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '17:00', billable: true });

  useEffect(() => { fetchTimesheets(); }, []);

  const fetchTimesheets = async () => {
    try { const res = await fetch('/api/timesheets'); if (res.ok) setTimesheets(await res.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const [sh, sm] = form.startTime.split(':').map(Number);
      const [eh, em] = form.endTime.split(':').map(Number);
      const duration = (eh * 60 + em - sh * 60 - sm) / 60;
      const res = await fetch('/api/timesheets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, duration: Math.max(0, duration), status: 'draft' }) });
      if (res.ok) { setForm({ employee: '', project: '', task: '', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '17:00', billable: true }); setShowForm(false); fetchTimesheets(); }
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await fetch('/api/timesheets', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); fetchTimesheets(); } catch (e) { console.error(e); }
  };

  const filtered = timesheets.filter(t => {
    const matchSearch = t.employee.toLowerCase().includes(searchTerm.toLowerCase()) || t.project.toLowerCase().includes(searchTerm.toLowerCase()) || t.task.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalHours = timesheets.reduce((s, t) => s + t.duration, 0);
  const billableHours = timesheets.filter(t => t.billable).reduce((s, t) => s + t.duration, 0);
  const pending = timesheets.filter(t => t.status === 'submitted').length;
  const approved = timesheets.filter(t => t.status === 'approved').length;

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Timesheets</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Track employee time and project hours</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Add Entry
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, gradient: 'from-violet-500 to-purple-600' },
            { label: 'Billable Hours', value: `${billableHours.toFixed(1)}h`, gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Pending Approval', value: pending, gradient: 'from-amber-500 to-orange-600' },
            { label: 'Approved', value: approved, gradient: 'from-blue-500 to-cyan-600' },
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
            <input type="text" placeholder="Search timesheets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full glass-input pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="glass-input px-4 py-2.5 text-sm rounded-xl">
            <option value="all">All Status</option><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-20 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)' }}>
              <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p style={{ color: 'hsl(var(--foreground))' }}>No timesheet entries found</p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 4px 20px -4px rgb(0 0 0 / 0.08)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Project</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Task</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Billable</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t._id} style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }} className="hover:opacity-80 transition-opacity">
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t.employee}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>{t.project}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{t.task}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{t.duration.toFixed(1)}h</td>
                      <td className="px-4 py-3">{t.billable ? <CheckCircle className="w-4 h-4" style={{ color: '#00b894' }} /> : <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>No</span>}</td>
                      <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: statusColors[t.status] }}>{t.status}</span></td>
                      <td className="px-4 py-3">
                        <select value={t.status} onChange={(e) => updateStatus(t._id, e.target.value)}
                          className="text-[10px] font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer" style={{ background: 'hsl(var(--muted))', color: statusColors[t.status] }}>
                          <option value="draft">Draft</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-md p-6 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid hsl(var(--border) / 0.5)', boxShadow: '0 20px 60px -10px rgb(0 0 0 / 0.3)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Timesheet Entry</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input required placeholder="Employee Name *" value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <input required placeholder="Project *" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <input required placeholder="Task *" value={form.task} onChange={e => setForm({ ...form, task: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>Start Time</label>
                      <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'hsl(var(--muted-foreground))' }}>End Time</label>
                      <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-sm" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.billable} onChange={e => setForm({ ...form, billable: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>Billable</span>
                  </label>
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Add Entry</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
