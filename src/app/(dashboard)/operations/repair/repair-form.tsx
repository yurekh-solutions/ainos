'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Plus, Save, Trash2 } from 'lucide-react';

export const REPAIR_STATUSES = [
  { id: 'received', label: 'Received' },
  { id: 'diagnosed', label: 'Diagnosed' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'awaiting_parts', label: 'Awaiting parts' },
  { id: 'ready', label: 'Ready for pickup' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const REPAIR_PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
];

export const REPAIR_LINE_KINDS = [
  { id: 'part', label: 'Part' },
  { id: 'labor', label: 'Labour' },
  { id: 'service', label: 'Service' },
];

export interface RepairLineValue {
  kind: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface RepairFormValues {
  id?: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceName: string;
  serialNumber: string;
  underWarranty: boolean;
  issue: string;
  diagnosis: string;
  resolution: string;
  status: string;
  priority: string;
  technician: string;
  receivedAt: string;
  promisedAt: string;
  notes: string;
  lines: RepairLineValue[];
}

export const emptyRepair: RepairFormValues = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  deviceName: '',
  serialNumber: '',
  underWarranty: false,
  issue: '',
  diagnosis: '',
  resolution: '',
  status: 'received',
  priority: 'normal',
  technician: '',
  receivedAt: '',
  promisedAt: '',
  notes: '',
  lines: [{ kind: 'part', description: '', quantity: 1, unitPrice: 0, amount: 0 }],
};

const fieldClass = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';
const labelClass = 'text-xs font-semibold uppercase tracking-wide';

export function repairFromRecord(record: {
  id: string;
  orderNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  deviceName?: string | null;
  serialNumber?: string | null;
  underWarranty?: boolean | null;
  issue?: string | null;
  diagnosis?: string | null;
  resolution?: string | null;
  status?: string | null;
  priority?: string | null;
  technician?: string | null;
  receivedAt?: string | null;
  promisedAt?: string | null;
  notes?: string | null;
  lines?: Array<{ kind?: string | null; description?: string | null; quantity?: number | null; unitPrice?: number | null; amount?: number | null }> | null;
}): RepairFormValues {
  const toInput = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  };

  const lines = Array.isArray(record.lines) ? record.lines : [];

  return {
    id: record.id,
    orderNumber: record.orderNumber || '',
    customerName: record.customerName || '',
    customerPhone: record.customerPhone || '',
    customerEmail: record.customerEmail || '',
    deviceName: record.deviceName || '',
    serialNumber: record.serialNumber || '',
    underWarranty: Boolean(record.underWarranty),
    issue: record.issue || '',
    diagnosis: record.diagnosis || '',
    resolution: record.resolution || '',
    status: record.status || 'received',
    priority: record.priority || 'normal',
    technician: record.technician || '',
    receivedAt: toInput(record.receivedAt),
    promisedAt: toInput(record.promisedAt),
    notes: record.notes || '',
    lines: lines.length
      ? lines.map((line) => ({
          kind: line.kind || 'part',
          description: line.description || '',
          quantity: Number(line.quantity) || 0,
          unitPrice: Number(line.unitPrice) || 0,
          amount: Number(line.amount) || 0,
        }))
      : [{ kind: 'part', description: '', quantity: 1, unitPrice: 0, amount: 0 }],
  };
}

