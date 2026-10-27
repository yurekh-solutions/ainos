'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Loader2, Pencil, PlayCircle, Plus, Search, Trash2, Users, Wrench, XCircle } from 'lucide-react';

interface Job {
  id: string;
  jobNumber: string | null;
  title: string;
  customerName: string | null;
  contactPhone: string | null;
  address: string | null;
  technician: string | null;
  priority: string;
  status: string;
  scheduledFor: string | null;
  completedAt: string | null;
  estimatedHours: number | null;
  labourCost: number;
  partsCost: number;
  description: string | null;
  notes: string | null;
}

interface Summary {
  dueToday: number;
  inProgress: number;
  overdue: number;
  openTotal: number;
  urgent: number;
  completedValue: number;
  completedCount: number;
  byTechnician: { name: string; open: number; completed: number }[];
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-slate-500',
  normal: 'text-slate-700',
  high: 'text-orange-600',
  urgent: 'text-rose-600',
};

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function inr(value: number): string {
  return `Rs.${Math.round(value).toLocaleString('en-IN')}`;
}

function when(value: string | null): string {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FieldServicePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [canDispatch, setCanDispatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState('');

  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [technician, setTechnician] = useState('all');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (priority !== 'all') params.set('priority', priority);
      if (technician !== 'all') params.set('technician', technician);
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/field-service?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not load jobs');
      }
      const data = await res.json();
      setJobs(data.jobs || []);
      setSummary(data.summary || null);
      setTechnicians(data.technicians || []);
      setCanDispatch(Boolean(data.canDispatch));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load jobs');
    } finally {
      setLoading(false);
    }
  }, [status, priority, technician, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const changeStatus = async (id: string, next: string) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/field-service', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      setToast(next === 'completed' ? 'Job marked complete' : 'Job updated');
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
      const res = await fetch(`/api/field-service?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setToast('Job deleted');
      setDeletingId('');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  };

  const actions = (job: Job) => (
    <div className="flex flex-wrap items-center gap-2">
      {canDispatch && job.status === 'scheduled' && (
        <button
          type="button"
          disabled={busyId === job.id}
          onClick={() => changeStatus(job.id, 'in_progress')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
        >
          {busyId === job.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
          Start
        </button>
      )}
      {canDispatch && job.status === 'in_progress' && (
        <button
          type="button"
          disabled={busyId === job.id}
          onClick={() => changeStatus(job.id, 'completed')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Complete
        </button>
      )}
      {canDispatch && (job.status === 'scheduled' || job.status === 'in_progress') && (
        <button
          type="button"
          disabled={busyId === job.id}
          onClick={() => changeStatus(job.id, 'cancelled')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          Cancel
        </button>
      )}
      <Link
        href={`/operations/field-service/${job.id}/edit`}
        className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        aria-label={`Edit ${job.title}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>
      {deletingId === job.id ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
          Delete?
          <button type="button" onClick={() => remove(job.id)} className="underline">
            Yes
          </button>
          <button type="button" onClick={() => setDeletingId('')} className="underline">
            No
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setDeletingId(job.id)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Delete ${job.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-7xl space-y-6 pb-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
              Field Service
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Dispatch technicians, track on-site work and bill the job
            </p>
          </div>
          <Link
            href="/operations/field-service/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
            }}
          >
            <Plus className="h-4 w-4" />
            Schedule job
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Due today',
              value: summary ? String(summary.dueToday) : '—',
              hint: summary ? `${summary.openTotal} open jobs` : '',
              icon: CalendarClock,
              tint: 'from-sky-500 to-blue-600',
            },
            {
              label: 'Overdue',
              value: summary ? String(summary.overdue) : '—',
              hint: summary?.urgent ? `${summary.urgent} marked urgent` : 'Nothing late',
              icon: AlertTriangle,
              tint: 'from-rose-500 to-red-600',
            },
            {
              label: 'In progress',
              value: summary ? String(summary.inProgress) : '—',
              hint: 'Technicians on site',
              icon: Wrench,
              tint: 'from-amber-500 to-orange-600',
            },
            {
              label: 'Completed this month',
              value: summary ? inr(summary.completedValue) : '—',
              hint: summary ? `${summary.completedCount} jobs closed` : '',
              icon: CheckCircle2,
              tint: 'from-emerald-500 to-teal-600',
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

        {summary && summary.byTechnician.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Technician load
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.byTechnician.map((entry) => (
                <span
                  key={entry.name}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                >
                  <span className="truncate">{entry.name}</span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                    {entry.open} open
                  </span>
                  <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {entry.completed} done
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search job, customer, site"
                  className="glass-input w-full py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="glass-input rounded-xl px-3 py-2 text-sm"
              >
                <option value="all">Any priority</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <select
                value={technician}
                onChange={(event) => setTechnician(event.target.value)}
                className="glass-input rounded-xl px-3 py-2 text-sm"
              >
                <option value="all">Any technician</option>
                {technicians.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading jobs…
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center">
              <Wrench className="mx-auto mb-3 h-10 w-10" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                No jobs in this view
              </p>
              <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Schedule the first site visit to start dispatching.
              </p>
              <Link
                href="/operations/field-service/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Schedule job
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-4 hidden lg:block">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border) / 0.6)' }}>
                      {['Job', 'Customer & site', 'Technician', 'Scheduled', 'Cost', 'Status', 'Actions'].map((heading) => (
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
                    {jobs.map((job) => (
                      <tr key={job.id} style={{ borderBottom: '1px solid hsl(var(--border) / 0.35)' }}>
                        <td className="max-w-[230px] px-3 py-3">
                          <p className="truncate text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {job.title}
                          </p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {job.jobNumber || '—'} ·{' '}
                            <span className={`font-semibold capitalize ${PRIORITY_STYLES[job.priority] || ''}`}>
                              {job.priority}
                            </span>
                          </p>
                        </td>
                        <td className="max-w-[220px] px-3 py-3">
                          <p className="truncate text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            {job.customerName || 'Walk-in'}
                          </p>
                          <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {job.address || job.contactPhone || 'No site details'}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {job.technician || 'Unassigned'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {when(job.scheduledFor)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                          {inr(job.labourCost + job.partsCost)}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${
                              STATUS_STYLES[job.status] || STATUS_STYLES.scheduled
                            }`}
                          >
                            {job.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3">{actions(job)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 lg:hidden">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-xl p-4"
                    style={{ border: '1px solid hsl(var(--border) / 0.6)', background: 'hsl(var(--secondary) / 0.4)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug" style={{ color: 'hsl(var(--foreground))' }}>
                          {job.title}
                        </p>
                        <p className="mt-0.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {job.jobNumber || '—'} · {job.customerName || 'Walk-in'}
                        </p>
                      </div>
                      <p className="shrink-0 text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                        {inr(job.labourCost + job.partsCost)}
                      </p>
                    </div>
                    <div className="mt-2 space-y-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <p className="break-words">{job.address || 'No site address'}</p>
                      <p>{when(job.scheduledFor)}</p>
                      <p>
                        {job.technician || 'Unassigned'} ·{' '}
                        <span className={`font-semibold capitalize ${PRIORITY_STYLES[job.priority] || ''}`}>{job.priority}</span>
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold capitalize ${
                          STATUS_STYLES[job.status] || STATUS_STYLES.scheduled
                        }`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-3">{actions(job)}</div>
                  </div>
                ))}
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
