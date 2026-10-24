'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import JobForm, { emptyJob, type JobFormValues } from '../../job-form';

/** Converts an ISO timestamp into the local value a datetime-local input expects. */
function toLocalInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function EditServiceJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [values, setValues] = useState<JobFormValues | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/field-service?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Job not found');
        }
        const data = await res.json();
        const job = data.job;
        if (cancelled) return;
        setValues({
          ...emptyJob,
          id: job.id,
          jobNumber: job.jobNumber,
          title: job.title || '',
          customerName: job.customerName || '',
          contactPhone: job.contactPhone || '',
          address: job.address || '',
          technician: job.technician || '',
          priority: job.priority || 'normal',
          status: job.status || 'scheduled',
          scheduledFor: toLocalInput(job.scheduledFor),
          estimatedHours: job.estimatedHours ? String(job.estimatedHours) : '',
          labourCost: job.labourCost ? String(job.labourCost) : '',
          partsCost: job.partsCost ? String(job.partsCost) : '',
          description: job.description || '',
          notes: job.notes || '',
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Job not found');
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
            onClick={() => router.push('/operations/field-service')}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to field service
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
        Loading job…
      </div>
    );
  }

  return <JobForm mode="edit" initial={values} />;
}