export default function RepairForm({ mode, initial }: { mode: 'create' | 'edit'; initial: RepairFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<RepairFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof RepairFormValues>(key: K, value: RepairFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setLine = (index: number, patch: Partial<RepairLineValue>) =>
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, lineIndex) => {
        if (lineIndex !== index) return line;
        const next = { ...line, ...patch };
        next.amount = Math.round(next.quantity * next.unitPrice * 100) / 100;
        return next;
      }),
    }));

  const partsCost = form.lines.filter((line) => line.kind === 'part').reduce((sum, line) => sum + (line.amount || 0), 0);
  const laborCost = form.lines.filter((line) => line.kind !== 'part').reduce((sum, line) => sum + (line.amount || 0), 0);
  const totalCost = partsCost + laborCost;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!form.deviceName.trim()) {
      setError('Tell us what is being repaired.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: form.id,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim(),
        deviceName: form.deviceName.trim(),
        serialNumber: form.serialNumber.trim(),
        underWarranty: form.underWarranty,
        issue: form.issue.trim(),
        diagnosis: form.diagnosis.trim(),
        resolution: form.resolution.trim(),
        status: form.status,
        priority: form.priority,
        technician: form.technician.trim(),
        receivedAt: form.receivedAt || null,
        promisedAt: form.promisedAt || null,
        notes: form.notes.trim(),
        lines: form.lines.filter((line) => line.description.trim()),
      };

      const res = await fetch('/api/repair', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this repair order');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/operations/repair');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this repair order');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/operations/repair')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to repair orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'New repair order' : `Repair ${form.orderNumber || 'order'}`}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Track intake, diagnosis, parts and handover for every job
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Customer
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Name *
                </span>
                <input
                  value={form.customerName}
                  onChange={(event) => set('customerName', event.target.value)}
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
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Email
                </span>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(event) => set('customerEmail', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Item and fault
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Device / item *
                </span>
                <input
                  value={form.deviceName}
                  onChange={(event) => set('deviceName', event.target.value)}
                  placeholder="HP LaserJet 1020"
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Serial number
                </span>
                <input
                  value={form.serialNumber}
                  onChange={(event) => set('serialNumber', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Reported issue
                </span>
                <textarea
                  value={form.issue}
                  onChange={(event) => set('issue', event.target.value)}
                  rows={2}
                  className={`${fieldClass} mt-1 resize-none`}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Diagnosis
                </span>
                <textarea
                  value={form.diagnosis}
                  onChange={(event) => set('diagnosis', event.target.value)}
                  rows={2}
                  className={`${fieldClass} mt-1 resize-none`}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Resolution
                </span>
                <textarea
                  value={form.resolution}
                  onChange={(event) => set('resolution', event.target.value)}
                  rows={2}
                  className={`${fieldClass} mt-1 resize-none`}
                />
              </label>
              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.underWarranty}
                  onChange={(event) => set('underWarranty', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  Under warranty
                </span>
              </label>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Job tracking
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Status
                </span>
                <select value={form.status} onChange={(event) => set('status', event.target.value)} className={`${fieldClass} mt-1`}>
                  {REPAIR_STATUSES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Priority
                </span>
                <select value={form.priority} onChange={(event) => set('priority', event.target.value)} className={`${fieldClass} mt-1`}>
                  {REPAIR_PRIORITIES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Technician
                </span>
                <input
                  value={form.technician}
                  onChange={(event) => set('technician', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Received
                </span>
                <input
                  type="date"
                  value={form.receivedAt}
                  onChange={(event) => set('receivedAt', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Promised
                </span>
                <input
                  type="date"
                  value={form.promisedAt}
                  onChange={(event) => set('promisedAt', event.target.value)}
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
                Parts and labour
              </h2>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    lines: [...prev.lines, { kind: 'part', description: '', quantity: 1, unitPrice: 0, amount: 0 }],
                  }))
                }
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add line
              </button>
            </div>

            <div className="space-y-3">
              {form.lines.map((line, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-2 rounded-xl p-3 sm:grid-cols-12"
                  style={{ background: 'hsl(var(--secondary))' }}
                >
                  <select
                    value={line.kind}
                    onChange={(event) => setLine(index, { kind: event.target.value })}
                    className={`${fieldClass} sm:col-span-2`}
                  >
                    {REPAIR_LINE_KINDS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={line.description}
                    onChange={(event) => setLine(index, { description: event.target.value })}
                    placeholder="Description"
                    className={`${fieldClass} sm:col-span-4`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.quantity}
                    onChange={(event) => setLine(index, { quantity: Number(event.target.value) || 0 })}
                    placeholder="Qty"
                    className={`${fieldClass} sm:col-span-2`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(event) => setLine(index, { unitPrice: Number(event.target.value) || 0 })}
                    placeholder="Rate"
                    className={`${fieldClass} sm:col-span-2`}
                  />
                  <div className="flex items-center justify-between gap-2 sm:col-span-2">
                    <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      ₹{(line.amount || 0).toLocaleString('en-IN')}
                    </span>
                    {form.lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, lines: prev.lines.filter((_, lineIndex) => lineIndex !== index) }))
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

            <div className="mt-4 space-y-1 border-t pt-3 text-sm" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="flex justify-between">
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Parts</span>
                <span style={{ color: 'hsl(var(--foreground))' }}>₹{partsCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Labour</span>
                <span style={{ color: 'hsl(var(--foreground))' }}>₹{laborCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                <span>Total</span>
                <span>₹{totalCost.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <label>
              <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                Internal notes
              </span>
              <textarea
                value={form.notes}
                onChange={(event) => set('notes', event.target.value)}
                rows={3}
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
              onClick={() => router.push('/operations/repair')}
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
              {saved ? 'Saved' : saving ? 'Saving…' : mode === 'create' ? 'Create order' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
