'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Calendar, Users } from 'lucide-react';

interface Attendance { _id: string; employee: { name: string }; date: string; checkIn?: string; checkOut?: string; status: string; }
interface Employee { _id: string; name: string; }

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee: '', date: '', checkIn: '', checkOut: '', status: 'present' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [attRes, empRes] = await Promise.all([fetch('/api/attendance'), fetch('/api/employees')]);
      if (attRes.ok) setAttendance(await attRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setForm({ employee: '', date: '', checkIn: '', checkOut: '', status: 'present' }); setShowForm(false); fetchData(); }
    } catch (e) { console.error(e); }
  };

  const statusColors: Record<string, string> = { present: '#34d399', absent: '#94a3b8', leave: '#a78bfa', holiday: 'hsl(252 60% 55%)' };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Attendance</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Track employee attendance</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Mark Attendance
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[{ l: 'Present', v: attendance.filter(a => a.status === 'present').length, c: '#34d399' },
            { l: 'Absent', v: attendance.filter(a => a.status === 'absent').length, c: '#94a3b8' },
            { l: 'On Leave', v: attendance.filter(a => a.status === 'leave').length, c: '#a78bfa' },
            { l: 'Holiday', v: attendance.filter(a => a.status === 'holiday').length, c: 'hsl(252 60% 55%)' }].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : attendance.length === 0 ? (
            <div className="text-center py-20"><Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No attendance records</p></div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead style={{ background: 'hsl(var(--muted))' }}>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((att) => (
                    <tr key={att._id} className="transition-colors" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td className="px-6 py-4 text-sm" style={{ color: 'hsl(var(--foreground))' }}>{att.employee?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(att.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{att.checkIn || '-'}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{att.checkOut || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize" style={{ background: statusColors[att.status] }}>{att.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Mark Attendance</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <select required value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  <option value="">Select Employee *</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
                <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="time" value={form.checkIn} onChange={e => setForm({ ...form, checkIn: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                  <input type="time" value={form.checkOut} onChange={e => setForm({ ...form, checkOut: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                </div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">On Leave</option>
                  <option value="holiday">Holiday</option>
                </select>
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)' }}>Mark Attendance</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
