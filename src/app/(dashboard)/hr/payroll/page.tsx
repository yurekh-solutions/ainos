'use client';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calculator, CheckCircle, Download, FileText, Landmark, Loader2,
  RotateCcw, Settings2, Table2, Trash2, Users,
} from 'lucide-react';
import { useToast } from '@/lib/toast';

// Payroll screen.
//
// Three things happen here, in this order:
//   1. Preview  - the server splits every salary into statutory components and
//                 shows it, so the number on screen is the number that gets saved.
//   2. Adjust   - any component can be typed over for this one month only.
//                 Clearing a box hands it back to the statutory default.
//   3. Document - payslip PDFs, the bank salary sheet and the payroll register,
//                 all read back from the saved payslips.
//
// Nothing is mandatory: a company that has never opened the settings still gets
// PF/ESI at the national rates, and a company that does not mark attendance is
// never short-paid.

interface Breakdown {
  basic: number; hra: number; specialAllowance: number; conveyance: number;
  overtime: number; bonus: number; arrears: number; otherEarnings: number; grossEarnings: number;
  pfEmployee: number; esiEmployee: number; professionalTax: number; incomeTax: number;
  loanDeduction: number; advanceDeduction: number; lossOfPay: number; otherDeductions: number;
  totalDeductions: number; netPay: number; netPayWords: string;
  pfEmployer: number; esiEmployer: number; employerTotal: number; totalCostToCompany: number;
  totalWorkingDays: number; daysPresent: number; perDayRate: number; overridden: string[];
}

interface PreviewRow {
  employeeId: string; employeeName: string; designatory: string | null; department: string | null;
  employeeCode: string | null; gross: number; absentDays: number; bankAccountNumber: string | null;
  breakdown: Breakdown;
}

interface Preview {
  period: string; companyName: string; skipped: number;
  totals: {
    employees: number; earnings: number; deductions: number;
    netPay: number; employerContributions: number; costToCompany: number;
  };
  settings: {
    basicPercentage: number; hraPercentage: number; pfEnabled: boolean; pfEmployeePercentage: number;
    pfWageCeiling: number; esiEnabled: boolean; esiWageCeiling: number; professionalTax: number;
    workingDaysPerMonth: number;
  };
  payslips: PreviewRow[];
}

interface Run {
  id: string; period: string; startDate: string; endDate: string;
  totalAmount: number; totalEarnings: number | null; totalDeductions: number | null;
  totalNet: number | null; employeeCount: number | null; notes: string | null;
  status: string; createdAt: string; _count?: { payslips: number };
}

interface Payslip {
  id: string; employeeId: string; employeeName: string; designatory: string | null;
  department: string | null; employeeCode: string | null; bankAccountNumber: string | null;
  bankIfscCode: string | null; grossEarnings: number; totalDeductions: number; netPay: number;
  pfEmployer: number; esiEmployer: number; daysPresent: number; totalWorkingDays: number;
  status: string; paidAt: string | null;
}

interface RunDetail extends Run { payslips: Payslip[] }

type Field = Exclude<keyof Breakdown, 'netPayWords' | 'overridden'>;

// Components a person may type over for one month. Grouped so the rarely used
// ones live behind a per-employee expander instead of stretching the table.
const MAIN_EARNINGS: Field[] = ['basic', 'hra', 'specialAllowance', 'conveyance', 'overtime', 'bonus', 'arrears'];
const MAIN_DEDUCTIONS: Field[] = ['pfEmployee', 'esiEmployee', 'professionalTax', 'incomeTax', 'lossOfPay'];
const MORE_FIELDS: Array<{ key: Field; label: string }> = [
  { key: 'otherEarnings', label: 'Other earnings' },
  { key: 'loanDeduction', label: 'Loan deduction' },
  { key: 'advanceDeduction', label: 'Advance recovery' },
  { key: 'otherDeductions', label: 'Other deductions' },
  { key: 'totalWorkingDays', label: 'Working days in month' },
];

