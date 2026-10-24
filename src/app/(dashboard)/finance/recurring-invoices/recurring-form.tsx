'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Plus, Save, Trash2 } from 'lucide-react';

export const FREQUENCY_OPTIONS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
];

export interface RecurringLine {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface RecurringFormValues {
  id?: string;
  customerName: string;
  frequency: string;
  startDate: string;
  nextRunDate: string;
  endDate: string;
  notes: string;
  status: string;
  items: RecurringLine[];
}

export const emptyRecurring: RecurringFormValues = {
  customerName: '',
  frequency: 'monthly',
  startDate: '',
  nextRunDate: '',
  endDate: '',
  notes: '',
  status: 'active',
  items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
};

const fieldClass = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';
const labelClass = 'text-xs font-semibold uppercase tracking-wide';

export function recurringFromRecord(record: {
  id: string;
  customerName?: string | null;
  frequency?: string | null;
  startDate?: string | null;
  nextRunDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  status?: string | null;
  items?: unknown;
}): RecurringFormValues {
  const toInput = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  };

  const rawItems = Array.isArray(record.items) ? (record.items as RecurringLine[]) : [];

  return {
    id: record.id,
    customerName: record.customerName || '',
    frequency: record.frequency || 'monthly',
    startDate: toInput(record.startDate),
    nextRunDate: toInput(record.nextRunDate),
    endDate: toInput(record.endDate),
    notes: record.notes || '',
    status: record.status || 'active',
    items: rawItems.length
      ? rawItems.map((item) => ({
          description: item.description || '',
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0,
        }))
      : [{ description: '', quantity: 1, rate: 0, amount: 0 }],
  };
}

export default function RecurringForm({ mode, initial }: { mode: 'create' | 'edit'; initial: RecurringFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<RecurringFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof RecurringFormValues>(key: K, value: RecurringFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setItem = (index: number, patch: Partial<RecurringLine>) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, ...patch };
        next.amount = Math.round(next.quantity * next.rate * 100) / 100;
        return next;
      }),
    }));

  const total = form.items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.startDate) {
      setError('Pick the first billing date.');
      return;
    }
    const cleanItems = form.items.filter((item) => item.description.trim());
    if (cleanItems.length === 0) {
      setError('Add at least one line item.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: form.id,
        customerName: form.customerName.trim(),
        frequency: form.frequency,
        startDate: form.startDate,
        nextRunDate: form.nextRunDate || form.startDate,
        endDate: form.endDate || null,
        notes: form.notes.trim(),
        status: form.status,
        items: cleanItems,
      };

      const res = await fetch('/api/recurring-invoices', {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this schedule');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/finance/recurring-invoices');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this schedule');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/finance/recurring-invoices')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to recurring invoices"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'New recurring invoice' : 'Edit recurring invoice'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Set the customer, cycle and line items once — invoices repeat on schedule
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Schedule
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Customer
                </span>
                <input
                  value={form.customerName}
                  onChange={(event) => set('customerName', event.target.value)}
                  placeholder="Customer or account name"
                  className={`${fieldClass} mt-1`}
                />
              </label>

              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Frequency
                </span>
                <select
                  value={form.frequency}
                  onChange={(event) => set('frequency', event.target.value)}
                  className={`${fieldClass} mt-1`}
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(event) => set('status', event.target.value)}
                  className={`${fieldClass} mt-1`}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  First billing date *
                </span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => set('startDate', event.target.value)}
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>

              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Next run
                </span>
                <input
                  type="date"
                  value={form.nextRunDate}
                  onChange={(event) => set('nextRunDate', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>

              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  End date
                </span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => set('endDate', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Line items
              </h2>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }] }))
                }
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add line
              </button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-2 rounded-xl p-3 sm:grid-cols-12"
                  style={{ background: 'hsl(var(--secondary))' }}
                >
                  <input
                    value={item.description}
                    onChange={(event) => setItem(index, { description: event.target.value })}
                    placeholder="Description"
                    className={`${fieldClass} sm:col-span-5`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) => setItem(index, { quantity: Number(event.target.value) || 0 })}
                    placeholder="Qty"
                    className={`${fieldClass} sm:col-span-2`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.rate}
                    onChange={(event) => setItem(index, { rate: Number(event.target.value) || 0 })}
                    placeholder="Rate"
                    className={`${fieldClass} sm:col-span-2`}
                  />
                  <div className="flex items-center justify-between gap-2 sm:col-span-3">
                    <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      ₹{(item.amount || 0).toLocaleString('en-IN')}
                    </span>
                    {form.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, items: prev.items.filter((_, itemIndex) => itemIndex !== index) }))
                        }
                        className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between border-t pt-3 text-sm font-semibold" style={{ borderColor: 'hsl(var(--border))' }}>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Invoice value per cycle</span>
              <span style={{ color: 'hsl(var(--foreground))' }}>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <label>
              <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                Notes
              </span>
              <textarea
                value={form.notes}
                onChange={(event) => set('notes', event.target.value)}
                rows={3}
                placeholder="Payment terms, PO reference…"
                className={`${fieldClass} mt-1 resize-none`}
              />
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/finance/recurring-invoices')}
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:bg-black/5"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || saved}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
              }}
            >
              {saved ? <CheckCircle2 className="h-4 w-4" /> : saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved' : saving ? 'Saving…' : mode === 'create' ? 'Create schedule' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
