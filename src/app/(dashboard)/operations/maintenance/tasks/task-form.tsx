'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, ClipboardList, Loader2, Save } from 'lucide-react';

export const TASK_TYPES = [
  { id: 'preventive', label: 'Preventive' },
  { id: 'corrective', label: 'Corrective' },
  { id: 'inspection', label: 'Inspection' },
];

export const TASK_STATUSES = [
  { id: 'planned', label: 'Planned' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
  { id: 'skipped', label: 'Skipped' },
];

export interface TaskFormValues {
  id?: string;
  assetId: string;
  title: string;
  type: string;
  status: string;
  dueAt: string;
  technician: string;
  cost: string;
  notes: string;
}

export const emptyTask: TaskFormValues = {
  assetId: '',
  title: '',
  type: 'preventive',
  status: 'planned',
  dueAt: '',
  technician: '',
  cost: '',
  notes: '',
};

interface AssetOption {
  id: string;
  name: string;
  code: string | null;
}

export default function TaskForm({
  mode,
  initial,
  assetLabel,
}: {
  mode: 'create' | 'edit';
  initial: TaskFormValues;
  assetLabel?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<TaskFormValues>(initial);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/maintenance/assets');
        if (!res.ok) throw new Error('Could not load assets');
        const data = await res.json();
        if (!cancelled) setAssets(data.assets || []);
      } catch {
        if (!cancelled) setAssets([]);
      } finally {
        if (!cancelled) setLoadingAssets(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.assetId) {
      setError('Pick the asset this service belongs to.');
      return;
    }
    if (!form.title.trim()) {
      setError('Describe the service in a few words.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/maintenance/tasks', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          assetId: form.assetId,
          title: form.title.trim(),
          type: form.type,
          status: form.status,
          dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
          technician: form.technician.trim(),
          cost: Number(form.cost) || 0,
          notes: form.notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this service');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/operations/maintenance?tab=schedule');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this service');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/operations/maintenance?tab=schedule')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to service schedule"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'Schedule a service' : 'Edit service'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {assetLabel ? `For ${assetLabel}` : 'Plan preventive work so nothing is missed.'}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <section
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              <ClipboardList className="h-4 w-4" />
              Service details
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="asset" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Asset *
                </label>
                <select
                  id="asset"
                  value={form.assetId}
                  onChange={(event) => set('assetId', event.target.value)}
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  disabled={loadingAssets}
                  required
                >
                  <option value="">{loadingAssets ? 'Loading assets…' : 'Select an asset'}</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.code ? `${asset.code} — ${asset.name}` : asset.name}
                    </option>
                  ))}
                </select>
                {!loadingAssets && assets.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">Add an asset first, then schedule its service.</p>
                )}
              </div>

              <div>
                <label htmlFor="title" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  What has to be done? *
                </label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(event) => set('title', event.target.value)}
                  placeholder="e.g. Quarterly oil and filter change"
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
                    {TASK_TYPES.map((entry) => (
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
                    {TASK_STATUSES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="due" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Due on
                  </label>
                  <input
                    id="due"
                    type="datetime-local"
                    value={form.dueAt}
                    onChange={(event) => set('dueAt', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="technician" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Technician / vendor
                  </label>
                  <input
                    id="technician"
                    value={form.technician}
                    onChange={(event) => set('technician', event.target.value)}
                    placeholder="Who will do the work?"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cost" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Cost (Rs.)
                  </label>
                  <input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(event) => set('cost', event.target.value)}
                    placeholder="0"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) => set('notes', event.target.value)}
                  rows={3}
                  placeholder="Parts used, readings, follow-up needed"
                  className="glass-input w-full resize-none rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
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
              onClick={() => router.push('/operations/maintenance?tab=schedule')}
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
              {saved ? 'Saved' : mode === 'create' ? 'Schedule service' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