const money = (value: number | null | undefined) =>
  `Rs.${(Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const amount = (value: number | null | undefined) =>
  (Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function monthDefaults() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const label = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { period: label, startDate: iso(start), endDate: iso(end) };
}

export default function PayrollPage() {
  const { toast } = useToast();
  const { success: toastSuccess, error: toastError } = toast;

  const [runs, setRuns] = useState<Run[]>([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 'runs' = the history list, 'preview' = the salary sheet before saving,
  // 'detail' = one saved run with its downloads, 'settings' = statutory setup.
  const [view, setView] = useState<'runs' | 'preview' | 'detail' | 'settings'>('runs');

  const [form, setForm] = useState(monthDefaults);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [calculating, setCalculating] = useState(false);

  // What has been typed in, as strings, per employee. Empty means "not overridden".
  const [inputs, setInputs] = useState<Record<string, Partial<Record<string, string>>>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const recalcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const [payRes, empRes] = await Promise.all([fetch('/api/payroll'), fetch('/api/employees')]);
      if (payRes.ok) setRuns(await payRes.json());
      if (empRes.ok) {
        const employees = await empRes.json();
        setEmployeeCount(employees.filter((e: { status: string }) => e.status === 'active').length);
      }
    } catch (e) {
      console.error(e);
      toastError('Could not load payroll');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { fetchList(); }, [fetchList]); // eslint-disable-line react-hooks/set-state-in-effect

  useEffect(() => () => {
    if (recalcTimer.current) clearTimeout(recalcTimer.current);
  }, []);

  const overridesFromInputs = useCallback(() => {
    const overrides: Record<string, Record<string, number>> = {};
    for (const [employeeId, fields] of Object.entries(inputs)) {
      const clean: Record<string, number> = {};
      for (const [key, value] of Object.entries(fields)) {
        const text = String(value ?? '').trim();
        if (!text) continue;
        const n = Number(text);
        if (Number.isFinite(n) && n >= 0) clean[key] = n;
      }
      if (Object.keys(clean).length) overrides[employeeId] = clean;
    }
    return overrides;
  }, [inputs]);

  /** Asks the server for the split. The same endpoint writes it on confirm. */
  const runPreview = useCallback(async (overrides: Record<string, Record<string, number>>) => {
    if (!form.startDate || !form.endDate) return;
    setCalculating(true);
    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun: true, period: form.period, startDate: form.startDate, endDate: form.endDate, overrides,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || 'Could not calculate payroll');
        setPreview(null);
        return;
      }
      setPreview(data);
    } catch (e) {
      console.error(e);
      toastError('Could not calculate payroll');
    } finally {
      setCalculating(false);
    }
  }, [form, toastError]);

  const openRun = () => {
    setForm(monthDefaults());
    setInputs({});
    setNotes('');
    setPreview(null);
    setView('preview');
  };

  // Recalculate a moment after typing stops, so a half-typed figure is not sent.
  useEffect(() => {
    if (view !== 'preview') return;
    if (recalcTimer.current) clearTimeout(recalcTimer.current);
    recalcTimer.current = setTimeout(() => { runPreview(overridesFromInputs()); }, 450);
    return () => { if (recalcTimer.current) clearTimeout(recalcTimer.current); };
  }, [view, inputs, form.startDate, form.endDate, overridesFromInputs, runPreview]);

  const setField = (employeeId: string, key: Field, value: string) => {
    setInputs((prev) => ({ ...prev, [employeeId]: { ...prev[employeeId], [key]: value } }));
  };

  const clearOverrides = (employeeId: string) => {
    setInputs((prev) => {
      const next = { ...prev };
      delete next[employeeId];
      return next;
    });
  };

  const confirmRun = async () => {
    if (!preview) return;
    setBusy('confirm');
    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun: false,
          period: form.period,
          startDate: form.startDate,
          endDate: form.endDate,
          notes,
          overrides: overridesFromInputs(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || 'Could not save payroll');
        return;
      }
      setDetail(data.run);
      setView('detail');
      fetchList();
      toastSuccess(`${data.run.payslips.length} payslips generated for ${data.run.period}`);
    } catch (e) {
      console.error(e);
      toastError('Could not save payroll');
    } finally {
      setBusy(null);
    }
  };

  const openDetail = async (id: string) => {
    setBusy('detail');
    try {
      const res = await fetch(`/api/payroll/${id}`);
      const data = await res.json();
      if (!res.ok) { toastError(data.error || 'Run not found'); return; }
      setDetail(data);
      setView('detail');
    } catch (e) {
      console.error(e);
      toastError('Run not found');
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (id: string, status: 'paid' | 'pending') => {
    setBusy(status);
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) { toastError(data.error || 'Could not update'); return; }
      toastSuccess(status === 'paid' ? 'Marked paid - payslips released' : 'Moved back to pending');
      await Promise.all([fetchList(), detail?.id === id ? openDetail(id) : Promise.resolve()]);
    } catch (e) {
      console.error(e);
      toastError('Could not update');
    } finally {
      setBusy(null);
    }
  };

  const deleteRun = async (id: string) => {
    setBusy('delete');
    try {
      const res = await fetch(`/api/payroll/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toastError(data.error || 'Could not delete');
        return;
      }
      toastSuccess('Payroll run deleted');
      setView('runs');
      setDetail(null);
      fetchList();
    } catch (e) {
      console.error(e);
      toastError('Could not delete');
    } finally {
      setBusy(null);
    }
  };

  /** Downloads always go through fetch so a JSON error can be shown, not saved. */
  const download = async (path: string, fallbackName: string) => {
    setBusy('download');
    try {
      const res = await fetch(path);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toastError(data.error || 'Could not prepare the file');
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = match ? match[1] : fallbackName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toastSuccess('Download started');
    } catch (e) {
      console.error(e);
      toastError('Could not prepare the file');
    } finally {
      setBusy(null);
    }
  };

  const totals = preview?.totals;
  const paidOut = useMemo(() => runs.reduce((sum, r) => sum + (Number(r.totalNet ?? r.totalAmount) || 0), 0), [runs]);
  const pending = useMemo(
    () => runs.filter((r) => r.status === 'pending').reduce((sum, r) => sum + (Number(r.totalNet ?? r.totalAmount) || 0), 0),
    [runs],
  );

  const inputClass = 'w-[92px] px-2 py-1.5 rounded-lg text-xs text-right tabular-nums bg-gray-50 border border-gray-200 '
    + 'focus:outline-none focus:border-purple-500 focus:bg-white transition-colors';

  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-gray-50">
      <div className="max-w-[1400px] mx-auto">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {view !== 'runs' && (
              <button onClick={() => setView('runs')}
                className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {view === 'preview' ? 'Run Payroll' : view === 'detail' ? detail?.period || 'Payroll Run' : view === 'settings' ? 'Payroll Settings' : 'Payroll'}
              </h1>
              <p className="text-sm mt-1 text-gray-600">
                {view === 'preview'
                  ? 'Statutory split shown before anything is saved - PF, ESI and loss of pay included'
                  : view === 'detail'
                    ? 'Payslips, bank salary sheet and payroll register for this month'
                    : view === 'settings'
                      ? 'Company defaults used when a salary is split'
                      : 'Monthly salaries, payslips and bank transfers'}
              </p>
            </div>
          </div>
          {view === 'runs' && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setView('settings')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                <Settings2 className="w-4 h-4" /> Settings
              </button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openRun}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-colors">
                <Calculator className="w-4 h-4" /> Run Payroll
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* ── Runs list ──────────────────────────────────────────────────── */}
        {view === 'runs' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { l: 'Total Paid Out', v: money(paidOut), c: 'text-purple-600', icon: Landmark },
                { l: 'Pending', v: money(pending), c: 'text-amber-600', icon: CheckCircle },
                { l: 'Runs Created', v: String(runs.length), c: 'text-emerald-600', icon: FileText },
                { l: 'Active Employees', v: String(employeeCount), c: 'text-blue-600', icon: Users },
              ].map((s, i) => (
                <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className={`w-4 h-4 ${s.c}`} />
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{s.l}</p>
                  </div>
                  <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
                </motion.div>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : runs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No payroll runs yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Click &quot;Run Payroll&quot;. Salaries are taken from the Employees page, and PF and ESI are
                  added at statutory rates automatically.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200">
                        {['Period', 'Duration', 'Employees', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((run) => (
                        <tr key={run.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{run.period}</td>
                          <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(run.startDate).toLocaleDateString('en-IN')} - {new Date(run.endDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">{run.employeeCount ?? run._count?.payslips ?? '-'}</td>
                          <td className="px-4 py-4 text-sm text-gray-700 tabular-nums">{money(run.totalEarnings)}</td>
                          <td className="px-4 py-4 text-sm text-gray-500 tabular-nums">{money(run.totalDeductions)}</td>
                          <td className="px-4 py-4 text-sm font-bold text-purple-600 tabular-nums">{money(run.totalNet ?? run.totalAmount)}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize ${
                              run.status === 'paid' ? 'bg-emerald-500' : run.status === 'pending' ? 'bg-amber-500' : 'bg-gray-400'
                            }`}>{run.status}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3 whitespace-nowrap">
                              <button onClick={() => openDetail(run.id)} className="text-xs text-purple-600 hover:underline font-medium">
                                Payslips
                              </button>
                              {run.status === 'pending' && (
                                <button onClick={() => setStatus(run.id, 'paid')} disabled={busy === 'paid'}
                                  className="text-xs text-emerald-600 hover:underline font-medium">
                                  Mark Paid
                                </button>
                              )}
                              <button onClick={() => deleteRun(run.id)} disabled={busy === 'delete'}
                                className="text-xs text-gray-400 hover:text-red-500 font-medium">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Preview / adjust ───────────────────────────────────────────── */}
        {view === 'preview' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Period</span>
                  <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Start date</span>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">End date</span>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500" />
                </label>
              </div>
              {preview?.settings && (
                <p className="text-xs text-gray-500 mt-3">
                  Using {preview.settings.basicPercentage}% basic, {preview.settings.hraPercentage}% HRA of basic,
                  PF {preview.settings.pfEnabled ? `${preview.settings.pfEmployeePercentage}% up to ${money(preview.settings.pfWageCeiling)}` : 'off'}
                  {' '}and ESI {preview.settings.esiEnabled ? `up to ${money(preview.settings.esiWageCeiling)}` : 'off'}
                  {' '}- {preview.settings.workingDaysPerMonth} working days. Change these in Settings.
                </p>
              )}
            </div>

            {totals && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { l: 'Gross Earnings', v: money(totals.earnings), c: 'text-gray-900' },
                  { l: 'Deductions', v: money(totals.deductions), c: 'text-red-500' },
                  { l: 'Net Pay', v: money(totals.netPay), c: 'text-purple-600' },
                  { l: 'Employer PF + ESI', v: money(totals.employerContributions), c: 'text-amber-600' },
                  { l: 'Cost to Company', v: money(totals.costToCompany), c: 'text-blue-600' },
                ].map((t) => (
                  <div key={t.l} className="bg-white rounded-2xl border border-gray-200 p-4">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{t.l}</p>
                    <p className={`text-lg font-bold mt-1 tabular-nums ${t.c}`}>{t.v}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Table2 className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Salary sheet</h2>
                  <span className="text-xs text-gray-500">
                    {preview ? `${preview.payslips.length} employee${preview.payslips.length === 1 ? '' : 's'}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {calculating && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                  {Object.keys(inputs).length > 0 && (
                    <button onClick={() => setInputs({})}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium">
                      <RotateCcw className="w-3.5 h-3.5" /> Clear all adjustments
                    </button>
                  )}
                </div>
              </div>

              {!preview && !calculating ? (
                <p className="text-sm text-gray-500 py-16 text-center">No employees with a monthly salary were found. Add salaries on the Employees page.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1250px]">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-2.5 text-left font-semibold sticky left-0 bg-gray-50">Employee</th>
                        <th className="px-2 py-2.5 text-right font-semibold">Gross</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-purple-600">Basic</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-purple-600">HRA</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-purple-600">Spl. Allow.</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-purple-600">Convey.</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-purple-600">Overtime</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-purple-600">Bonus</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-purple-600">Arrears</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-red-500">PF</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-red-500">ESI</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-red-500">PT</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-red-500">TDS</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-red-500">Loss of Pay</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-red-500">Days</th>
                        <th className="px-2 py-2.5 text-right font-semibold">Deduct.</th>
                        <th className="px-2 py-2.5 text-right font-semibold">Net Pay</th>
                        <th className="px-2 py-2.5 text-center font-semibold">Row</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview?.payslips.map((row) => {
                        const b = row.breakdown;
                        const typed = inputs[row.employeeId] || {};
                        const cellValue = (key: Field, fallback: number) => {
                          const v = typed[key];
                          return v === undefined ? String(fallback) : v;
                        };
                        return (
                          <Fragment key={row.employeeId}>
                            <tr className="border-b border-gray-100 hover:bg-gray-50/60">
                              <td className="px-3 py-2 sticky left-0 bg-white">
                                <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{row.employeeName}</p>
                                <p className="text-[10px] text-gray-500 whitespace-nowrap">
                                  {row.designatory || row.department || 'Employee'}
                                  {row.absentDays > 0 && <span className="text-amber-600"> · {row.absentDays} absent</span>}
                                  {!row.bankAccountNumber && <span className="text-red-400"> · no a/c</span>}
                                </p>
                              </td>
                              <td className="px-2 py-2 text-xs text-gray-600 text-right tabular-nums">{amount(row.gross)}</td>
                              {MAIN_EARNINGS.map((key) => (
                                <td key={key} className="px-1.5 py-2 text-right">
                                  <input value={cellValue(key, b[key])} inputMode="decimal" placeholder="0"
                                    onChange={(e) => setField(row.employeeId, key, e.target.value)}
                                    className={inputClass} />
                                </td>
                              ))}
                              {MAIN_DEDUCTIONS.map((key) => (
                                <td key={key} className="px-1.5 py-2 text-right">
                                  <input value={cellValue(key, b[key])} inputMode="decimal" placeholder="0"
                                    onChange={(e) => setField(row.employeeId, key, e.target.value)}
                                    className={inputClass} />
                                </td>
                              ))}
                              <td className="px-1.5 py-2 text-right">
                                <input value={cellValue('daysPresent', b.daysPresent)} inputMode="numeric"
                                  onChange={(e) => setField(row.employeeId, 'daysPresent', e.target.value)}
                                  className="w-[56px] px-2 py-1.5 rounded-lg text-xs text-right tabular-nums bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500" />
                              </td>
                              <td className="px-2 py-2 text-xs text-red-500 text-right tabular-nums">{amount(b.totalDeductions)}</td>
                              <td className="px-2 py-2 text-sm font-semibold text-purple-600 text-right tabular-nums">{amount(b.netPay)}</td>
                              <td className="px-2 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => setExpanded(expanded === row.employeeId ? null : row.employeeId)}
                                    className="text-[10px] px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100">
                                    {expanded === row.employeeId ? 'Close' : 'More'}
                                  </button>
                                  {Object.keys(typed).length > 0 && (
                                    <button onClick={() => clearOverrides(row.employeeId)} title="Back to statutory defaults"
                                      className="p-1 rounded-lg text-gray-400 hover:text-purple-600">
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {expanded === row.employeeId && (
                              <tr className="bg-purple-50/40 border-b border-gray-100">
                                <td colSpan={18} className="px-4 py-3">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {MORE_FIELDS.map(({ key, label }) => (
                                      <label key={String(key)} className="block">
                                        <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
                                        <input value={cellValue(key, b[key])} inputMode="decimal"
                                          onChange={(e) => setField(row.employeeId, key, e.target.value)}
                                          className="mt-1 w-full px-2 py-1.5 rounded-lg text-xs text-right tabular-nums bg-white border border-gray-200 focus:outline-none focus:border-purple-500" />
                                      </label>
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-2">
                                    Net pay: {b.netPayWords}. Empty box means the statutory default, {money(b.perDayRate)} per day
                                    is used for loss of pay.
                                  </p>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                      {totals && (
                        <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-xs">
                          <td className="px-3 py-2.5 sticky left-0 bg-gray-50 text-gray-700">TOTAL</td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-gray-700">
                            {amount(preview?.payslips.reduce((s, r) => s + r.gross, 0) ?? 0)}
                          </td>
                          <td colSpan={13} className="px-2 py-2.5 text-right text-[10px] uppercase text-gray-500">
                            {preview?.payslips.length ?? 0} payslips
                            {preview && preview.skipped > 0 ? ` · ${preview.skipped} skipped (no salary)` : ''}
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-red-500">{amount(totals.deductions)}</td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-purple-600">{amount(totals.netPay)}</td>
                          <td />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-end gap-3">
              <label className="block flex-1">
                <span className="text-xs font-medium text-gray-600">Note for this month (optional)</span>
                <input value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Diwali bonus included for warehouse staff"
                  className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500" />
              </label>
              <div className="flex gap-2">
                <button onClick={() => setView('runs')} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100">
                  Cancel
                </button>
                <button onClick={confirmRun} disabled={!preview || busy === 'confirm' || calculating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors">
                  {busy === 'confirm' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Generate {totals?.employees ?? 0} Payslips - {money(totals?.netPay)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Saved run: payslips and documents ──────────────────────────── */}
        {view === 'detail' && detail && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    {new Date(detail.startDate).toLocaleDateString('en-IN')} - {new Date(detail.endDate).toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-2xl font-bold text-purple-600 tabular-nums mt-1">{money(detail.totalNet ?? detail.totalAmount)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Net to {detail.employeeCount ?? detail.payslips.length} employees
                    {detail.totalEarnings ? ` · gross ${money(detail.totalEarnings)} · deductions ${money(detail.totalDeductions)}` : ''}
                  </p>
                  {detail.notes && <p className="text-xs text-gray-600 mt-2 italic">{detail.notes}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => download(`/api/payroll/${detail.id}/payslips-pdf`, 'payslips.pdf')} disabled={busy === 'download'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                    <FileText className="w-4 h-4" /> All Payslips (PDF)
                  </button>
                  <button onClick={() => download(`/api/payroll/${detail.id}/bank-file?type=bank`, 'salary-transfer.csv')} disabled={busy === 'download'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                    <Landmark className="w-4 h-4" /> Bank Salary Sheet
                  </button>
                  <button onClick={() => download(`/api/payroll/${detail.id}/bank-file?type=register`, 'payroll-register.csv')} disabled={busy === 'download'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" /> Payroll Register
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                {detail.status === 'pending' ? (
                  <button onClick={() => setStatus(detail.id, 'paid')} disabled={busy === 'paid'}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                    <CheckCircle className="w-4 h-4" /> Mark as Paid
                  </button>
                ) : (
                  <button onClick={() => setStatus(detail.id, 'pending')} disabled={busy === 'pending'}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    <RotateCcw className="w-4 h-4" /> Back to Pending
                  </button>
                )}
                <button onClick={() => deleteRun(detail.id)} disabled={busy === 'delete'}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete Run
                </button>
                <span className={`self-center px-2.5 py-1 rounded-full text-[10px] font-semibold text-white capitalize ${
                  detail.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}>{detail.status}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      {['Employee', 'Code', 'Days', 'Gross', 'Deductions', 'Net Pay', 'Account', 'Payslip'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.payslips.map((slip) => (
                      <tr key={slip.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{slip.employeeName}</p>
                          <p className="text-[10px] text-gray-500">{slip.designatory || slip.department || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{slip.employeeCode || '-'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 tabular-nums">
                          {Math.round(slip.daysPresent)}/{Math.round(slip.totalWorkingDays)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 tabular-nums">{amount(slip.grossEarnings)}</td>
                        <td className="px-4 py-3 text-xs text-red-500 tabular-nums">{amount(slip.totalDeductions)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-purple-600 tabular-nums">{amount(slip.netPay)}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {slip.bankAccountNumber ? (
                            <span title={slip.bankIfscCode || ''}>{`••••${String(slip.bankAccountNumber).slice(-4)}`}</span>
                          ) : (
                            <span className="text-red-400">Add in Employees</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => download(`/api/payroll/${detail.id}/payslip/${slip.employeeId}?format=pdf`, 'payslip.pdf')}
                            disabled={busy === 'download'}
                            className="flex items-center gap-1.5 text-xs text-purple-600 hover:underline font-medium">
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Settings ───────────────────────────────────────────────────── */}
        {view === 'settings' && <SettingsPanel onBack={() => setView('runs')} />}
      </div>
    </div>
  );
}

function SettingsPanel({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const { success: toastSuccess, error: toastError } = toast;

  const [settings, setSettings] = useState<Record<string, number | boolean> | null>(null);
  const [identity, setIdentity] = useState<{ pfNumber: string; esiNumber: string; companyCode: string; footerNote: string }>({
    pfNumber: '', esiNumber: '', companyCode: '', footerNote: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/payroll/config')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setSettings(data.settings);
        setIdentity({
          pfNumber: data.identity?.pfNumber || '',
          esiNumber: data.identity?.esiNumber || '',
          companyCode: data.identity?.companyCode || '',
          footerNote: data.identity?.footerNote || '',
        });
      })
      .catch((e) => { console.error(e); toastError('Could not load payroll settings'); });
    return () => { active = false; };
  }, [toastError]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/payroll/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, ...identity }),
      });
      const data = await res.json();
      if (!res.ok) { toastError(data.error || 'Could not save settings'); return; }
      setSettings(data.settings);
      setIdentity(data.identity);
      toastSuccess('Payroll settings saved');
      onBack();
    } catch (e) {
      console.error(e);
      toastError('Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-gray-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading settings...
      </div>
    );
  }

  const num = (key: string, label: string, hint: string, step = 1) => (
    <label key={key} className="block">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <input type="number" step={step} value={Number(settings[key] ?? 0)}
        onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value) })}
        className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500" />
      <span className="block text-[10px] text-gray-400 mt-1">{hint}</span>
    </label>
  );

  const toggle = (key: string, label: string) => (
    <label key={key} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      <input type="checkbox" checked={Boolean(settings[key])}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
        className="w-4 h-4 accent-purple-600" />
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Salary split</h2>
        <p className="text-xs text-gray-500 mb-4">
          How a monthly gross salary is divided. Whatever is left after basic and HRA becomes a special
          allowance, so the parts always add up to the salary you entered.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {num('basicPercentage', 'Basic (% of gross)', 'Usually 40-50%')}
          {num('hraPercentage', 'HRA (% of basic)', 'Generally 40%, or 50% in metro cities')}
          {num('workingDaysPerMonth', 'Working days per month', 'Used for the per-day rate and loss of pay')}
          {num('professionalTax', 'Professional tax (Rs./month)', 'Keep 0 unless your state charges it')}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Provident Fund (EPFO)</h2>
        <p className="text-xs text-gray-500 mb-4">
          Statutory: 12% of basic from the employee and 12% from the employer, on wages up to Rs.15,000.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {toggle('pfEnabled', 'Deduct and pay PF')}
          {num('pfEmployeePercentage', 'Employee rate (%)', 'Standard 12')}
          {num('pfEmployerPercentage', 'Employer rate (%)', 'Standard 12')}
          {num('pfWageCeiling', 'Wage ceiling (Rs.)', 'Standard 15,000')}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Employee State Insurance (ESIC)</h2>
        <p className="text-xs text-gray-500 mb-4">
          Statutory: employee 0.75% and employer 3.25% of gross wages, only while gross is Rs.21,000 or less.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {toggle('esiEnabled', 'Deduct and pay ESI')}
          {num('esiEmployeePercentage', 'Employee rate (%)', 'Standard 0.75')}
          {num('esiEmployerPercentage', 'Employer rate (%)', 'Standard 3.25')}
          {num('esiWageCeiling', 'Gross wage ceiling (Rs.)', 'Standard 21,000')}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Numbers printed on the payslip</h2>
        <p className="text-xs text-gray-500 mb-4">
          Optional. Your establishment&apos;s PF and ESI registration numbers appear in the payslip header,
          which is what an employee needs for the EPFO/ESIC portal.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-gray-600">PF registration no.</span>
            <input value={identity.pfNumber} onChange={(e) => setIdentity({ ...identity, pfNumber: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-600">ESI registration no.</span>
            <input value={identity.esiNumber} onChange={(e) => setIdentity({ ...identity, esiNumber: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-600">Company / branch code</span>
            <input value={identity.companyCode} onChange={(e) => setIdentity({ ...identity, companyCode: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500" />
          </label>
        </div>
        <label className="block mt-4">
          <span className="text-xs font-medium text-gray-600">Note at the bottom of every payslip</span>
          <input value={identity.footerNote} onChange={(e) => setIdentity({ ...identity, footerNote: e.target.value })}
            placeholder="e.g. For any salary query, write to hr@yourcompany.com"
            className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500" />
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Income tax (TDS) is never calculated automatically - it depends on the employee&apos;s other income
          and investments, so it is typed per employee while running payroll.
        </p>
        <div className="flex gap-2 shrink-0 ml-4">
          <button onClick={onBack} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
