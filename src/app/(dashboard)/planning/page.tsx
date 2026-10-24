'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalendarClock, Check, Clock, Loader2, MapPin, Pencil, Plus, Search, Trash2, UserCheck } from 'lucide-react';

interface ShiftRow {
  id: string;
  employeeName: string;
  role?: string | null;
  startAt: string;
  endAt: string;
  location?: string | null;
  status: string;
  hours: number;
  notes?: string | null;
}

interface Summary {
  today: number;
  upcoming: number;
  planned: number;
  weekHours: number;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  planned: { label: 'Planned', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmed', className: 'bg-sky-100 text-sky-700' },
  done: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
  absent: { label: 'No show', className: 'bg-rose-100 text-rose-700' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-600' },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'planned', label: 'Planned' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'done', label: 'Completed' },
  { id: 'absent', label: 'No show' },
];

const dayLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
};

const timeLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export default function PlanningPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ShiftRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ today: 0, upcoming: 0, planned: 0, weekHours: 0 });
  const [canManage, setCanManage] = useState(false);
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
      const res = await fetch(`/api/planning?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not load the shift plan');
      setRows(data.shifts || []);
      setSummary(data.summary || { today: 0, upcoming: 0, planned: 0, weekHours: 0 });
      setCanManage(Boolean(data.canManage));
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not load the shift plan');
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

  const setStatus = async (row: ShiftRow, status: string) => {
    setBusyId(row.id);
    try {
      const res = await fetch('/api/planning', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update this shift');
      setToast(`${row.employeeName} → ${STATUS_META[status]?.label || status}`);
      await load();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not update this shift');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/planning?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete this shift');
      setToast('Shift deleted');
      setConfirmId('');
      await load();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not delete this shift');
    } finally {
      setBusyId('');
    }
  };

  const kpis = [
    { label: 'Shifts today', value: summary.today, icon: CalendarClock, tone: 'text-violet-600' },
    { label: 'Hours this week', value: `${summary.weekHours} h`, icon: Clock, tone: 'text-sky-600' },
    { label: 'Next 7 days', value: summary.upcoming, icon: UserCheck, tone: 'text-emerald-600' },
    { label: 'Awaiting confirmation', value: summary.planned, icon: Check, tone: 'text-amber-600' },
  ];

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-5 pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              Planning
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Shift rota for technicians, support and site crews
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/planning/new')}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
            }}
          >
            <Plus className="h-4 w-4" />
            New shift
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-2xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {kpi.label}
                </p>
                <kpi.icon className={`h-4 w-4 ${kpi.tone}`} />
              </div>
              <p className="mt-2 text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                {kpi.value}
              </p>
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
                placeholder="Search employee, role or site"
                className="glass-input w-full rounded-xl py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading shifts…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarClock className="mx-auto h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="mt-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                No shifts scheduled
              </p>
              <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Add a shift to build the rota.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">Employee</th>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">When</th>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">Location</th>
                      <th className="py-2 pr-3 text-right text-xs font-semibold uppercase tracking-wide">Hours</th>
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
                              {row.employeeName}
                            </p>
                            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {row.role || '—'}
                            </p>
                          </td>
                          <td className="py-3 pr-3">
                            <p style={{ color: 'hsl(var(--foreground))' }}>{dayLabel(row.startAt)}</p>
                            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {timeLabel(row.startAt)} – {timeLabel(row.endAt)}
                            </p>
                          </td>
                          <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {row.location || '—'}
                          </td>
                          <td className="py-3 pr-3 text-right font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {row.hours} h
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-1">
                              {row.status === 'planned' && (
                                <button
                                  type="button"
                                  onClick={() => setStatus(row, 'confirmed')}
                                  disabled={busyId === row.id}
                                  className="rounded-lg border px-2 py-1 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-50"
                                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                >
                                  Confirm
                                </button>
                              )}
                              {['planned', 'confirmed'].includes(row.status) && (
                                <button
                                  type="button"
                                  onClick={() => setStatus(row, 'done')}
                                  disabled={busyId === row.id}
                                  className="rounded-lg border px-2 py-1 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-50"
                                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                >
                                  Complete
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => router.push(`/planning/${row.id}/edit`)}
                                className="rounded-lg p-1.5 transition hover:bg-black/5"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
                                aria-label="Edit shift"
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
                                    aria-label="Delete shift"
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
                            {row.employeeName}
                          </p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {dayLabel(row.startAt)} · {timeLabel(row.startAt)} – {timeLabel(row.endAt)} · {row.hours} h
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                      </div>
                      {row.location && (
                        <p className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <MapPin className="h-3 w-3" />
                          {row.location}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {row.status === 'planned' && (
                          <button
                            type="button"
                            onClick={() => setStatus(row, 'confirmed')}
                            disabled={busyId === row.id}
                            className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                          >
                            Confirm
                          </button>
                        )}
                        {['planned', 'confirmed'].includes(row.status) && (
                          <button
                            type="button"
                            onClick={() => setStatus(row, 'done')}
                            disabled={busyId === row.id}
                            className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                          >
                            Complete
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => router.push(`/planning/${row.id}/edit`)}
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
                            aria-label="Delete shift"
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
