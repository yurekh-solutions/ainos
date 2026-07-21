'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, DollarSign, TrendingUp } from 'lucide-react';

interface Payroll { _id: string; employee: { name: string }; period: string; basicPay: number; allowances: number; deductions: number; netPay: number; status: string; }
interface Employee { _id: string; name: string; }

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee: '', period: '', basicPay: '', allowances: '0', deductions: '0' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [payRes, empRes] = await Promise.all([fetch('/api/payroll'), fetch('/api/employees')]);
      if (payRes.ok) setPayroll(await payRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const basicPay = Number(form.basicPay);
    const allowances = Number(form.allowances);
    const deductions = Number(form.deductions);
    const netPay = basicPay + allowances - deductions;
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, basicPay, allowances, deductions, netPay, status: 'pending' }),
      });
      if (res.ok) { setForm({ employee: '', period: '', basicPay: '', allowances: '0', deductions: '0' }); setShowForm(false); fetchData(); }
    } catch (e) { console.error(e); }
  };

  const totalPayroll = payroll.reduce((sum, p) => sum + p.netPay, 0);
  const pendingPayroll = payroll.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.netPay, 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Payroll</h1><p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage employee salaries</p></div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))', boxShadow: '0 8px 24px -6px hsl(var(--primary) / 0.4)' }}>
            <Plus className="w-4 h-4" /> Run Payroll
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[{ l: 'Total Payroll', v: `Rs.${totalPayroll.toLocaleString('en-IN')}`, c: 'hsl(var(--primary))' },
            { l: 'Pending', v: `Rs.${pendingPayroll.toLocaleString('en-IN')}`, c: '#a78bfa' },
            { l: 'Processed', v: payroll.filter(p => p.status === 'paid').length, c: '#34d399' },
            { l: 'Employees', v: payroll.length, c: '#94a3b8' }].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5 rounded-2xl">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : payroll.length === 0 ? (
            <div className="text-center py-20"><DollarSign className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} /><p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No payroll records</p></div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead style={{ background: 'hsl(var(--muted))' }}>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Period</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Basic</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Allowances</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Net Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map((pay) => (
                    <tr key={pay._id} style={{ borderBottom: '1px solid hsl(var(--border))' }} className="hover:opacity-80 transition-opacity">
                      <td className="px-6 py-4 text-sm" style={{ color: 'hsl(var(--foreground))' }}>{pay.employee?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{pay.period}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Rs.{pay.basicPay?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#34d399' }}>+Rs.{pay.allowances?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#94a3b8' }}>-Rs.{pay.deductions?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>Rs.{pay.netPay?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize`}
                          style={{ background: pay.status === 'paid' ? '#34d399' : '#a78bfa' }}>{pay.status}</span>
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
              className="glass-card rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Run Payroll</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:opacity-70"><X className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <select required value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm">
                  <option value="">Select Employee *</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
                <input required placeholder="Period (e.g., Jan 2026)" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <input required type="number" placeholder="Basic Pay *" value={form.basicPay} onChange={e => setForm({ ...form, basicPay: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Allowances" value={form.allowances} onChange={e => setForm({ ...form, allowances: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                  <input type="number" placeholder="Deductions" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm placeholder:opacity-50" />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}>Process Payroll</button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
