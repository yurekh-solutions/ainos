'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Boxes, CalendarClock, CheckCircle2, ClipboardList, Loader2, Pencil, PlayCircle, Plus, Search, SkipForward, Trash2, Wallet, Wrench } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  location: string | null;
  serialNumber: string | null;
  assignedTo: string | null;
  warrantyUntil: string | null;
  status: string;
  openTasks: number;
  inProgress: number;
  nextDue: string | null;
}

interface AssetSummary {
  total: number;
  underMaintenance: number;
  dueThisWeek: number;
  overdue: number;
}

interface Task {
  id: string;
  assetId: string;
  title: string;
  type: string;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
  technician: string | null;
  cost: number;
  notes: string | null;
  asset: { id: string; name: string; code: string | null } | null;
}

interface TaskSummary {
  planned: number;
  inProgress: number;
  overdue: number;
  doneThisMonth: number;
  costThisMonth: number;
}

const ASSET_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  under_maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
  retired: 'bg-slate-100 text-slate-600 border-slate-200',
};

const TASK_STATUS_STYLES: Record<string, string> = {
  planned: 'bg-sky-50 text-sky-700 border-sky-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  skipped: 'bg-slate-100 text-slate-600 border-slate-200',
};

const TASK_TABS = [
  { id: 'all', label: 'All' },
  { id: 'planned', label: 'Planned' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
  { id: 'skipped', label: 'Skipped' },
];

const ASSET_FILTERS = [
  { id: 'all', label: 'All assets' },
  { id: 'active', label: 'Active' },
  { id: 'under_maintenance', label: 'Under maintenance' },
  { id: 'retired', label: 'Retired' },
];

function labelize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function inr(value: number): string {
  return `Rs.${Math.round(value).toLocaleString('en-IN')}`;
}

function day(value: string | null): string {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function dueTone(value: string | null): string {
  if (!value) return 'text-slate-500';
  const due = new Date(value).getTime();
  const now = Date.now();
  if (due < now) return 'text-rose-600 font-semibold';
  if (due < now + 7 * 24 * 60 * 60 * 1000) return 'text-amber-600 font-semibold';
  return 'text-slate-600';
}

function MaintenanceView() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'assets' | 'schedule'>(
    searchParams.get('tab') === 'schedule' ? 'schedule' : 'assets',
  );
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetSummary, setAssetSummary] = useState<AssetSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const [assetStatus, setAssetStatus] = useState('all');
  const [assetSearch, setAssetSearch] = useState('');
  const [taskStatus, setTaskStatus] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const assetParams = new URLSearchParams();
      if (assetStatus !== 'all') assetParams.set('status', assetStatus);
      if (assetSearch.trim()) assetParams.set('q', assetSearch.trim());

      const taskParams = new URLSearchParams();
      if (taskStatus !== 'all') taskParams.set('status', taskStatus);
      if (taskSearch.trim()) taskParams.set('q', taskSearch.trim());

      const [assetRes, taskRes] = await Promise.all([
        fetch(`/api/maintenance/assets?${assetParams.toString()}`),
        fetch(`/api/maintenance/tasks?${taskParams.toString()}`),
      ]);

      if (!assetRes.ok) {
        const data = await assetRes.json().catch(() => ({}));
        throw new Error(data.error || 'Could not load assets');
      }
      if (!taskRes.ok) {
        const data = await taskRes.json().catch(() => ({}));
        throw new Error(data.error || 'Could not load the service schedule');
      }

      const assetData = await assetRes.json();
      const taskData = await taskRes.json();

      setAssets(assetData.assets || []);
      setAssetSummary(assetData.summary || null);
      setTasks(taskData.tasks || []);
      setTaskSummary(taskData.summary || null);
      setCanManage(Boolean(assetData.canManage ?? taskData.canManage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load maintenance data');
    } finally {
      setLoading(false);
    }
  }, [assetStatus, assetSearch, taskStatus, taskSearch]);

  useEffect(() => {
    const timer = setTimeout(load, assetSearch || taskSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, assetSearch, taskSearch]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const changeTaskStatus = async (id: string, next: string) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/maintenance/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      setToast(next === 'done' ? 'Service marked done' : 'Service updated');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId('');
    }
  };

  const removeTask = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/maintenance/tasks?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setToast('Service removed');
      setDeletingId('');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  };

  const removeAsset = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/maintenance/assets?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setToast('Asset removed with its service history');
      setDeletingId('');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  };

  const openTasks = (taskSummary?.planned || 0) + (taskSummary?.inProgress || 0);

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <div className="mx-auto max-w-7xl space-y-5 pb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              Maintenance
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Track equipment, plan service work and keep the upkeep cost visible
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/operations/maintenance/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              <Plus className="h-4 w-4" />
              Add asset
            </Link>
            <Link
              href="/operations/maintenance/tasks/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
              }}
            >
              <Wrench className="h-4 w-4" />
              Schedule service
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Assets tracked',
              value: assetSummary ? String(assetSummary.total) : '—',
              hint: assetSummary ? `${assetSummary.underMaintenance} under maintenance` : '',
              icon: Boxes,
              tint: 'from-violet-500 to-purple-600',
            },
            {
              label: 'Open services',
              value: taskSummary ? String(openTasks) : '—',
              hint: taskSummary ? `${taskSummary.planned} planned · ${taskSummary.inProgress} underway` : '',
              icon: ClipboardList,
              tint: 'from-sky-500 to-blue-600',
            },
            {
              label: 'Overdue',
              value: taskSummary ? String(taskSummary.overdue) : '—',
              hint: taskSummary?.doneThisMonth ? `${taskSummary.doneThisMonth} done this month` : 'Nothing late',
              icon: AlertTriangle,
              tint: 'from-rose-500 to-red-600',
            },
            {
              label: 'Service cost this month',
              value: taskSummary ? inr(taskSummary.costThisMonth) : '—',
              hint: 'Completed services only',
              icon: Wallet,
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

        <div
          className="rounded-2xl p-4 md:p-5"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full gap-1 rounded-xl p-1 lg:w-auto" style={{ background: 'hsl(var(--muted))' }}>
              <button
                type="button"
                onClick={() => setTab('assets')}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition lg:flex-none ${
                  tab === 'assets' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Assets
              </button>
              <button
                type="button"
                onClick={() => setTab('schedule')}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition lg:flex-none ${
                  tab === 'schedule' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Service schedule
              </button>
            </div>

            {tab === 'assets' ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <input
                    value={assetSearch}
                    onChange={(event) => setAssetSearch(event.target.value)}
                    placeholder="Search asset, code, location"
                    className="glass-input w-full py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                <select
                  value={assetStatus}
                  onChange={(event) => setAssetStatus(event.target.value)}
                  className="glass-input rounded-xl px-3 py-2 text-sm"
                >
                  {ASSET_FILTERS.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <input
                    value={taskSearch}
                    onChange={(event) => setTaskSearch(event.target.value)}
                    placeholder="Search service or technician"
                    className="glass-input w-full py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                <select
                  value={taskStatus}
                  onChange={(event) => setTaskStatus(event.target.value)}
                  className="glass-input rounded-xl px-3 py-2 text-sm"
                >
                  {TASK_TABS.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.id === 'all' ? 'Any status' : filter.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              Loading maintenance data…
            </div>
          ) : tab === 'assets' ? (
            assets.length === 0 ? (
              <div className="py-16 text-center">
                <Boxes className="mx-auto mb-3 h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  No assets yet
                </p>
                <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Add the equipment you service to start a maintenance history.
                </p>
                <Link
                  href="/operations/maintenance/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add asset
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-4 hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                        <th className="pb-3 pr-3 font-semibold">Asset</th>
                        <th className="pb-3 pr-3 font-semibold">Location</th>
                        <th className="pb-3 pr-3 font-semibold">Status</th>
                        <th className="pb-3 pr-3 font-semibold">Open</th>
                        <th className="pb-3 pr-3 font-semibold">Next service</th>
                        <th className="pb-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => (
                        <tr key={asset.id} className="border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.6)' }}>
                          <td className="py-3 pr-3">
                            <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                              {asset.name}
                            </p>
                            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {[asset.code, asset.category ? labelize(asset.category) : null].filter(Boolean).join(' · ') || 'No code'}
                            </p>
                          </td>
                          <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            {asset.location || '—'}
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${ASSET_STATUS_STYLES[asset.status] || ASSET_STATUS_STYLES.active}`}>
                              {labelize(asset.status)}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                            {asset.openTasks}
                            {asset.inProgress > 0 && (
                              <span className="ml-1 text-xs text-amber-600">({asset.inProgress} underway)</span>
                            )}
                          </td>
                          <td className={`py-3 pr-3 text-sm ${dueTone(asset.nextDue)}`}>{day(asset.nextDue)}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Link
                                href={`/operations/maintenance/tasks/new?assetId=${asset.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                              >
                                <Wrench className="h-3.5 w-3.5" />
                                Service
                              </Link>
                              <Link
                                href={`/operations/maintenance/${asset.id}/edit`}
                                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Link>
                              {deletingId === asset.id ? (
                                <span className="inline-flex items-center gap-1.5 text-xs">
                                  <button
                                    type="button"
                                    disabled={busyId === asset.id}
                                    onClick={() => removeAsset(asset.id)}
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
                                    onClick={() => setDeletingId(asset.id)}
                                    className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                    aria-label={`Delete ${asset.name}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-3 lg:hidden">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="rounded-xl p-3.5"
                      style={{ border: '1px solid hsl(var(--border) / 0.7)', background: 'hsl(var(--card))' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {asset.name}
                          </p>
                          <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {asset.location || asset.code || 'No location'}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ASSET_STATUS_STYLES[asset.status] || ASSET_STATUS_STYLES.active}`}>
                          {labelize(asset.status)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <span className="inline-flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" />
                          {asset.openTasks} open
                        </span>
                        <span className={`inline-flex items-center gap-1 ${dueTone(asset.nextDue)}`}>
                          <CalendarClock className="h-3.5 w-3.5" />
                          {day(asset.nextDue)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/operations/maintenance/tasks/new?assetId=${asset.id}`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-2 text-xs font-semibold text-violet-700"
                        >
                          <Wrench className="h-3.5 w-3.5" />
                          Service
                        </Link>
                        <Link
                          href={`/operations/maintenance/${asset.id}/edit`}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold"
                          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setDeletingId(asset.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-2.5 py-2 text-rose-600"
                            aria-label={`Delete ${asset.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {deletingId === asset.id && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                          <span className="flex-1">Delete this asset and its services?</span>
                          <button
                            type="button"
                            disabled={busyId === asset.id}
                            onClick={() => removeAsset(asset.id)}
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
            )
          ) : tasks.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardList className="mx-auto mb-3 h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                No services in this view
              </p>
              <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Schedule preventive work against an asset to build the history.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                      <th className="pb-3 pr-3 font-semibold">Service</th>
                      <th className="pb-3 pr-3 font-semibold">Asset</th>
                      <th className="pb-3 pr-3 font-semibold">Type</th>
                      <th className="pb-3 pr-3 font-semibold">Due</th>
                      <th className="pb-3 pr-3 font-semibold">Status</th>
                      <th className="pb-3 pr-3 font-semibold">Cost</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.6)' }}>
                        <td className="py-3 pr-3">
                          <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {task.title}
                          </p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {task.technician || 'Unassigned'}
                          </p>
                        </td>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {task.asset?.name || '—'}
                        </td>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {labelize(task.type)}
                        </td>
                        <td className={`py-3 pr-3 text-sm ${dueTone(task.status === 'done' ? null : task.dueAt)}`}>
                          {task.status === 'done' ? day(task.completedAt) : day(task.dueAt)}
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.planned}`}>
                            {labelize(task.status)}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {inr(task.cost)}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {task.status === 'planned' && (
                              <button
                                type="button"
                                disabled={busyId === task.id}
                                onClick={() => changeTaskStatus(task.id, 'in_progress')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
                              >
                                {busyId === task.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                                Start
                              </button>
                            )}
                            {(task.status === 'planned' || task.status === 'in_progress') && (
                              <>
                                <button
                                  type="button"
                                  disabled={busyId === task.id}
                                  onClick={() => changeTaskStatus(task.id, 'done')}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Done
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === task.id}
                                  onClick={() => changeTaskStatus(task.id, 'skipped')}
                                  className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-50"
                                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                >
                                  <SkipForward className="h-3.5 w-3.5" />
                                  Skip
                                </button>
                              </>
                            )}
                            <Link
                              href={`/operations/maintenance/tasks/${task.id}/edit`}
                              className="inline-flex items-center rounded-lg border p-1.5 transition hover:bg-black/5"
                              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                              aria-label="Edit service"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            {deletingId === task.id ? (
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <button
                                  type="button"
                                  disabled={busyId === task.id}
                                  onClick={() => removeTask(task.id)}
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
                                onClick={() => setDeletingId(task.id)}
                                className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                aria-label="Delete service"
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
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl p-3.5"
                    style={{ border: '1px solid hsl(var(--border) / 0.7)', background: 'hsl(var(--card))' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {task.title}
                        </p>
                        <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {task.asset?.name || 'No asset'} · {labelize(task.type)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.planned}`}>
                        {labelize(task.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span className={`inline-flex items-center gap-1 ${dueTone(task.status === 'done' ? null : task.dueAt)}`}>
                        <CalendarClock className="h-3.5 w-3.5" />
                        {task.status === 'done' ? day(task.completedAt) : day(task.dueAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" />
                        {inr(task.cost)}
                      </span>
                      <span className="truncate">{task.technician || 'Unassigned'}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.status === 'planned' && (
                        <button
                          type="button"
                          disabled={busyId === task.id}
                          onClick={() => changeTaskStatus(task.id, 'in_progress')}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-2 text-xs font-semibold text-sky-700 disabled:opacity-50"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Start
                        </button>
                      )}
                      {(task.status === 'planned' || task.status === 'in_progress') && (
                        <button
                          type="button"
                          disabled={busyId === task.id}
                          onClick={() => changeTaskStatus(task.id, 'done')}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done
                        </button>
                      )}
                      <Link
                        href={`/operations/maintenance/tasks/${task.id}/edit`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold"
                        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeletingId(task.id)}
                        className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-2.5 py-2 text-rose-600"
                        aria-label="Delete service"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {deletingId === task.id && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                        <span className="flex-1">Delete this service?</span>
                        <button
                          type="button"
                          disabled={busyId === task.id}
                          onClick={() => removeTask(task.id)}
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

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex h-full items-center justify-center gap-2 p-6 text-sm"
          style={{ background: 'var(--page-gradient)', color: 'hsl(var(--muted-foreground))' }}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading maintenance…
        </div>
      }
    >
      <MaintenanceView />
    </Suspense>
  );
}
