'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import TaskForm, { emptyTask, type TaskFormValues } from '../../task-form';

/** Converts an ISO timestamp into the local value a datetime-local input expects. */
function toLocalInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function EditMaintenanceTaskPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [values, setValues] = useState<TaskFormValues | null>(null);
  const [assetLabel, setAssetLabel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/maintenance/tasks?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Service not found');
        }
        const data = await res.json();
        const task = data.task;
        if (cancelled) return;
        setAssetLabel(task.asset?.name || '');
        setValues({
          ...emptyTask,
          id: task.id,
          assetId: task.assetId || '',
          title: task.title || '',
          type: task.type || 'preventive',
          status: task.status || 'planned',
          dueAt: toLocalInput(task.dueAt),
          technician: task.technician || '',
          cost: task.cost ? String(task.cost) : '',
          notes: task.notes || '',
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Service not found');
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
            onClick={() => router.push('/operations/maintenance?tab=schedule')}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to schedule
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
        Loading service…
      </div>
    );
  }

  return <TaskForm mode="edit" initial={values} assetLabel={assetLabel} />;
}
