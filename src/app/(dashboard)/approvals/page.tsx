'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, CheckSquare, Loader2, Pencil, Plus, Search, Trash2, XCircle } from 'lucide-react';

interface ApprovalRow {
  id: string;
  title: string;
  category: string;
  amount: number;
  requesterName: string;
  approverName?: string | null;
  description?: string | null;
  status: string;
  decidedAt?: string | null;
  decisionNote?: string | null;
  createdById?: string | null;
  createdAt: string;
}

interface Summary {
  pending: number;
  approvedMonth: number;
  refused: number;
  pendingAmount: number;
}

const CATEGORY_LABEL: Record<string, string> = {
  purchase: 'Purchase',
  expense: 'Expense',
  leave: 'Leave',
  budget: 'Budget',
  other: 'Other',
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
  refused: { label: 'Refused', className: 'bg-rose-100 text-rose-700' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600' },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'refused', label: 'Refused' },
];

const money = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const day = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
};

export default function ApprovalsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, approvedMonth: 0, refused: 0, pendingAmount: 0 });
  const [canManage, setCanManage] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [confirmId, setConfirmId] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('status', tab);
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/approvals?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not load approval requests');
      setRows(data.requests || []);
      setSummary(data.summary || { pending: 0, approvedMonth: 0, refused: 0, pendingAmount: 0 });
      setCanManage(Boolean(data.canManage));
      setCanApprove(Boolean(data.canApprove));
      setCurrentUserId(data.currentUserId || '');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not load approval requests');
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const decide = async (row: ApprovalRow, status: 'approved' | 'refused') => {
    setBusyId(row.id);
    try {
      const res = await fetch('/api/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update this request');
      setToast(`${row.title} → ${status}`);
      await load();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not update this request');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/approvals?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete this request');
      setToast('Approval request deleted');
      setConfirmId('');
      await load();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not delete this request');
    } finally {
      setBusyId('');
    }
  };

  // Members never see decision buttons, and nobody can sign off their own request.
  const canDecide = (row: ApprovalRow) => canApprove && row.createdById !== currentUserId;

  const kpis = [
    { label: 'Pending', value: summary.pending, tone: 'text-amber-600' },
    { label: 'Value awaiting approval', value: money(summary.pendingAmount), tone: 'text-violet-600' },
    { label: 'Approved this month', value: summary.approvedMonth, tone: 'text-emerald-600' },
    { label: 'Refused', value: summary.refused, tone: 'text-rose-600' },
  ];

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-5 pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              Approvals
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Purchase, expense, leave and budget requests with a recorded decision trail
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/approvals/new')}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
            }}
          >
            <Plus className="h-4 w-4" />
            New request
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-2xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {kpi.label}
              </p>
              <p className={`mt-2 text-2xl font-bold ${kpi.tone}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setTab(item.id);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === item.id ? 'text-white' : 'hover:bg-black/5'}`}
                  style={
                    tab === item.id
                      ? { background: 'hsl(var(--primary))' }
                      : { color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border) / 0.6)' }
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <input
                value={search}
                onChange={(event) => {
                  setLoading(true);
                  setSearch(event.target.value);
                }}
                placeholder="Search title, requester or approver"
                className="glass-input w-full rounded-xl py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading requests…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <CheckSquare className="mx-auto h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="mt-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Nothing to approve
              </p>
              <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Submit a request to start the approval trail.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">Request</th>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">Requester</th>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">Approver</th>
                      <th className="py-2 pr-3 text-right text-xs font-semibold uppercase tracking-wide">Amount</th>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">Status</th>
                      <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const meta = STATUS_META[row.status] || { label: row.status, className: 'bg-slate-100 text-slate-700' };
                      return (
                        <tr key={row.id} style={{ borderTop: '1px solid hsl(var(--border) / 0.6)' }}>
                          <td className="py-3 pr-3">
                            <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                              {row.title}
                            </p>
                            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {CATEGORY_LABEL[row.category] || row.category} · {day(row.createdAt)}
                            </p>
                          </td>
                          <td className="py-3 pr-3" style={{ color: 'hsl(var(--foreground))' }}>
                            {row.requesterName}
                          </td>
                          <td className="py-3 pr-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {row.approverName || '—'}
                          </td>
                          <td className="py-3 pr-3 text-right font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {money(row.amount)}
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-1">
                              {row.status === 'pending' && canDecide(row) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => decide(row, 'approved')}
                                    disabled={busyId === row.id}
                                    className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                                    style={{ borderColor: 'hsl(var(--border))' }}
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => decide(row, 'refused')}
                                    disabled={busyId === row.id}
                                    className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                                    style={{ borderColor: 'hsl(var(--border))' }}
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Refuse
                                  </button>
                                </>
                              )}
                              {row.status === 'pending' && !canDecide(row) && row.createdById === currentUserId && (
                                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                  Awaiting another approver
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => router.push(`/approvals/${row.id}/edit`)}
                                className="rounded-lg p-1.5 transition hover:bg-black/5"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
                                aria-label="Edit approval request"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {canManage &&
                                (confirmId === row.id ? (
                                  <span className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => remove(row.id)}
                                      disabled={busyId === row.id}
                                      className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmId('')}
                                      className="rounded-lg border px-2 py-1 text-xs font-semibold"
                                      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                                    >
                                      No
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmId(row.id)}
                                    className="rounded-lg p-1.5 transition hover:bg-rose-50"
                                    style={{ color: 'hsl(var(--error))' }}
                                    aria-label="Delete approval request"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 lg:hidden">
                {rows.map((row) => {
                  const meta = STATUS_META[row.status] || { label: row.status, className: 'bg-slate-100 text-slate-700' };
                  return (
                    <div key={row.id} className="rounded-xl p-3" style={{ border: '1px solid hsl(var(--border) / 0.7)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {row.title}
                          </p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {row.requesterName} · {CATEGORY_LABEL[row.category] || row.category}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                      </div>
                      <p className="mt-2 text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                        {money(row.amount)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {row.status === 'pending' && canDecide(row) && (
                          <>
                            <button
                              type="button"
                              onClick={() => decide(row, 'approved')}
                              disabled={busyId === row.id}
                              className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                              style={{ borderColor: 'hsl(var(--border))' }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => decide(row, 'refused')}
                              disabled={busyId === row.id}
                              className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50"
                              style={{ borderColor: 'hsl(var(--border))' }}
                            >
                              Refuse
                            </button>
                          </>
                        )}
                        {row.status === 'pending' && !canDecide(row) && row.createdById === currentUserId && (
                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Awaiting another approver
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => router.push(`/approvals/${row.id}/edit`)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        >
                          Edit
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => remove(row.id)}
                            disabled={busyId === row.id}
                            className="ml-auto rounded-lg p-1.5 disabled:opacity-50"
                            style={{ color: 'hsl(var(--error))' }}
                            aria-label="Delete approval request"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg" style={{ background: 'hsl(var(--foreground))' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
