'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, ListChecks, Loader2, Plus, Save, Trash2, XCircle } from 'lucide-react';

export const QUALITY_TYPES = [
  { id: 'inspection', label: 'Inspection' },
  { id: 'test', label: 'Test' },
  { id: 'audit', label: 'Audit' },
];

export const QUALITY_STATUSES = [
  { id: 'pending', label: 'Pending' },
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
];

export interface ChecklistRow {
  item: string;
  pass: boolean;
}

export interface QualityFormValues {
  id?: string;
  title: string;
  type: string;
  status: string;
  inspector: string;
  notes: string;
  checklist: ChecklistRow[];
}

export const emptyQuality: QualityFormValues = {
  title: '',
  type: 'inspection',
  status: 'pending',
  inspector: '',
  notes: '',
  checklist: [{ item: '', pass: true }],
};

export default function QualityForm({ mode, initial }: { mode: 'create' | 'edit'; initial: QualityFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<QualityFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof QualityFormValues>(key: K, value: QualityFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setRow = (index: number, patch: Partial<ChecklistRow>) =>
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }));

  const addRow = () => setForm((prev) => ({ ...prev, checklist: [...prev.checklist, { item: '', pass: true }] }));

  const removeRow = (index: number) =>
    setForm((prev) => ({ ...prev, checklist: prev.checklist.filter((_, rowIndex) => rowIndex !== index) }));

  const passedCount = form.checklist.filter((row) => row.item.trim() && row.pass).length;
  const failedCount = form.checklist.filter((row) => row.item.trim() && !row.pass).length;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Give the quality check a title.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/quality', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          title: form.title.trim(),
          type: form.type,
          status: form.status,
          inspector: form.inspector.trim(),
          notes: form.notes.trim(),
          checklist: form.checklist.filter((row) => row.item.trim()),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this check');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/operations/quality');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this check');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/operations/quality')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to quality"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'New quality check' : `Edit ${initial.title}`}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Record what you checked and whether it passed.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <section
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              <ListChecks className="h-4 w-4" />
              Check details
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  What is being checked? *
                </label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(event) => set('title', event.target.value)}
                  placeholder="e.g. Incoming batch inspection — steel rods"
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="type" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Type
                  </label>
                  <select
                    id="type"
                    value={form.type}
                    onChange={(event) => set('type', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  >
                    {QUALITY_TYPES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Result
                  </label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(event) => set('status', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  >
                    {QUALITY_STATUSES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inspector" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Inspector
                  </label>
                  <input
                    id="inspector"
                    value={form.inspector}
                    onChange={(event) => set('inspector', event.target.value)}
                    placeholder="Who checked it"
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Checklist
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-600">{passedCount} pass</span>
                <span className="text-rose-600">{failedCount} fail</span>
              </div>
            </div>

            <div className="space-y-2">
              {form.checklist.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={row.item}
                    onChange={(event) => setRow(index, { item: event.target.value })}
                    placeholder={`Check ${index + 1}`}
                    className="glass-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setRow(index, { pass: !row.pass })}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                      row.pass
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    {row.pass ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {row.pass ? 'Pass' : 'Fail'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="shrink-0 rounded-lg border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                    aria-label="Remove checklist row"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-black/5"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add check
            </button>

            <div className="mt-4">
              <label htmlFor="notes" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Notes
              </label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(event) => set('notes', event.target.value)}
                rows={3}
                placeholder="Observations, corrective action, batch reference"
                className="glass-input w-full resize-none rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
          </section>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/operations/quality')}
              className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
              }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? 'Saved' : mode === 'create' ? 'Create check' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
