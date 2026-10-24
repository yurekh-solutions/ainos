'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import AssetForm, { emptyAsset, type AssetFormValues } from '../../asset-form';

/** Converts an ISO timestamp into the value a date input expects. */
function toDateInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function EditAssetPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [values, setValues] = useState<AssetFormValues | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/maintenance/assets?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Asset not found');
        }
        const data = await res.json();
        const asset = data.asset;
        if (cancelled) return;
        setValues({
          ...emptyAsset,
          id: asset.id,
          name: asset.name || '',
          code: asset.code || '',
          category: asset.category || 'equipment',
          location: asset.location || '',
          serialNumber: asset.serialNumber || '',
          assignedTo: asset.assignedTo || '',
          purchasedAt: toDateInput(asset.purchasedAt),
          warrantyUntil: toDateInput(asset.warrantyUntil),
          status: asset.status || 'active',
          notes: asset.notes || '',
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Asset not found');
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
            onClick={() => router.push('/operations/maintenance')}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to maintenance
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
        Loading asset…
      </div>
    );
  }

  return <AssetForm mode="edit" initial={values} />;
}
