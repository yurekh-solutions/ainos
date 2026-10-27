'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, ClipboardCheck, Loader2, Pencil, Plus, Search, ShieldCheck, Trash2, TrendingUp, XCircle } from 'lucide-react';

interface ChecklistRow {
  item: string;
  pass: boolean;
  notes?: string;
}

interface QualityCheck {
  id: string;
  title: string;
  type: string;
  status: string;
  inspector: string | null;
  inspectedAt: string | null;
  notes: string | null;
  checklist: ChecklistRow[] | null;
  createdAt: string;
}

interface Summary {
  pending: number;
  passedMonth: number;
  failedMonth: number;
  passRate: number | null;
  total: number;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-sky-50 text-sky-700 border-sky-200',
  passed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
];

function labelize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function day(value: string | null): string {
  if (!value) return 'Not inspected';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function tally(rows: ChecklistRow[] | null) {
  const list = Array.isArray(rows) ? rows.filter((row) => row?.item) : [];
  return {
    total: list.length,
    passed: list.filter((row) => row.pass).length,
    failed: list.filter((row) => !row.pass).length,
  };
}

export default function QualityPage() {
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (type !== 'all') params.set('type', type);
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/quality?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not load quality checks');
      }
      const data = await res.json();
      setChecks(data.checks || []);
      setSummary(data.summary || null);
      setCanManage(Boolean(data.canManage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load quality checks');
    } finally {
      setLoading(false);
    }
  }, [status, type, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const mark = async (id: string, next: string) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/quality', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      setToast(next === 'passed' ? 'Marked as passed' : 'Marked as failed');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/quality?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setToast('Quality check deleted');
      setDeletingId('');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <div className="mx-auto max-w-7xl space-y-5 pb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              Quality
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Inspections, tests and audits with a pass/fail checklist
            </p>
          </div>
          <Link
            href="/operations/quality/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
            }}
          >
            <Plus className="h-4 w-4" />
            New check
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Pending',
              value: summary ? String(summary.pending) : '—',
              hint: summary ? `${summary.total} checks in total` : '',
              icon: ClipboardCheck,
              tint: 'from-sky-500 to-blue-600',
            },
            {
              label: 'Passed this month',
              value: summary ? String(summary.passedMonth) : '—',
              hint: 'Inspections cleared',
              icon: CheckCircle2,
              tint: 'from-emerald-500 to-teal-600',
            },
            {
              label: 'Failed this month',
              value: summary ? String(summary.failedMonth) : '—',
              hint: 'Needs corrective action',
              icon: XCircle,
              tint: 'from-rose-500 to-red-600',
            },
            {
              label: 'Pass rate',
              value: summary?.passRate !== null && summary?.passRate !== undefined ? `${summary.passRate}%` : '—',
              hint: 'Of this month’s decided checks',
              icon: TrendingUp,
              tint: 'from-violet-500 to-purple-600',
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
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {card.label}
                </p>
                <card.icon className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </div>
              <p className="mt-2 text-xl font-bold leading-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
                {card.value}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {card.hint}
              </p>
            </motion.div>
          ))}
        </div>

        <div
          className="rounded-2xl p-4 md:p-5"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1 rounded-xl p-1" style={{ background: 'hsl(var(--muted))' }}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatus(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    status === tab.id ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search check or inspector"
                  className="glass-input w-full py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="glass-input rounded-xl px-3 py-2 text-sm"
              >
                <option value="all">Any type</option>
                <option value="inspection">Inspection</option>
                <option value="test">Test</option>
                <option value="audit">Audit</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading quality checks…
            </div>
          ) : checks.length === 0 ? (
            <div className="py-16 text-center">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                No quality checks yet
              </p>
              <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Log an inspection to start the pass/fail history.
              </p>
              <Link
                href="/operations/quality/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                New check
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                      <th className="pb-3 pr-3 font-semibold">Check</th>
                      <th className="pb-3 pr-3 font-semibold">Type</th>
                      <th className="pb-3 pr-3 font-semibold">Checklist</th>
                      <th className="pb-3 pr-3 font-semibold">Inspector</th>
                      <th className="pb-3 pr-3 font-semibold">Result</th>
                      <th className="pb-3 pr-3 font-semibold">Inspected</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((check) => {
                      const counts = tally(check.checklist);
                      return (
                        <tr key={check.id} className="border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.6)' }}>
                          <td className="py-3 pr-3">
                            <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                              {check.title}
                            </p>
                            {check.notes && (
                              <p className="max-w-[260px] truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {check.notes}
                              </p>
                            )}
                          </td>
                          <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            {labelize(check.type)}
                          </td>
                          <td className="py-3 pr-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {counts.total === 0 ? '—' : `${counts.passed}/${counts.total} passed`}
                          </td>
                          <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            {check.inspector || '—'}
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[check.status] || STATUS_STYLES.pending}`}>
                              {labelize(check.status)}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            {day(check.inspectedAt)}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {check.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={busyId === check.id}
                                    onClick={() => mark(check.id, 'passed')}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                  >
                                    {busyId === check.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                    Pass
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyId === check.id}
                                    onClick={() => mark(check.id, 'failed')}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Fail
                                  </button>
                                </>
                              )}
                              <Link
                                href={`/operations/quality/${check.id}/edit`}
                                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Link>
                              {deletingId === check.id ? (
                                <span className="inline-flex items-center gap-1.5 text-xs">
                                  <button
                                    type="button"
                                    disabled={busyId === check.id}
                                    onClick={() => remove(check.id)}
                                    className="rounded-lg bg-rose-600 px-2 py-1.5 font-semibold text-white disabled:opacity-50"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId('')}
                                    className="rounded-lg border px-2 py-1.5 font-semibold"
                                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                  >
                                    No
                                  </button>
                                </span>
                              ) : (
                                canManage && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(check.id)}
                                    className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                    aria-label="Delete quality check"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 lg:hidden">
                {checks.map((check) => {
                  const counts = tally(check.checklist);
                  return (
                    <div
                      key={check.id}
                      className="rounded-xl p-3.5"
                      style={{ border: '1px solid hsl(var(--border) / 0.7)', background: 'hsl(var(--card))' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {check.title}
                          </p>
                          <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {labelize(check.type)} · {check.inspector || 'Unassigned'}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[check.status] || STATUS_STYLES.pending}`}>
                          {labelize(check.status)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <span>
                          {counts.total === 0 ? 'No checklist' : `${counts.passed}/${counts.total} passed`}
                        </span>
                        <span>{day(check.inspectedAt)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {check.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              disabled={busyId === check.id}
                              onClick={() => mark(check.id, 'passed')}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Pass
                            </button>
                            <button
                              type="button"
                              disabled={busyId === check.id}
                              onClick={() => mark(check.id, 'failed')}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Fail
                            </button>
                          </>
                        )}
                        <Link
                          href={`/operations/quality/${check.id}/edit`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold"
                          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setDeletingId(check.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-2.5 py-2 text-rose-600"
                            aria-label="Delete quality check"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {deletingId === check.id && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                          <span className="flex-1">Delete this check?</span>
                          <button
                            type="button"
                            disabled={busyId === check.id}
                            onClick={() => remove(check.id)}
                            className="rounded-md bg-rose-600 px-2 py-1 font-semibold text-white disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId('')}
                            className="rounded-md border border-rose-200 px-2 py-1 font-semibold"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
