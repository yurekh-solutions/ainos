'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Download,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowRight,
} from 'lucide-react';

interface ExpenseRow {
  id: string;
  title: string;
  category: string;
  vendor: string | null;
  description: string | null;
  amount: number;
  taxAmount: number;
  paymentMethod: string;
  date: string;
  receipt: string | null;
  status: string;
  submittedBy: string | null;
  approvedBy: string | null;
  approvalNote?: string | null;
  rejectionReason: string | null;
  reimbursedAt: string | null;
  createdAt: string;
}

interface Summary {
  monthTotal: number;
  monthCount: number;
  previousMonthTotal: number;
  changePercent: number | null;
  pendingAmount: number;
  pendingCount: number;
  reimbursedMonth: number;
  byCategory: { category: string; amount: number; count: number }[];
  trend: { label: string; amount: number }[];
  trendPeak: number;
  periodTotal: number;
}

const CATEGORIES = [
  'Travel',
  'Food',
  'Office Supplies',
  'Software',
  'Marketing',
  'Utilities',
  'Rent',
  'Salary',
  'Maintenance',
  'Transport',
  'Professional Fees',
  'Other',
];

const STATUS_STYLES: Record<string, { label: string; className: string; dot: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  reimbursed: { label: 'Reimbursed', className: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank: 'Bank transfer',
  cheque: 'Cheque',
  credit: 'Credit',
};

const PERIODS = [
  { id: 'month', label: 'This month' },
  { id: 'last', label: 'Last month' },
  { id: 'year', label: 'This year' },
  { id: 'all', label: 'All time' },
] as const;

type PeriodId = (typeof PERIODS)[number]['id'];

function inr(value: number): string {
  return `Rs.${Math.round(value).toLocaleString('en-IN')}`;
}

function periodRange(period: PeriodId): { from?: string; to?: string } {
  const now = new Date();
  const iso = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  if (period === 'month') {
    return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
  }
  if (period === 'last') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: iso(start), to: iso(end) };
  }
  if (period === 'year') {
    return { from: iso(new Date(now.getFullYear(), 0, 1)), to: iso(now) };
  }
  return {};
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [canApprove, setCanApprove] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState('');

  const [period, setPeriod] = useState<PeriodId>('month');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');

  const [rejectingId, setRejectingId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { from, to } = periodRange(period);
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (status !== 'all') params.set('status', status);
      if (category !== 'all') params.set('category', category);
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not load expenses');
      }
      const data = await res.json();
      setExpenses(data.expenses || []);
      setSummary(data.summary || null);
      setCanApprove(Boolean(data.canApprove));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load expenses');
    } finally {
      setLoading(false);
    }
  }, [period, status, category, search]);

  useEffect(() => {
    const timer = setTimeout(fetchExpenses, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchExpenses, search]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const changeStatus = async (id: string, next: string, reason?: string) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next, rejectionReason: reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      setToast(`Expense marked ${next}`);
      setRejectingId('');
      setRejectReason('');
      await fetchExpenses();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId('');
    }
  };

  const removeExpense = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setToast('Expense deleted');
      setDeletingId('');
      await fetchExpenses();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  };

  const exportCsv = () => {
    if (!expenses.length) {
      setToast('Nothing to export for this filter');
      return;
    }
    const header = ['Date', 'Title', 'Category', 'Vendor', 'Payment', 'Amount', 'Tax', 'Status', 'Submitted by', 'Approved by'];
    const lines = expenses.map((row) =>
      [
        new Date(row.date).toISOString().slice(0, 10),
        row.title,
        row.category,
        row.vendor || '',
        PAYMENT_LABELS[row.paymentMethod] || row.paymentMethod,
        row.amount,
        row.taxAmount,
        row.status,
        row.submittedBy || '',
        row.approvedBy || '',
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const topCategories = useMemo(() => {
    const list = summary?.byCategory || [];
    const peak = Math.max(...list.map((entry) => entry.amount), 0);
    return list.slice(0, 5).map((entry) => ({
      ...entry,
      share: peak > 0 ? Math.max(6, Math.round((entry.amount / peak) * 100)) : 0,
    }));
  }, [summary]);

  const trend = summary?.trend || [];
  const trendPeak = summary?.trendPeak || 0;
  const change = summary?.changePercent;

  const renderActions = (row: ExpenseRow) => (
    <div className="flex flex-wrap items-center gap-2">
      {canApprove && row.status === 'pending' && (
        <>
          <button
            type="button"
            disabled={busyId === row.id}
            onClick={() => changeStatus(row.id, 'approved')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              setRejectingId(rejectingId === row.id ? '' : row.id);
              setRejectReason('');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </button>
        </>
      )}
      {canApprove && row.status === 'approved' && (
        <button
          type="button"
          disabled={busyId === row.id}
          onClick={() => changeStatus(row.id, 'reimbursed')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reimburse
        </button>
      )}
      <Link
        href={`/finance/expenses/${row.id}/edit`}
        className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        aria-label={`Edit ${row.title}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>
      {deletingId === row.id ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
          Delete?
          <button type="button" onClick={() => removeExpense(row.id)} className="underline">
            Yes
          </button>
          <button type="button" onClick={() => setDeletingId('')} className="underline">
            No
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setDeletingId(row.id)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Delete ${row.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const rejectForm = (row: ExpenseRow) =>
    rejectingId === row.id ? (
      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3">
        <label className="mb-1 block text-xs font-semibold text-rose-800" htmlFor={`reason-${row.id}`}>
          Reason for rejecting {row.title}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={`reason-${row.id}`}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="e.g. Missing bill, duplicate claim"
            className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-400"
          />
          <button
            type="button"
            disabled={busyId === row.id}
            onClick={() => changeStatus(row.id, 'rejected', rejectReason || 'No reason provided')}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
          >
            Confirm reject
          </button>
          <button
            type="button"
            onClick={() => {
              setRejectingId('');
              setRejectReason('');
            }}
            className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-7xl space-y-6 pb-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
              Expenses
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Record spend, route claims for approval and reimburse your team
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-black/5"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <Link
              href="/finance/expenses/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
              }}
            >
              <Plus className="h-4 w-4" />
              Add expense
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Spent this month',
              value: summary ? inr(summary.monthTotal) : '—',
              hint: summary ? `${summary.monthCount} entries` : '',
              icon: Wallet,
              tint: 'from-violet-500 to-purple-600',
              change,
            },
            {
              label: 'Awaiting approval',
              value: summary ? inr(summary.pendingAmount) : '—',
              hint: summary ? `${summary.pendingCount} in the queue` : '',
              icon: Clock,
              tint: 'from-amber-500 to-orange-600',
            },
            {
              label: 'Reimbursed this month',
              value: summary ? inr(summary.reimbursedMonth) : '—',
              hint: 'Paid back to the team',
              icon: RotateCcw,
              tint: 'from-emerald-500 to-teal-600',
            },
            {
              label: 'Selected period',
              value: summary ? inr(summary.periodTotal) : '—',
              hint: `${expenses.length} records in view`,
              icon: Receipt,
              tint: 'from-sky-500 to-blue-600',
            },
          ].map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative overflow-hidden rounded-2xl p-4 pl-5"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
                border: '1px solid hsl(var(--border) / 0.5)',
                boxShadow: '0 4px 20px -6px rgb(0 0 0 / 0.08)',
              }}
            >
              <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${card.tint}`} />
              <div className="flex items-start justify-between gap-3">
                <p
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {card.label}
                </p>
                <card.icon className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </div>
              <p className="mt-2 text-xl font-bold leading-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
                {card.value}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <span>{card.hint}</span>
                {card.change !== undefined && card.change !== null && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                      card.change > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {card.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(card.change)}% vs last month
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div
            className="rounded-2xl p-5 xl:col-span-2"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Six month spend
              </h2>
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Excludes rejected claims
              </span>
            </div>
            <div className="mt-4 flex h-40 items-end gap-2 sm:gap-4">
              {trend.map((entry, index) => {
                const height = trendPeak > 0 ? Math.max(4, Math.round((entry.amount / trendPeak) * 100)) : 4;
                const isLatest = index === trend.length - 1;
                return (
                  <div key={`${entry.label}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {entry.amount > 0 ? inr(entry.amount) : ''}
                    </span>
                    <div
                      className={`w-full rounded-t-lg ${isLatest ? 'bg-violet-500' : 'bg-violet-200'}`}
                      style={{ height: `${height}%` }}
                      title={`${entry.label}: ${inr(entry.amount)}`}
                    />
                    <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {entry.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Where the money goes
              </h2>
              <Link href="/finance/tally" className="text-xs font-semibold text-violet-600 hover:underline">
                Tally view
              </Link>
            </div>
            {topCategories.length === 0 ? (
              <p className="mt-6 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                No expenses in this period yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {topCategories.map((entry) => (
                  <li key={entry.category}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        {entry.category}
                      </span>
                      <span className="shrink-0 font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {inr(entry.amount)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${entry.share}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div
          className="rounded-2xl p-4 md:p-5"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1 rounded-xl p-1" style={{ background: 'hsl(var(--muted))' }}>
              {PERIODS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setPeriod(entry.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    period === entry.id ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
              <div className="relative sm:col-span-1">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title or vendor"
                  className="glass-input w-full py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="glass-input rounded-xl px-3 py-2 text-sm"
              >
                <option value="all">All status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="reimbursed">Reimbursed</option>
              </select>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="glass-input rounded-xl px-3 py-2 text-sm"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading expenses…
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="mx-auto mb-3 h-10 w-10" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                No expenses in this view
              </p>
              <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Change the filters, or record your first expense.
              </p>
              <Link
                href="/finance/expenses/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Add expense
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="mt-4 hidden lg:block">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border) / 0.6)' }}>
                      {['Date', 'Expense', 'Category', 'Paid via', 'Amount', 'Status', 'Actions'].map((heading) => (
                        <th
                          key={heading}
                          className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((row) => {
                      const tone = STATUS_STYLES[row.status] || STATUS_STYLES.pending;
                      return (
                        <tr key={row.id} style={{ borderBottom: '1px solid hsl(var(--border) / 0.35)' }}>
                          <td className="whitespace-nowrap px-3 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </td>
                          <td className="max-w-[240px] px-3 py-3">
                            <p className="truncate text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                              {row.title}
                            </p>
                            <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {row.vendor || row.description || 'No vendor'}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {row.category}
                          </td>
                          <td className="px-3 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {PAYMENT_LABELS[row.paymentMethod] || row.paymentMethod}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                            {inr(row.amount)}
                            {row.taxAmount > 0 && (
                              <span className="ml-1 text-[11px] font-normal" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                +{inr(row.taxAmount)} tax
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone.className}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                              {tone.label}
                            </span>
                            {row.rejectionReason && row.status === 'rejected' && (
                              <p className="mt-1 max-w-[180px] text-[11px] text-rose-600">{row.rejectionReason}</p>
                            )}
                          </td>
                          <td className="px-3 py-3">{renderActions(row)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {rejectingId && (
                  <div className="mt-2">
                    {expenses
                      .filter((row) => row.id === rejectingId)
                      .map((row) => (
                        <div key={row.id}>{rejectForm(row)}</div>
                      ))}
                  </div>
                )}
              </div>

              {/* Mobile cards */}
              <div className="mt-4 space-y-3 lg:hidden">
                {expenses.map((row) => {
                  const tone = STATUS_STYLES[row.status] || STATUS_STYLES.pending;
                  return (
                    <div
                      key={row.id}
                      className="rounded-xl p-4"
                      style={{ border: '1px solid hsl(var(--border) / 0.6)', background: 'hsl(var(--secondary) / 0.4)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug" style={{ color: 'hsl(var(--foreground))' }}>
                            {row.title}
                          </p>
                          <p className="mt-0.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {row.vendor || 'No vendor'} · {row.category}
                          </p>
                        </div>
                        <p className="shrink-0 text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                          {inr(row.amount)}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-semibold ${tone.className}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                          {tone.label}
                        </span>
                        <span>{new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <span>{PAYMENT_LABELS[row.paymentMethod] || row.paymentMethod}</span>
                      </div>
                      {row.rejectionReason && row.status === 'rejected' && (
                        <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1 text-xs text-rose-700">{row.rejectionReason}</p>
                      )}
                      <div className="mt-3">{renderActions(row)}</div>
                      {rejectForm(row)}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
