'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Save, Wrench } from 'lucide-react';

export const JOB_STATUSES = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const JOB_PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
];

export interface JobFormValues {
  id?: string;
  jobNumber?: string | null;
  title: string;
  customerName: string;
  contactPhone: string;
  address: string;
  technician: string;
  priority: string;
  status: string;
  scheduledFor: string;
  estimatedHours: string;
  labourCost: string;
  partsCost: string;
  description: string;
  notes: string;
}

export const emptyJob: JobFormValues = {
  title: '',
  customerName: '',
  contactPhone: '',
  address: '',
  technician: '',
  priority: 'normal',
  status: 'scheduled',
  scheduledFor: '',
  estimatedHours: '',
  labourCost: '',
  partsCost: '',
  description: '',
  notes: '',
};

export default function JobForm({ mode, initial }: { mode: 'create' | 'edit'; initial: JobFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<JobFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const total = useMemo(
    () => (Number(form.labourCost) || 0) + (Number(form.partsCost) || 0),
    [form.labourCost, form.partsCost],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Give the job a short title.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: form.id,
        title: form.title.trim(),
        customerName: form.customerName.trim(),
        contactPhone: form.contactPhone.trim(),
        address: form.address.trim(),
        technician: form.technician.trim(),
        priority: form.priority,
        status: form.status,
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
        estimatedHours: form.estimatedHours,
        labourCost: Number(form.labourCost) || 0,
        partsCost: Number(form.partsCost) || 0,
        description: form.description.trim(),
        notes: form.notes.trim(),
      };

      const res = await fetch('/api/field-service', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this job');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/operations/field-service');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this job');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/operations/field-service')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to field service"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'Schedule a job' : `Edit ${initial.jobNumber || 'job'}`}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Dispatch a technician on site and track the labour and parts used.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <section
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              <Wrench className="h-4 w-4" />
              Job details
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  What needs to be done? *
                </label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(event) => set('title', event.target.value)}
                  placeholder="e.g. AC not cooling — site visit"
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="customer" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Customer
                  </label>
                  <input
                    id="customer"
                    value={form.customerName}
                    onChange={(event) => set('customerName', event.target.value)}
                    placeholder="Customer or company"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Contact number
                  </label>
                  <input
                    id="phone"
                    value={form.contactPhone}
                    onChange={(event) => set('contactPhone', event.target.value)}
                    placeholder="Phone on site"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Site address
                </label>
                <textarea
                  id="address"
                  value={form.address}
                  onChange={(event) => set('address', event.target.value)}
                  rows={2}
                  placeholder="Where the technician has to go"
                  className="glass-input w-full resize-none rounded-xl px-3 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="technician" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Technician
                  </label>
                  <input
                    id="technician"
                    value={form.technician}
                    onChange={(event) => set('technician', event.target.value)}
                    placeholder="Who is going?"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="scheduled" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Scheduled for
                  </label>
                  <input
                    id="scheduled"
                    type="datetime-local"
                    value={form.scheduledFor}
                    onChange={(event) => set('scheduledFor', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="priority" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={form.priority}
                    onChange={(event) => set('priority', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  >
                    {JOB_PRIORITIES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Status
                  </label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(event) => set('status', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  >
                    {JOB_STATUSES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="hours" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Estimated hours
                  </label>
                  <input
                    id="hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.estimatedHours}
                    onChange={(event) => set('estimatedHours', event.target.value)}
                    placeholder="2"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Costing
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="labour" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Labour (Rs.)
                </label>
                <input
                  id="labour"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.labourCost}
                  onChange={(event) => set('labourCost', event.target.value)}
                  placeholder="0.00"
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="parts" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Parts (Rs.)
                </label>
                <input
                  id="parts"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.partsCost}
                  onChange={(event) => set('partsCost', event.target.value)}
                  placeholder="0.00"
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Job total {`Rs.${total.toFixed(2)}`}
            </p>
          </section>

          <section
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Work description
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                  rows={3}
                  placeholder="What the customer reported"
                  className="glass-input w-full resize-none rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="notes" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Technician notes
                </label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) => set('notes', event.target.value)}
                  rows={2}
                  placeholder="Parts replaced, follow-up needed…"
                  className="glass-input w-full resize-none rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving || saved}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
              }}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </>
              ) : saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {mode === 'create' ? 'Schedule job' : 'Save changes'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/operations/field-service')}
              className="rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-black/5"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
