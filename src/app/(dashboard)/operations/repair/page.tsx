'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, CircleDollarSign, Loader2, PackageCheck, Pencil, Plus, Search, ShieldAlert, Trash2, Wrench } from 'lucide-react';

interface RepairLine {
  id?: string;
  kind: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface RepairRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  deviceName: string;
  serialNumber: string | null;
  underWarranty: boolean;
  status: string;
  priority: string;
  technician: string | null;
  totalCost: number;
  receivedAt: string;
  promisedAt: string | null;
  deliveredAt: string | null;
  lines: RepairLine[];
}

interface Summary {
  open: number;
  inProgress: number;
  awaitingParts: number;
  ready: number;
  deliveredMonth: number;
  revenueMonth: number;
}

const STATUS_STYLES: Record<string, string> = {
  received: 'bg-slate-100 text-slate-700 border-slate-200',
  diagnosed: 'bg-sky-50 text-sky-700 border-sky-200',
  in_progress: 'bg-violet-50 text-violet-700 border-violet-200',
  awaiting_parts: 'bg-amber-50 text-amber-700 border-amber-200',
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  delivered: 'bg-teal-50 text-teal-700 border-teal-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-slate-500',
  normal: 'text-sky-600',
  high: 'text-amber-600 font-semibold',
  urgent: 'text-rose-600 font-semibold',
};

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'received', label: 'Received' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'awaiting_parts', label: 'Awaiting parts' },
  { id: 'ready', label: 'Ready' },
  { id: 'delivered', label: 'Delivered' },
];

const NEXT_STATUS: Record<string, string> = {
  received: 'diagnosed',
  diagnosed: 'in_progress',
  in_progress: 'ready',
  awaiting_parts: 'in_progress',
  ready: 'delivered',
};

function labelize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function day(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function RepairPage() {
  const [orders, setOrders] = useState<RepairRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/repair?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not load repair orders');
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setSummary(data.summary || null);
      setCanManage(Boolean(data.canManage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load repair orders');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const advance = async (order: RepairRow) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setBusyId(order.id);
    try {
      const res = await fetch('/api/repair', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      setToast(`${order.orderNumber} → ${labelize(next)}`);
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
      const res = await fetch(`/api/repair?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setToast('Repair order deleted');
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
              Repair
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Intake, diagnosis, parts and handover for every repair job
            </p>
          </div>
          <Link
            href="/operations/repair/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
            }}
          >
            <Plus className="h-4 w-4" />
            New repair order
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Open jobs',
              value: summary ? String(summary.open) : '—',
              hint: summary ? `${summary.inProgress} in progress` : '',
              icon: Wrench,
              tint: 'from-violet-500 to-purple-600',
            },
            {
              label: 'Awaiting parts',
              value: summary ? String(summary.awaitingParts) : '—',
              hint: 'Blocked on stock',
              icon: PackageCheck,
              tint: 'from-amber-500 to-orange-600',
            },
            {
              label: 'Ready for pickup',
              value: summary ? String(summary.ready) : '—',
              hint: 'Waiting on the customer',
              icon: ShieldAlert,
              tint: 'from-emerald-500 to-teal-600',
            },
            {
              label: 'Revenue this month',
              value: summary ? `₹${summary.revenueMonth.toLocaleString('en-IN')}` : '—',
              hint: summary ? `${summary.deliveredMonth} delivered` : '',
              icon: CircleDollarSign,
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
            <div className="relative lg:w-72">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order, customer or device"
                className="glass-input w-full py-2 pl-9 pr-3 text-sm"
              />
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
              Loading repair orders…
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <Wrench className="mx-auto mb-3 h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                No repair orders yet
              </p>
              <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Log the first intake and track it to handover.
              </p>
              <Link
                href="/operations/repair/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                New repair order
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead>
                    <tr
                      className="border-b text-xs uppercase tracking-wide"
                      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                    >
                      <th className="pb-3 pr-3 font-semibold">Order</th>
                      <th className="pb-3 pr-3 font-semibold">Customer</th>
                      <th className="pb-3 pr-3 font-semibold">Item</th>
                      <th className="pb-3 pr-3 font-semibold">Status</th>
                      <th className="pb-3 pr-3 font-semibold">Promised</th>
                      <th className="pb-3 pr-3 font-semibold">Total</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.6)' }}>
                        <td className="py-3 pr-3">
                          <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {order.orderNumber}
                          </p>
                          <p className={`text-xs ${PRIORITY_STYLES[order.priority] || PRIORITY_STYLES.normal}`}>
                            {labelize(order.priority)} priority
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                            {order.customerName}
                          </p>
                          {order.customerPhone && (
                            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {order.customerPhone}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <p style={{ color: 'hsl(var(--foreground))' }}>{order.deviceName}</p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {order.technician || 'Unassigned'}
                            {order.underWarranty ? ' · warranty' : ''}
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              STATUS_STYLES[order.status] || STATUS_STYLES.received
                            }`}
                          >
                            {labelize(order.status)}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {day(order.promisedAt)}
                        </td>
                        <td className="py-3 pr-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          ₹{order.totalCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {NEXT_STATUS[order.status] && (
                              <button
                                type="button"
                                disabled={busyId === order.id}
                                onClick={() => advance(order)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
                              >
                                {busyId === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                                {labelize(NEXT_STATUS[order.status])}
                              </button>
                            )}
                            <Link
                              href={`/operations/repair/${order.id}/edit`}
                              className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Link>
                            {deletingId === order.id ? (
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <button
                                  type="button"
                                  disabled={busyId === order.id}
                                  onClick={() => remove(order.id)}
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
                                  onClick={() => setDeletingId(order.id)}
                                  className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                  aria-label="Delete repair order"
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
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl p-3.5"
                    style={{ border: '1px solid hsl(var(--border) / 0.7)', background: 'hsl(var(--card))' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {order.deviceName}
                        </p>
                        <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {order.orderNumber} · {order.customerName}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          STATUS_STYLES[order.status] || STATUS_STYLES.received
                        }`}
                      >
                        {labelize(order.status)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        ₹{order.totalCost.toLocaleString('en-IN')}
                      </span>
                      <span>{order.technician || 'Unassigned'}</span>
                      <span>{day(order.promisedAt)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {NEXT_STATUS[order.status] && (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => advance(order)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          {labelize(NEXT_STATUS[order.status])}
                        </button>
                      )}
                      <Link
                        href={`/operations/repair/${order.id}/edit`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold"
                        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setDeletingId(order.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-2.5 py-2 text-rose-600"
                          aria-label="Delete repair order"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {deletingId === order.id && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                        <span className="flex-1">Delete this repair order?</span>
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => remove(order.id)}
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
