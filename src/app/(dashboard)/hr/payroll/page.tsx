'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, DollarSign, Users, Calculator, CheckCircle } from 'lucide-react';

interface PayrollRun { id: string; period: string; startDate: string; endDate: string; totalAmount: number; status: string; processedBy: string | null; createdAt: string; }
interface Employee { id: string; name: string; department: string | null; salary: number | null; status: string; position: string | null; }

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<PayrollRun[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ period: '', startDate: '', endDate: '' });
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<{ total: number; count: number; breakdown: { name: string; salary: number }[] } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [payRes, empRes] = await Promise.all([fetch('/api/payroll'), fetch('/api/employees')]);
      if (payRes.ok) setPayroll(await payRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]); // eslint-disable-line

  // Auto-calculate payroll from active employees' salaries
  const handleCalculate = () => {
    setCalculating(true);
    const activeEmployees = employees.filter(e => e.status === 'active' && e.salary && e.salary > 0);
    const breakdown = activeEmployees.map(e => ({ name: e.name, salary: e.salary || 0 }));
    const total = breakdown.reduce((sum, e) => sum + e.salary, 0);
    setCalcResult({ total, count: activeEmployees.length, breakdown });
    setCalculating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcResult) return;
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: form.period,
          startDate: new Date(form.startDate),
          endDate: new Date(form.endDate),
          totalAmount: calcResult.total,
          status: 'pending',
        }),
      });
      if (res.ok) {
        setForm({ period: '', startDate: '', endDate: '' });
        setCalcResult(null);
        setShowForm(false);
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const handleProcess = async (id: string) => {
    try {
      const res = await fetch(`/api/payroll?id=${id}`, { method: 'PUT' });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const totalPayroll = payroll.reduce((sum, p) => sum + p.totalAmount, 0);
  const pendingPayroll = payroll.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.totalAmount, 0);
  const activeEmployees = employees.filter(e => e.status === 'active');
  const avgSalary = activeEmployees.length > 0
    ? activeEmployees.reduce((sum, e) => sum + (e.salary || 0), 0) / activeEmployees.length
    : 0;

  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Payroll</h1>
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Manage employee salaries & payments</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setShowForm(true); handleCalculate(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-colors">
            <Calculator className="w-4 h-4" /> Run Payroll
          </motion.button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { l: 'Total Payroll', v: `Rs.${totalPayroll.toLocaleString('en-IN')}`, c: 'text-purple-600 dark:text-purple-400', icon: DollarSign },
            { l: 'Pending', v: `Rs.${pendingPayroll.toLocaleString('en-IN')}`, c: 'text-amber-600 dark:text-amber-400', icon: DollarSign },
            { l: 'Processed', v: payroll.filter(p => p.status === 'paid').length.toString(), c: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
            { l: 'Active Employees', v: activeEmployees.length.toString(), c: 'text-blue-600 dark:text-blue-400', icon: Users },
          ].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.c}`} />
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{s.l}</p>
              </div>
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {/* Payroll Table */}
        {loading ? <div className="text-center py-20 text-gray-500">Loading...</div>
          : payroll.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No payroll records yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click &quot;Run Payroll&quot; to create your first payroll</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.map((pay) => (
                      <tr key={pay.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{pay.period}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(pay.startDate).toLocaleDateString()} - {new Date(pay.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-purple-600 dark:text-purple-400">Rs.{pay.totalAmount?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize ${
                            pay.status === 'paid' ? 'bg-emerald-500' : pay.status === 'pending' ? 'bg-amber-500' : 'bg-gray-400'
                          }`}>{pay.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          {pay.status === 'pending' && (
                            <button onClick={() => handleProcess(pay.id)} className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">
                              Mark as Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Run Payroll Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Run Payroll</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Period *</label>
                  <input required placeholder="e.g., August 2026" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date *</label>
                    <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Date *</label>
                    <input required type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>

                {/* Auto-calculation */}
                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200">Auto-Calculated from Employees</h3>
                    <button type="button" onClick={handleCalculate} disabled={calculating}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">
                      {calculating ? 'Calculating...' : 'Recalculate'}
                    </button>
                  </div>
                  {calcResult ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{calcResult.count} active employees</span>
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">Rs.{calcResult.total.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-auto">
                        {calcResult.breakdown.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                            <span className="text-gray-900 dark:text-white font-medium">Rs.{item.salary.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                        {calcResult.count === 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">No employees with salary set. Add salaries in Employees page.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Calculating...</p>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Salary per Employee</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Rs.{Math.round(avgSalary).toLocaleString('en-IN')}</span>
                </div>

                <button type="submit" disabled={!calcResult || calcResult.total === 0}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Process Payroll - Rs.{calcResult?.total.toLocaleString('en-IN') || '0'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
