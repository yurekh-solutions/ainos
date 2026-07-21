'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Calendar, Clock } from 'lucide-react';

interface Leave { _id: string; employee: { name: string }; leaveType: string; startDate: string; endDate: string; days: number; reason?: string; status: string; }
interface Employee { _id: string; name: string; }

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee: '', leaveType: 'casual', startDate: '', endDate: '', reason: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [leaveRes, empRes] = await Promise.all([fetch('/api/leaves'), fetch('/api/employees')]);
      if (leaveRes.ok) setLeaves(await leaveRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, days }),
      });
      if (res.ok) { setForm({ employee: '', leaveType: 'casual', startDate: '', endDate: '', reason: '' }); setShowForm(false); fetchData(); }
    } catch (e) { console.error(e); }
  };

  const statusColors: Record<string, string> = { pending: '#a78bfa', approved: '#34d399', rejected: '#94a3b8' };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Leave Requests</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage employee time off</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Request Leave
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[{ l: 'Total', v: leaves.length, c: 'hsl(252 60% 55%)' },
            { l: 'Pending', v: leaves.filter(l => l.status === 'pending').length, c: '#a78bfa' },
            { l: 'Approved', v: leaves.filter(l => l.status === 'approved').length, c: '#34d399' },
            { l: 'Total Days', v: leaves.reduce((s, l) => s + l.days, 0), c: '#94a3b8' }].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : leaves.length === 0 ? (
            <div className="text-center py-20"><Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No leave requests</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaves.map((leave, i) => (
                <motion.div key={leave._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div><h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{leave.employee?.name || 'N/A'}</h3>
                      <p className="text-xs capitalize mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{leave.leaveType} Leave</p></div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: statusColors[leave.status] }}>{leave.status}</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}><Calendar className="w-3 h-3" />{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}><Clock className="w-3 h-3" />{leave.days} day(s)</p>
                    {leave.reason && <p className="text-xs mt-2 italic" style={{ color: 'hsl(var(--muted-foreground))' }}>&ldquo;{leave.reason}&rdquo;</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Request Leave</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <select required value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  <option value="">Select Employee *</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
                <select value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  <option value="casual">Casual</option><option value="sick">Sick</option><option value="earned">Earned</option><option value="unpaid">Unpaid</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                  <input required type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                </div>
                <textarea placeholder="Reason (optional)" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)' }}>Submit Request</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
