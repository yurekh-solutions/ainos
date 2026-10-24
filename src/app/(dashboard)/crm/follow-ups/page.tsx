'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useToast } from '@/lib/toast';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';

interface FollowUpRow {
  id: string;
  contactName: string | null;
  type: string | null;
  status: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  call: 'Call',
  email: 'Email',
  whatsapp: 'WhatsApp',
  meeting: 'Meeting',
  visit: 'Visit',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-sky-50 text-sky-700 border-sky-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  missed: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'done', label: 'Done' },
  { id: 'missed', label: 'Missed' },
];

function day(value: string | null): string {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(row: FollowUpRow): boolean {
  if (!row.dueDate || row.status !== 'pending') return false;
  return new Date(row.dueDate).getTime() < Date.now();
}

export default function FollowUpsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<FollowUpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [status, setStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      const res = await fetch(`/api/follow-ups?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not load follow-ups');
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const markDone = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/follow-ups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'done' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      toast.success('Follow-up completed');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/follow-ups?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      toast.success('Follow-up deleted');
      setDeletingId('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  };

  const pending = rows.filter((row) => row.status === 'pending').length;
  const done = rows.filter((row) => row.status === 'done').length;
  const overdue = rows.filter(isOverdue).length;

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <div className="mx-auto max-w-7xl space-y-5 pb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              Follow-ups
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Scheduled calls, emails and visits for your pipeline
            </p>
          </div>
          <Link
            href="/crm/follow-ups/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
            }}
          >
            <Plus className="h-4 w-4" />
            Schedule follow-up
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Pending', value: String(pending), hint: 'Waiting on you', icon: Clock, tint: 'from-sky-500 to-blue-600' },
            { label: 'Overdue', value: String(overdue), hint: 'Past the due date', icon: AlertTriangle, tint: 'from-rose-500 to-red-600' },
            { label: 'Completed', value: String(done), hint: 'Closed touchpoints', icon: CheckCircle2, tint: 'from-emerald-500 to-teal-600' },
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

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading follow-ups…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarClock className="mx-auto mb-3 h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Nothing scheduled
              </p>
              <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Plan the next touchpoint with a lead or customer.
              </p>
              <Link
                href="/crm/follow-ups/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Schedule follow-up
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead>
                    <tr
                      className="border-b text-xs uppercase tracking-wide"
                      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                    >
                      <th className="pb-3 pr-3 font-semibold">Contact</th>
                      <th className="pb-3 pr-3 font-semibold">Channel</th>
                      <th className="pb-3 pr-3 font-semibold">Due</th>
                      <th className="pb-3 pr-3 font-semibold">Status</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.6)' }}>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                                {row.contactName || 'Unknown contact'}
                              </p>
                              {row.notes && (
                                <p className="max-w-[320px] truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                  {row.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {TYPE_LABELS[row.type || 'call'] || 'Call'}
                        </td>
                        <td className={`py-3 pr-3 text-sm ${isOverdue(row) ? 'font-semibold text-rose-600' : ''}`}>
                          {day(row.dueDate)}
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                              STATUS_STYLES[row.status] || STATUS_STYLES.pending
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {row.status !== 'done' && (
                              <button
                                type="button"
                                disabled={busyId === row.id}
                                onClick={() => markDone(row.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                              >
                                {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                Done
                              </button>
                            )}
                            <Link
                              href={`/crm/follow-ups/${row.id}/edit`}
                              className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Link>
                            {deletingId === row.id ? (
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <button
                                  type="button"
                                  disabled={busyId === row.id}
                                  onClick={() => remove(row.id)}
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
                              <button
                                type="button"
                                onClick={() => setDeletingId(row.id)}
                                className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                aria-label="Delete follow-up"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 lg:hidden">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl p-3.5"
                    style={{ border: '1px solid hsl(var(--border) / 0.7)', background: 'hsl(var(--card))' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {row.contactName || 'Unknown contact'}
                        </p>
                        <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {TYPE_LABELS[row.type || 'call'] || 'Call'} · {day(row.dueDate)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          STATUS_STYLES[row.status] || STATUS_STYLES.pending
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                    {row.notes && (
                      <p className="mt-2 line-clamp-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {row.notes}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {row.status !== 'done' && (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => markDone(row.id)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done
                        </button>
                      )}
                      <Link
                        href={`/crm/follow-ups/${row.id}/edit`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold"
                        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeletingId(row.id)}
                        className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-2.5 py-2 text-rose-600"
                        aria-label="Delete follow-up"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {deletingId === row.id && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                        <span className="flex-1">Delete this follow-up?</span>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => remove(row.id)}
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
                ))}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
