'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import RecurringForm, { recurringFromRecord, type RecurringFormValues } from '../../recurring-form';

export default function EditRecurringInvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [values, setValues] = useState<RecurringFormValues | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/recurring-invoices');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Recurring invoice not found');
        }
        const rows = await res.json();
        if (cancelled) return;
        const record = Array.isArray(rows) ? rows.find((row: { id: string }) => row.id === id) : null;
        if (!record) throw new Error('Recurring invoice not found');
        setValues(recurringFromRecord(record));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Recurring invoice not found');
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
            onClick={() => router.push('/finance/recurring-invoices')}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to recurring invoices
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
        Loading schedule…
      </div>
    );
  }

  return <RecurringForm mode="edit" initial={values} />;
}
