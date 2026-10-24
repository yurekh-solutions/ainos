'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import LogForm, { emptyLog, type LogFormValues } from '../../log-form';

/** Converts an ISO timestamp into the value a date input expects. */
function toDateInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function EditVehicleLogPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [values, setValues] = useState<LogFormValues | null>(null);
  const [vehicleLabel, setVehicleLabel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/fleet/logs?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Entry not found');
        }
        const data = await res.json();
        const log = data.log;
        if (cancelled) return;
        setVehicleLabel(log.vehicle?.registration || log.vehicle?.name || '');
        setValues({
          ...emptyLog,
          id: log.id,
          vehicleId: log.vehicleId || '',
          type: log.type || 'fuel',
          date: toDateInput(log.date),
          litres: log.litres !== null && log.litres !== undefined ? String(log.litres) : '',
          cost: log.cost !== null && log.cost !== undefined ? String(log.cost) : '',
          odometer: log.odometer !== null && log.odometer !== undefined ? String(log.odometer) : '',
          vendor: log.vendor || '',
          notes: log.notes || '',
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Entry not found');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6" style={{ background: 'var(--page-gradient)' }}>
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-rose-600" />
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/operations/fleet?tab=costs')}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to running costs
          </button>
        </div>
      </div>
    );
  }

  if (!values) {
    return (
      <div
        className="flex h-full items-center justify-center gap-2 p-6 text-sm"
        style={{ background: 'var(--page-gradient)', color: 'hsl(var(--muted-foreground))' }}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading entry…
      </div>
    );
  }

  return <LogForm mode="edit" initial={values} vehicleLabel={vehicleLabel} />;
}
