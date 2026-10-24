'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Loader2, Pause, Pencil, Play, Plus, RefreshCw, Trash2 } from 'lucide-react';

interface RecurringRow {
  id: string;
  customerName: string | null;
  frequency: string;
  startDate: string;
  endDate: string | null;
  nextRunDate: string;
  status: string;
  notes: string | null;
  items: Array<{ description?: string; quantity?: number; rate?: number; amount?: number }> | null;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
};

function day(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function totalOf(items: RecurringRow['items']): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

export default function RecurringInvoicesPage() {
  const [invoices, setInvoices] = useState<RecurringRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/recurring-invoices');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not load recurring invoices');
      }
      const rows = await res.json();
      setInvoices(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load recurring invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const patch = async (id: string, body: Record<string, unknown>, message: string) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/recurring-invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      setToast(message);
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
      const res = await fetch(`/api/recurring-invoices?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setToast('Schedule deleted');
      setDeletingId('');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  };

  const active = invoices.filter((invoice) => invoice.status === 'active').length;
  const monthlyValue = invoices
    .filter((invoice) => invoice.status === 'active')
    .reduce((sum, invoice) => sum + totalOf(invoice.items), 0);

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <div className="mx-auto max-w-7xl space-y-5 pb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              Recurring invoices
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Schedules that raise the same invoice every cycle
            </p>
          </div>
          <Link
            href="/finance/recurring-invoices/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
            }}
          >
            <Plus className="h-4 w-4" />
            New schedule
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Schedules', value: String(invoices.length), tint: 'from-violet-500 to-purple-600' },
            { label: 'Active', value: String(active), tint: 'from-emerald-500 to-teal-600' },
            { label: 'Value per cycle', value: `₹${monthlyValue.toLocaleString('en-IN')}`, tint: 'from-sky-500 to-blue-600' },
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
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {card.label}
              </p>
              <p className="mt-2 text-xl font-bold leading-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
                {card.value}
              </p>
            </motion.div>
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div
            className="flex items-center justify-center gap-2 rounded-2xl py-16 text-sm"
            style={{ background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))' }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading schedules…
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={{ background: 'hsl(var(--card))' }}>
            <Calendar className="mx-auto mb-3 h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              No recurring invoices yet
            </p>
            <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Create a schedule and AINOS keeps the billing cadence.
            </p>
            <Link
              href="/finance/recurring-invoices/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              New schedule
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {invoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex flex-col rounded-2xl p-4"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      {invoice.customerName || 'No customer'}
                    </p>
                    <p className="mt-0.5 text-xs capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {invoice.frequency} · ₹{totalOf(invoice.items).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${
                      STATUS_STYLES[invoice.status] || STATUS_STYLES.completed
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <p>Next run: {day(invoice.nextRunDate)}</p>
                  <p>
                    Started {day(invoice.startDate)}
                    {invoice.endDate ? ` · ends ${day(invoice.endDate)}` : ''}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <button
                    type="button"
                    disabled={busyId === invoice.id}
                    onClick={() =>
                      invoice.status === 'active'
                        ? patch(invoice.id, { status: 'paused' }, 'Schedule paused')
                        : patch(invoice.id, { status: 'active' }, 'Schedule resumed')
                    }
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-50"
                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  >
                    {busyId === invoice.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : invoice.status === 'active' ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    {invoice.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === invoice.id}
                    onClick={() => patch(invoice.id, { runNow: true }, 'Next run moved one cycle ahead')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-50"
                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Run now
                  </button>
                  <Link
                    href={`/finance/recurring-invoices/${invoice.id}/edit`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition hover:bg-black/5"
                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  {deletingId === invoice.id ? (
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        disabled={busyId === invoice.id}
                        onClick={() => remove(invoice.id)}
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
                      onClick={() => setDeletingId(invoice.id)}
                      className="rounded-lg border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                      aria-label="Delete schedule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
