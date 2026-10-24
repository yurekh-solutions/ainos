'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Boxes, CalendarClock, CheckCircle2, Loader2, Save, User } from 'lucide-react';
import RecordHistory from '@/components/audit/RecordHistory';

export const RENTAL_PERIODS = [
  { id: 'hour', label: 'Per hour' },
  { id: 'day', label: 'Per day' },
  { id: 'week', label: 'Per week' },
  { id: 'month', label: 'Per month' },
];

export const RENTAL_STATUSES = [
  { id: 'draft', label: 'Draft' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'out', label: 'On rent' },
  { id: 'returned', label: 'Returned' },
  { id: 'cancelled', label: 'Cancelled' },
];

export interface RentalFormValues {
  id?: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  itemName: string;
  itemRef: string;
  quantity: string;
  period: string;
  unitPrice: string;
  startDate: string;
  endDate: string;
  deposit: string;
  lateFee: string;
  status: string;
  notes: string;
}

export const emptyRental: RentalFormValues = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  itemName: '',
  itemRef: '',
  quantity: '1',
  period: 'day',
  unitPrice: '0',
  startDate: '',
  endDate: '',
  deposit: '0',
  lateFee: '0',
  status: 'draft',
  notes: '',
};

function toLocalInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function rentalFromRecord(record: {
  id: string;
  orderNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  itemName?: string | null;
  itemRef?: string | null;
  quantity?: number | null;
  period?: string | null;
  unitPrice?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  deposit?: number | null;
  lateFee?: number | null;
  status?: string | null;
  notes?: string | null;
}): RentalFormValues {
  return {
    id: record.id,
    orderNumber: record.orderNumber || '',
    customerName: record.customerName || '',
    customerPhone: record.customerPhone || '',
    customerEmail: record.customerEmail || '',
    itemName: record.itemName || '',
    itemRef: record.itemRef || '',
    quantity: String(record.quantity ?? 1),
    period: record.period || 'day',
    unitPrice: String(record.unitPrice ?? 0),
    startDate: toLocalInput(record.startDate),
    endDate: toLocalInput(record.endDate),
    deposit: String(record.deposit ?? 0),
    lateFee: String(record.lateFee ?? 0),
    status: record.status || 'draft',
    notes: record.notes || '',
  };
}

export function rentalPeriods(startDate: string, endDate: string, period: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  const hours = (end - start) / 3600000;
  if (period === 'hour') return Math.max(1, Math.ceil(hours));
  if (period === 'week') return Math.max(1, Math.ceil(hours / 168));
  if (period === 'month') return Math.max(1, Math.ceil(hours / 720));
  return Math.max(1, Math.ceil(hours / 24));
}

const labelClass = 'text-xs font-semibold uppercase tracking-wide';
const fieldClass = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';

export default function RentalForm({ mode, initial }: { mode: 'create' | 'edit'; initial: RentalFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<RentalFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof RentalFormValues>(key: K, value: RentalFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const periods = rentalPeriods(form.startDate, form.endDate, form.period);
  const quantity = Number(form.quantity) || 0;
  const unitPrice = Number(form.unitPrice) || 0;
  const deposit = Number(form.deposit) || 0;
  const lateFee = Number(form.lateFee) || 0;
  const rentalFee = Math.round(quantity * unitPrice * periods * 100) / 100;
  const total = Math.round((rentalFee + deposit + lateFee) * 100) / 100;
  const money = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.customerName.trim()) {
      setError('Add the customer who is renting the item.');
      return;
    }
    if (!form.itemName.trim()) {
      setError('Add the item being rented out.');
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError('Pick both the pickup and return date.');
      return;
    }
    if (new Date(form.endDate).getTime() <= new Date(form.startDate).getTime()) {
      setError('The return date must be after the pickup date.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/rental', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          customerEmail: form.customerEmail.trim(),
          itemName: form.itemName.trim(),
          itemRef: form.itemRef.trim(),
          quantity,
          period: form.period,
          unitPrice,
          startDate: form.startDate,
          endDate: form.endDate,
          deposit,
          lateFee,
          status: form.status,
          notes: form.notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this rental order');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/rental');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this rental order');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/rental')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to rental orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'New rental order' : `Edit ${form.orderNumber || 'rental order'}`}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Rent out equipment, rooms or vehicles with deposit and late-fee tracking
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Customer
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="sm:col-span-1">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Name *
                </span>
                <input
                  value={form.customerName}
                  onChange={(event) => set('customerName', event.target.value)}
                  placeholder="Ravi Kumar"
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Phone
                </span>
                <input
                  value={form.customerPhone}
                  onChange={(event) => set('customerPhone', event.target.value)}
                  placeholder="98765 43210"
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Email
                </span>
                <input
                  value={form.customerEmail}
                  onChange={(event) => set('customerEmail', event.target.value)}
                  placeholder="customer@email.com"
                  className={`${fieldClass} mt-1`}
                />
              </label>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Boxes className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Item and pricing
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Item *
                </span>
                <input
                  value={form.itemName}
                  onChange={(event) => set('itemName', event.target.value)}
                  placeholder="JCB 3DX excavator"
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Asset / serial reference
                </span>
                <input
                  value={form.itemRef}
                  onChange={(event) => set('itemRef', event.target.value)}
                  placeholder="AST-0042"
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Quantity
                </span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.quantity}
                  onChange={(event) => set('quantity', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Billing period
                </span>
                <select
                  value={form.period}
                  onChange={(event) => set('period', event.target.value)}
                  className={`${fieldClass} mt-1`}
                >
                  {RENTAL_PERIODS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Rate per period (₹)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(event) => set('unitPrice', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Security deposit (₹)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deposit}
                  onChange={(event) => set('deposit', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Schedule and status
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Pickup *
                </span>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(event) => set('startDate', event.target.value)}
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Return *
                </span>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(event) => set('endDate', event.target.value)}
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Late fee (₹)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.lateFee}
                  onChange={(event) => set('lateFee', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
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
                  {RENTAL_STATUSES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Notes
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) => set('notes', event.target.value)}
                  rows={3}
                  placeholder="Delivery address, operator name, condition on handover…"
                  className={`${fieldClass} mt-1 resize-none`}
                />
              </label>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Periods
                </p>
                <p className="mt-1 text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  {periods || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Rental fee
                </p>
                <p className="mt-1 text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  {money(rentalFee)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Deposit + late fee
                </p>
                <p className="mt-1 text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  {money(deposit + lateFee)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Total
                </p>
                <p className="mt-1 text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  {money(total)}
                </p>
              </div>
            </div>
          </div>

          <RecordHistory entity="rental" entityId={form.id} />

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/rental')}
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
              {saved ? 'Saved' : saving ? 'Saving…' : mode === 'create' ? 'Create rental order' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
