'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import QualityForm, { emptyQuality, type ChecklistRow, type QualityFormValues } from '../../quality-form';

export default function EditQualityCheckPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [values, setValues] = useState<QualityFormValues | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/quality?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Quality check not found');
        }
        const data = await res.json();
        const check = data.check;
        if (cancelled) return;

        const rows: ChecklistRow[] = Array.isArray(check.checklist)
          ? check.checklist
              .filter((row: ChecklistRow) => row?.item)
              .map((row: ChecklistRow) => ({ item: row.item, pass: Boolean(row.pass) }))
          : [];

        setValues({
          ...emptyQuality,
          id: check.id,
          title: check.title || '',
          type: check.type || 'inspection',
          status: check.status || 'pending',
          inspector: check.inspector || '',
          notes: check.notes || '',
          checklist: rows.length ? rows : [{ item: '', pass: true }],
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Quality check not found');
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
            onClick={() => router.push('/operations/quality')}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to quality
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
        Loading check…
      </div>
    );
  }

  return <QualityForm mode="edit" initial={values} />;
}
