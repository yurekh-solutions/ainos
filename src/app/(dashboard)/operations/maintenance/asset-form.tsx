'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Boxes, CheckCircle2, Loader2, Save } from 'lucide-react';

export const ASSET_STATUSES = [
  { id: 'active', label: 'Active' },
  { id: 'under_maintenance', label: 'Under maintenance' },
  { id: 'retired', label: 'Retired' },
];

export const ASSET_CATEGORIES = [
  { id: 'equipment', label: 'Equipment' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'it', label: 'IT / network' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'other', label: 'Other' },
];

export interface AssetFormValues {
  id?: string;
  name: string;
  code: string;
  category: string;
  location: string;
  serialNumber: string;
  assignedTo: string;
  purchasedAt: string;
  warrantyUntil: string;
  status: string;
  notes: string;
}

export const emptyAsset: AssetFormValues = {
  name: '',
  code: '',
  category: 'equipment',
  location: '',
  serialNumber: '',
  assignedTo: '',
  purchasedAt: '',
  warrantyUntil: '',
  status: 'active',
  notes: '',
};

export default function AssetForm({ mode, initial }: { mode: 'create' | 'edit'; initial: AssetFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<AssetFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof AssetFormValues>(key: K, value: AssetFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Give the asset a name.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/maintenance/assets', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          name: form.name.trim(),
          code: form.code.trim(),
          category: form.category,
          location: form.location.trim(),
          serialNumber: form.serialNumber.trim(),
          assignedTo: form.assignedTo.trim(),
          purchasedAt: form.purchasedAt || null,
          warrantyUntil: form.warrantyUntil || null,
          status: form.status,
          notes: form.notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this asset');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/operations/maintenance');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this asset');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/operations/maintenance')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to maintenance"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'Add an asset' : `Edit ${initial.name}`}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Register the equipment you service so its upkeep is tracked in one place.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <section
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              <Boxes className="h-4 w-4" />
              Asset details
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Asset name *
                </label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(event) => set('name', event.target.value)}
                  placeholder="e.g. DG set 125 kVA"
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="code" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Asset code
                  </label>
                  <input
                    id="code"
                    value={form.code}
                    onChange={(event) => set('code', event.target.value)}
                    placeholder="e.g. AST-014"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Category
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(event) => set('category', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  >
                    {ASSET_CATEGORIES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="location" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Location
                  </label>
                  <input
                    id="location"
                    value={form.location}
                    onChange={(event) => set('location', event.target.value)}
                    placeholder="Site, floor or plant"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="serial" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Serial number
                  </label>
                  <input
                    id="serial"
                    value={form.serialNumber}
                    onChange={(event) => set('serialNumber', event.target.value)}
                    placeholder="Manufacturer serial"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="assigned" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Assigned to
                  </label>
                  <input
                    id="assigned"
                    value={form.assignedTo}
                    onChange={(event) => set('assignedTo', event.target.value)}
                    placeholder="Custodian or department"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
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
                    {ASSET_STATUSES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="purchased" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Purchased on
                  </label>
                  <input
                    id="purchased"
                    type="date"
                    value={form.purchasedAt}
                    onChange={(event) => set('purchasedAt', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="warranty" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Warranty until
                  </label>
                  <input
                    id="warranty"
                    type="date"
                    value={form.warrantyUntil}
                    onChange={(event) => set('warrantyUntil', event.target.value)}
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
                  placeholder="Service contract, spares, anything the technician should know"
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
              onClick={() => router.push('/operations/maintenance')}
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
              {saved ? 'Saved' : mode === 'create' ? 'Add asset' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
