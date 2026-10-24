'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Fuel, Loader2, Save } from 'lucide-react';

export const LOG_TYPES = [
  { id: 'fuel', label: 'Fuel' },
  { id: 'service', label: 'Service' },
  { id: 'repair', label: 'Repair' },
  { id: 'insurance', label: 'Insurance / permit' },
  { id: 'other', label: 'Other' },
];

export interface LogFormValues {
  id?: string;
  vehicleId: string;
  type: string;
  date: string;
  litres: string;
  cost: string;
  odometer: string;
  vendor: string;
  notes: string;
}

function todayInput(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export const emptyLog: LogFormValues = {
  vehicleId: '',
  type: 'fuel',
  date: '',
  litres: '',
  cost: '',
  odometer: '',
  vendor: '',
  notes: '',
};

interface VehicleOption {
  id: string;
  name: string;
  registration: string | null;
}

export default function LogForm({
  mode,
  initial,
  vehicleLabel,
}: {
  mode: 'create' | 'edit';
  initial: LogFormValues;
  vehicleLabel?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LogFormValues>(initial.date ? initial : { ...initial, date: todayInput() });
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof LogFormValues>(key: K, value: LogFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/fleet/vehicles');
        if (!res.ok) throw new Error('Could not load vehicles');
        const data = await res.json();
        if (!cancelled) setVehicles(data.vehicles || []);
      } catch {
        if (!cancelled) setVehicles([]);
      } finally {
        if (!cancelled) setLoadingVehicles(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isFuel = form.type === 'fuel';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.vehicleId) {
      setError('Pick the vehicle for this entry.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/fleet/logs', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          vehicleId: form.vehicleId,
          type: form.type,
          date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
          litres: isFuel ? form.litres : null,
          cost: Number(form.cost) || 0,
          odometer: form.odometer,
          vendor: form.vendor.trim(),
          notes: form.notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this entry');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/operations/fleet?tab=costs');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this entry');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/operations/fleet?tab=costs')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to running costs"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'Add a running cost' : 'Edit running cost'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {vehicleLabel ? `For ${vehicleLabel}` : 'Log fuel, servicing and repairs to see the true cost per vehicle.'}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <section
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              <Fuel className="h-4 w-4" />
              Entry details
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="vehicle" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Vehicle *
                </label>
                <select
                  id="vehicle"
                  value={form.vehicleId}
                  onChange={(event) => set('vehicleId', event.target.value)}
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  disabled={loadingVehicles}
                  required
                >
                  <option value="">{loadingVehicles ? 'Loading vehicles…' : 'Select a vehicle'}</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registration ? `${vehicle.registration} — ${vehicle.name}` : vehicle.name}
                    </option>
                  ))}
                </select>
                {!loadingVehicles && vehicles.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">Add a vehicle first, then log its costs.</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="type" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Entry type
                  </label>
                  <select
                    id="type"
                    value={form.type}
                    onChange={(event) => set('type', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  >
                    {LOG_TYPES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="date" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Date *
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(event) => set('date', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="cost" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Amount (Rs.) *
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
                    required
                  />
                </div>
                <div>
                  <label htmlFor="litres" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Litres {isFuel ? '' : '(fuel only)'}
                  </label>
                  <input
                    id="litres"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.litres}
                    onChange={(event) => set('litres', event.target.value)}
                    placeholder="0"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm disabled:opacity-60"
                    disabled={!isFuel}
                  />
                </div>
                <div>
                  <label htmlFor="odometer" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Odometer (km)
                  </label>
                  <input
                    id="odometer"
                    type="number"
                    min="0"
                    step="1"
                    value={form.odometer}
                    onChange={(event) => set('odometer', event.target.value)}
                    placeholder="Current reading"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vendor" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Vendor / pump
                </label>
                <input
                  id="vendor"
                  value={form.vendor}
                  onChange={(event) => set('vendor', event.target.value)}
                  placeholder="Where the money was spent"
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                />
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
                  placeholder="Invoice number, work done, tyres changed"
                  className="glass-input w-full resize-none rounded-xl px-3 py-2.5 text-sm"
                />
              </div>

              {Number(form.cost) > 0 && (
                <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                  <span className="font-semibold">Rs.{Math.round(Number(form.cost)).toLocaleString('en-IN')}</span>
                  {isFuel && Number(form.litres) > 0 && (
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {' '}
                      · Rs.{(Number(form.cost) / Number(form.litres)).toFixed(2)} per litre
                    </span>
                  )}
                  {Number(form.odometer) > 0 && (
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}> · odometer {Number(form.odometer).toLocaleString('en-IN')} km</span>
                  )}
                </div>
              )}
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
              onClick={() => router.push('/operations/fleet?tab=costs')}
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
              {saved ? 'Saved' : mode === 'create' ? 'Add entry' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
