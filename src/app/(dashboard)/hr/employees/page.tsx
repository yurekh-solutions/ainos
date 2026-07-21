'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Users, Search, Mail, Phone } from 'lucide-react';

interface Employee { _id: string; name: string; email?: string; phone?: string; department: string; position: string; joinDate: string; salary: number; status: string; }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', position: '', joinDate: '', salary: '' });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try { const res = await fetch('/api/employees'); if (res.ok) setEmployees(await res.json()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, salary: Number(form.salary) }) });
      if (res.ok) { setForm({ name: '', email: '', phone: '', department: '', position: '', joinDate: '', salary: '' }); setShowForm(false); fetchEmployees(); }
    } catch (e) { console.error(e); }
  };

  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase()));
  const depts = [...new Set(employees.map(e => e.department))];

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Employees</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage your team</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Add Employee
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[{ l: 'Total', v: employees.length, c: 'hsl(252 60% 55%)' }, { l: 'Active', v: employees.filter(e => e.status === 'active').length, c: '#34d399' }, { l: 'Departments', v: depts.length, c: '#a78bfa' }, { l: 'Monthly Cost', v: `Rs.${employees.reduce((s, e) => s + e.salary, 0).toLocaleString('en-IN')}`, c: '#94a3b8' }].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..."
            className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-20"><Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No employees yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((emp, i) => (
                <motion.div key={emp._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.5))' }}>
                      {emp.name[0]?.toUpperCase()}
                    </div>
                    <div><h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{emp.name}</h3><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{emp.position}</p></div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}><Mail className="w-3 h-3" />{emp.email || 'N/A'}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}><Phone className="w-3 h-3" />{emp.phone || 'N/A'}</p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>Dept: {emp.department}</p>
                    <p className="text-sm font-bold mt-2" style={{ color: 'hsl(var(--primary))' }}>Rs.{emp.salary?.toLocaleString('en-IN') || 0}/mo</p>
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
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Employee</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Full name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                  <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Department *" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                  <input required placeholder="Position *" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                  <input required type="number" placeholder="Monthly salary *" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm" style={{ color: 'hsl(var(--foreground))' }} />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)' }}>Add Employee</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
