'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Users, Search, Mail, Phone, Pencil, Landmark } from 'lucide-react';
import { useToast } from '@/lib/toast';

interface Employee {
  id: string; name: string; email?: string | null; phone?: string | null;
  department?: string | null; position?: string | null; joinDate?: string | null;
  salary?: number | null; status: string; employeeCode?: string | null;
  bankName?: string | null; bankAccountNumber?: string | null; bankIfscCode?: string | null;
  pfNumber?: string | null; esiNumber?: string | null;
}

const BLANK = {
  name: '', email: '', phone: '', department: '', position: '', joinDate: '', salary: '',
  employeeCode: '', bankName: '', bankAccountNumber: '', bankIfscCode: '', pfNumber: '', esiNumber: '',
};

const inputClass = 'w-full px-4 py-2.5 rounded-xl glass-input text-sm';
const fieldStyle = { color: 'hsl(var(--foreground))' };

export default function EmployeesPage() {
  const { toast } = useToast();
  const { error: toastError, success: toastSuccess } = toast;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...BLANK });

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) setEmployees(await res.json());
      else toastError('Failed to load employees');
    } catch (e) {
      console.error(e);
      toastError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]); // eslint-disable-line react-hooks/set-state-in-effect

  const openAdd = () => {
    setForm({ ...BLANK });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (emp: Employee) => {
    setForm({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || '',
      position: emp.position || '',
      joinDate: emp.joinDate ? emp.joinDate.slice(0, 10) : '',
      salary: emp.salary != null ? String(emp.salary) : '',
      employeeCode: emp.employeeCode || '',
      bankName: emp.bankName || '',
      bankAccountNumber: emp.bankAccountNumber || '',
      bankIfscCode: emp.bankIfscCode || '',
      pfNumber: emp.pfNumber || '',
      esiNumber: emp.esiNumber || '',
    });
    setEditingId(emp.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        salary: form.salary === '' ? null : Number(form.salary),
        joinDate: form.joinDate || null,
        ...(editingId ? { id: editingId } : {}),
      };
      const res = await fetch('/api/employees', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(data.error || 'Failed to save employee');
        return;
      }
      setForm({ ...BLANK });
      setEditingId(null);
      setShowForm(false);
      fetchEmployees();
      toastSuccess(editingId ? 'Employee updated' : 'Employee added successfully');
    } catch (error) {
      console.error(error);
      toastError('Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const filtered = employees.filter((e) =>
    (e.name || '').toLowerCase().includes(search.toLowerCase())
    || (e.department || '').toLowerCase().includes(search.toLowerCase()));

  const depts = [...new Set(employees.map((e) => e.department).filter(Boolean))];
  const payslipReady = employees.filter((e) => e.bankAccountNumber && e.bankIfscCode).length;

  return (
    <div className="p-4 md:p-6 h-full overflow-auto" style={{ background: 'var(--page-gradient)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Employees</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Manage your team - bank details here feed payslips and the salary transfer file
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)', boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)' }}>
            <Plus className="w-4 h-4" /> Add Employee
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { l: 'Total', v: employees.length, c: 'hsl(252 60% 55%)' },
            { l: 'Active', v: employees.filter((e) => e.status === 'active').length, c: '#34d399' },
            { l: 'Departments', v: depts.length, c: '#a78bfa' },
            { l: 'Monthly Cost', v: `Rs.${employees.reduce((s, e) => s + (Number(e.salary) || 0), 0).toLocaleString('en-IN')}`, c: '#94a3b8' },
          ].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.l}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.c }}>{s.v}</p>
            </motion.div>
          ))}
        </div>

        {employees.length > 0 && payslipReady < employees.length && (
          <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50">
            <Landmark className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              {employees.length - payslipReady} of {employees.length} employees still have no bank account or IFSC.
              Their salary will show on the payslip but cannot go into the bank salary transfer file until you add it
              - click an employee card to fill it in.
            </p>
          </div>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees..."
            className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-sm" style={fieldStyle} />
        </div>

        {loading ? <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(var(--primary) / 0.3)' }} />
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>No employees yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((emp, i) => {
                const ready = Boolean(emp.bankAccountNumber && emp.bankIfscCode);
                return (
                  <motion.div key={emp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="glass-card p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold shrink-0"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.5))' }}>
                        {emp.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{emp.name}</h3>
                        <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{emp.position || '-'}</p>
                      </div>
                      <button onClick={() => openEdit(emp)} title="Edit employee"
                        className="p-2 rounded-xl transition-colors hover:bg-black/5"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                        <Mail className="w-3 h-3" />{emp.email || 'N/A'}
                      </p>
                      <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                        <Phone className="w-3 h-3" />{emp.phone || 'N/A'}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                        Dept: {emp.department || '-'}{emp.employeeCode ? ` · ${emp.employeeCode}` : ''}
                      </p>
                      <p className="text-sm font-bold mt-2" style={{ color: 'hsl(var(--primary))' }}>
                        Rs.{(Number(emp.salary) || 0).toLocaleString('en-IN')}/mo
                      </p>
                      <p className="text-[10px] flex items-center gap-1" style={{ color: ready ? '#34d399' : '#f59e0b' }}>
                        <Landmark className="w-3 h-3" />
                        {ready
                          ? `${emp.bankName || 'Bank'} ••••${String(emp.bankAccountNumber).slice(-4)} · ${emp.bankIfscCode}`
                          : 'Bank account & IFSC not added yet'}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  {editingId ? 'Edit Employee' : 'Add Employee'}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass} style={fieldStyle} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass} style={fieldStyle} />
                  <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputClass} style={fieldStyle} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className={inputClass} style={fieldStyle} />
                  <input placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className={inputClass} style={fieldStyle} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                    className={inputClass} style={fieldStyle} />
                  <input type="number" min="0" placeholder="Monthly salary (gross)" value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className={inputClass} style={fieldStyle} />
                </div>

                {/* Payroll identity is optional, so it stays out of the way until
                    someone is actually preparing payslips or a bank transfer. */}
                <details className="rounded-xl border border-white/10 p-3">
                  <summary className="text-xs font-semibold cursor-pointer select-none" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Salary & bank details (for payslips)
                  </summary>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <input placeholder="Employee code" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                      className={inputClass} style={fieldStyle} />
                    <input placeholder="PF / UAN number" value={form.pfNumber} onChange={(e) => setForm({ ...form, pfNumber: e.target.value })}
                      className={inputClass} style={fieldStyle} />
                    <input placeholder="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      className={inputClass} style={fieldStyle} />
                    <input placeholder="Account number" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                      className={inputClass} style={fieldStyle} />
                    <input placeholder="IFSC (e.g. HDFC0001234)" value={form.bankIfscCode} onChange={(e) => setForm({ ...form, bankIfscCode: e.target.value })}
                      className={inputClass} style={fieldStyle} />
                    <input placeholder="ESI number" value={form.esiNumber} onChange={(e) => setForm({ ...form, esiNumber: e.target.value })}
                      className={inputClass} style={fieldStyle} />
                  </div>
                  <p className="text-[10px] mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Printed on the payslip and used for the salary transfer file. Leave blank if you pay by cash or cheque.
                  </p>
                </details>

                <button type="submit" disabled={saving}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)' }}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Employee'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
