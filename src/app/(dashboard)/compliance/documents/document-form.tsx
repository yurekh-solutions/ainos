'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2, Save } from 'lucide-react';

export const DOCUMENT_CATEGORIES = [
  { id: 'contract', label: 'Contract' },
  { id: 'license', label: 'License' },
  { id: 'certificate', label: 'Certificate' },
  { id: 'policy', label: 'Policy' },
  { id: 'other', label: 'Other' },
];

export interface DocumentFormValues {
  id?: string;
  name: string;
  category: string;
  url: string;
  expiryDate: string;
  notes: string;
}

export const emptyDocument: DocumentFormValues = {
  name: '',
  category: 'contract',
  url: '',
  expiryDate: '',
  notes: '',
};

function toInputDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function documentFromRecord(record: {
  id: string;
  name?: string | null;
  category?: string | null;
  url?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
}): DocumentFormValues {
  return {
    id: record.id,
    name: record.name || '',
    category: record.category || 'other',
    url: record.url || '',
    expiryDate: toInputDate(record.expiryDate || null),
    notes: record.notes || '',
  };
}

const labelClass = 'text-xs font-semibold uppercase tracking-wide';
const fieldClass = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';

export default function DocumentForm({ mode, initial }: { mode: 'create' | 'edit'; initial: DocumentFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<DocumentFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof DocumentFormValues>(key: K, value: DocumentFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Give the document a name.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/documents', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          name: form.name.trim(),
          category: form.category,
          url: form.url.trim(),
          expiryDate: form.expiryDate || null,
          notes: form.notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this document');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/compliance/documents');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this document');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/compliance/documents')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to documents"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'New document' : 'Edit document'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Contracts, licences, certificates and policies with expiry tracking
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Document
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Name *
                </span>
                <input
                  value={form.name}
                  onChange={(event) => set('name', event.target.value)}
                  placeholder="GST registration certificate"
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>

              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Category
                </span>
                <select
                  value={form.category}
                  onChange={(event) => set('category', event.target.value)}
                  className={`${fieldClass} mt-1`}
                >
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Expiry date
                </span>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(event) => set('expiryDate', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>

              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  File link
                </span>
                <input
                  value={form.url}
                  onChange={(event) => set('url', event.target.value)}
                  placeholder="https://…"
                  className={`${fieldClass} mt-1`}
                />
              </label>

              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Notes
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) => set('notes', event.target.value)}
                  rows={3}
                  placeholder="Renewal owner, reference number, remarks…"
                  className={`${fieldClass} mt-1 resize-none`}
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/compliance/documents')}
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:bg-black/5"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || saved}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
              }}
            >
              {saved ? <CheckCircle2 className="h-4 w-4" /> : saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved' : saving ? 'Saving…' : mode === 'create' ? 'Create document' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
