'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, CalendarClock, IndianRupee, KeyRound, Loader2, Pencil, Plus, RotateCcw, Search, Trash2, Truck } from 'lucide-react';

interface RentalOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  itemName: string;
  itemRef?: string | null;
  quantity: number;
  period: string;
  unitPrice: number;
  startDate: string;
  endDate: string;
  rentalFee: number;
  deposit: number;
  lateFee: number;
  total: number;
  status: string;
  isOverdue: boolean;
}

interface Summary {
  active: number;
  dueToday: number;
  overdue: number;
  returnedMonth: number;
  revenueMonth: number;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
  confirmed: { label: 'Confirmed', className: 'bg-sky-100 text-sky-700' },
  out: { label: 'On rent', className: 'bg-violet-100 text-violet-700' },
  returned: { label: 'Returned', className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-100 text-rose-700' },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'out', label: 'On rent' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'returned', label: 'Returned' },
];

const money = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export default function RentalPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [summary, setSummary] = useState<Summary>({ active: 0, dueToday: 0, overdue: 0, returnedMonth: 0, revenueMonth: 0 });
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
      const res = await fetch(`/api/rental?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load rental orders');
      setOrders(data.orders || []);
      setSummary(data.summary || { active: 0, dueToday: 0, overdue: 0, returnedMonth: 0, revenueMonth: 0 });
      setCanManage(Boolean(data.canManage));
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not load rental orders');
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

  const changeStatus = async (order: RentalOrder, status: string) => {
    setBusyId(order.id);
    try {
      const res = await fetch('/api/rental', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update this rental order');
      setToast(`${order.orderNumber} → ${STATUS_META[status]?.label || status}`);
      await load();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not update this rental order');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/rental?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete this rental order');
      setToast('Rental order deleted');
      setConfirmId('');
      await load();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not delete this rental order');
    } finally {
      setBusyId('');
    }
  };

  const kpis = [
    { label: 'Active rentals', value: summary.active, icon: KeyRound, tone: 'text-violet-600' },
    { label: 'Due today', value: summary.dueToday, icon: CalendarClock, tone: 'text-sky-600' },
    { label: 'Overdue', value: summary.overdue, icon: AlertTriangle, tone: 'text-rose-600' },
    { label: 'Revenue this month', value: money(summary.revenueMonth), icon: IndianRupee, tone: 'text-emerald-600' },
  ];

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-5 pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              Rental
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Rental orders, deposits and returns — priced automatically by period
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/rental/new')}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
            }}
          >
            <Plus className="h-4 w-4" />
            New rental
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl p-4"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
            >
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

        <div
          className="space-y-3 rounded-2xl p-4"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
        >
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
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    tab === item.id ? 'text-white' : 'hover:bg-black/5'
                  }`}
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
                placeholder="Search order, customer or item"
                className="glass-input w-full rounded-xl py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading rental orders…
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <Truck className="mx-auto h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="mt-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                No rental orders here
              </p>
              <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Create one to start tracking pickups, returns and deposits.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">Order</th>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">Customer</th>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">Item</th>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">Schedule</th>
                      <th className="py-2 pr-3 text-right text-xs font-semibold uppercase tracking-wide">Total</th>
                      <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide">Status</th>
                      <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const meta = STATUS_META[order.status] || { label: order.status, className: 'bg-slate-100 text-slate-700' };
                      return (
                        <tr key={order.id} style={{ borderTop: '1px solid hsl(var(--border) / 0.6)' }}>
                          <td className="py-3 pr-3 font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                            {order.orderNumber}
                          </td>
                          <td className="py-3 pr-3">
                            <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                              {order.customerName}
                            </p>
                            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {order.customerPhone || '—'}
                            </p>
                          </td>
                          <td className="py-3 pr-3">
                            <p style={{ color: 'hsl(var(--foreground))' }}>{order.itemName}</p>
                            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {order.itemRef || `${order.quantity} × ${order.period}`}
                            </p>
                          </td>
                          <td className="py-3 pr-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {formatDate(order.startDate)} → {formatDate(order.endDate)}
                          </td>
                          <td className="py-3 pr-3 text-right font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {money(order.total)}
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                            {order.isOverdue && <span className="ml-1 text-xs font-semibold text-rose-600">overdue</span>}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-1">
                              {order.status === 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => changeStatus(order, 'out')}
                                  disabled={busyId === order.id}
                                  className="rounded-lg border px-2 py-1 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-50"
                                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                >
                                  Hand over
                                </button>
                              )}
                              {order.status === 'out' && (
                                <button
                                  type="button"
                                  onClick={() => changeStatus(order, 'returned')}
                                  disabled={busyId === order.id}
                                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-50"
                                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Return
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => router.push(`/rental/${order.id}/edit`)}
                                className="rounded-lg p-1.5 transition hover:bg-black/5"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
                                aria-label="Edit rental order"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {canManage &&
                                (confirmId === order.id ? (
                                  <span className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => remove(order.id)}
                                      disabled={busyId === order.id}
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
                                    onClick={() => setConfirmId(order.id)}
                                    className="rounded-lg p-1.5 transition hover:bg-rose-50"
                                    style={{ color: 'hsl(var(--error))' }}
                                    aria-label="Delete rental order"
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
                {orders.map((order) => {
                  const meta = STATUS_META[order.status] || { label: order.status, className: 'bg-slate-100 text-slate-700' };
                  return (
                    <div
                      key={order.id}
                      className="rounded-xl p-3"
                      style={{ border: '1px solid hsl(var(--border) / 0.7)', background: 'hsl(var(--card))' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {order.orderNumber}
                          </p>
                          <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {order.customerName}
                          </p>
                          <p className="truncate text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {order.itemName}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {formatDate(order.startDate)} → {formatDate(order.endDate)}
                        </span>
                        <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {money(order.total)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {order.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => changeStatus(order, 'out')}
                            disabled={busyId === order.id}
                            className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                          >
                            Hand over
                          </button>
                        )}
                        {order.status === 'out' && (
                          <button
                            type="button"
                            onClick={() => changeStatus(order, 'returned')}
                            disabled={busyId === order.id}
                            className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                          >
                            Mark returned
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => router.push(`/rental/${order.id}/edit`)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        >
                          Edit
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => remove(order.id)}
                            disabled={busyId === order.id}
                            className="ml-auto rounded-lg p-1.5 disabled:opacity-50"
                            style={{ color: 'hsl(var(--error))' }}
                            aria-label="Delete rental order"
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
