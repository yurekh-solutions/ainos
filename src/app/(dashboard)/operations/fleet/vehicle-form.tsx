'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Car, CheckCircle2, Loader2, Save } from 'lucide-react';

export const VEHICLE_TYPES = [
  { id: 'car', label: 'Car' },
  { id: 'van', label: 'Van' },
  { id: 'truck', label: 'Truck' },
  { id: 'bike', label: 'Two-wheeler' },
];

export const VEHICLE_STATUSES = [
  { id: 'active', label: 'Active' },
  { id: 'in_service', label: 'In service' },
  { id: 'retired', label: 'Retired' },
];

export interface VehicleFormValues {
  id?: string;
  name: string;
  registration: string;
  type: string;
  driver: string;
  odometer: string;
  insuranceUntil: string;
  fitnessUntil: string;
  status: string;
  notes: string;
}

export const emptyVehicle: VehicleFormValues = {
  name: '',
  registration: '',
  type: 'car',
  driver: '',
  odometer: '',
  insuranceUntil: '',
  fitnessUntil: '',
  status: 'active',
  notes: '',
};

export default function VehicleForm({ mode, initial }: { mode: 'create' | 'edit'; initial: VehicleFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<VehicleFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Give the vehicle a name.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/fleet/vehicles', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          name: form.name.trim(),
          registration: form.registration.trim(),
          type: form.type,
          driver: form.driver.trim(),
          odometer: form.odometer,
          insuranceUntil: form.insuranceUntil || null,
          fitnessUntil: form.fitnessUntil || null,
          status: form.status,
          notes: form.notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this vehicle');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/operations/fleet');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this vehicle');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/operations/fleet')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to fleet"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'Add a vehicle' : `Edit ${initial.name}`}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Keep the vehicle, its driver and the statutory dates in one record.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <section
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              <Car className="h-4 w-4" />
              Vehicle details
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Vehicle name *
                  </label>
                  <input
                    id="name"
                    value={form.name}
                    onChange={(event) => set('name', event.target.value)}
                    placeholder="e.g. Delivery van 2"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="registration" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Registration number
                  </label>
                  <input
                    id="registration"
                    value={form.registration}
                    onChange={(event) => set('registration', event.target.value.toUpperCase())}
                    placeholder="MH 12 AB 1234"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm uppercase"
                  />
                </div>
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
                    {VEHICLE_TYPES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="driver" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Driver
                  </label>
                  <input
                    id="driver"
                    value={form.driver}
                    onChange={(event) => set('driver', event.target.value)}
                    placeholder="Assigned driver"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
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
                    placeholder="0"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="insurance" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Insurance valid until
                  </label>
                  <input
                    id="insurance"
                    type="date"
                    value={form.insuranceUntil}
                    onChange={(event) => set('insuranceUntil', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="fitness" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Fitness / permit until
                  </label>
                  <input
                    id="fitness"
                    type="date"
                    value={form.fitnessUntil}
                    onChange={(event) => set('fitnessUntil', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
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
                  {VEHICLE_STATUSES.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
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
                  placeholder="Loan, EMI, assigned route, anything to remember"
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
              onClick={() => router.push('/operations/fleet')}
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
              {saved ? 'Saved' : mode === 'create' ? 'Add vehicle' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
