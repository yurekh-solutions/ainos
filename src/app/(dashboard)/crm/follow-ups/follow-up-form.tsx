'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Save } from 'lucide-react';

export const FOLLOW_UP_TYPES = [
  { id: 'call', label: 'Phone call' },
  { id: 'email', label: 'Email' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'visit', label: 'On-site visit' },
];

export const FOLLOW_UP_STATUSES = [
  { id: 'pending', label: 'Pending' },
  { id: 'done', label: 'Done' },
  { id: 'missed', label: 'Missed' },
];

export interface FollowUpFormValues {
  id?: string;
  contactName: string;
  type: string;
  status: string;
  dueDate: string;
  notes: string;
}

export const emptyFollowUp: FollowUpFormValues = {
  contactName: '',
  type: 'call',
  status: 'pending',
  dueDate: '',
  notes: '',
};

const fieldClass = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';
const labelClass = 'text-xs font-semibold uppercase tracking-wide';

export function followUpFromRecord(record: {
  id: string;
  contactName?: string | null;
  type?: string | null;
  status?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}): FollowUpFormValues {
  const due = record.dueDate ? new Date(record.dueDate) : null;
  return {
    id: record.id,
    contactName: record.contactName || '',
    type: record.type || 'call',
    status: record.status || 'pending',
    dueDate: due && !Number.isNaN(due.getTime()) ? due.toISOString().slice(0, 10) : '',
    notes: record.notes || '',
  };
}

export default function FollowUpForm({ mode, initial }: { mode: 'create' | 'edit'; initial: FollowUpFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<FollowUpFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof FollowUpFormValues>(key: K, value: FollowUpFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.contactName.trim()) {
      setError('Who should we follow up with?');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: form.id,
        contactName: form.contactName.trim(),
        type: form.type,
        status: form.status,
        dueDate: form.dueDate || null,
        notes: form.notes.trim(),
      };

      const res = await fetch('/api/follow-ups', {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this follow-up');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/crm/follow-ups');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this follow-up');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/crm/follow-ups')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to follow-ups"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'Schedule follow-up' : 'Edit follow-up'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Keep every lead and customer touchpoint on the calendar
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl p-4 md:p-5"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                Contact *
              </span>
              <input
                value={form.contactName}
                onChange={(event) => set('contactName', event.target.value)}
                placeholder="Name or company"
                className={`${fieldClass} mt-1`}
                required
              />
            </label>

            <label>
              <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                Channel
              </span>
              <select value={form.type} onChange={(event) => set('type', event.target.value)} className={`${fieldClass} mt-1`}>
                {FOLLOW_UP_TYPES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                Status
              </span>
              <select value={form.status} onChange={(event) => set('status', event.target.value)} className={`${fieldClass} mt-1`}>
                {FOLLOW_UP_STATUSES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                Due date
              </span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => set('dueDate', event.target.value)}
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
                rows={4}
                placeholder="What needs to be discussed?"
                className={`${fieldClass} mt-1 resize-none`}
              />
            </label>
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
              onClick={() => router.push('/crm/follow-ups')}
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
              {saved ? 'Saved' : saving ? 'Saving…' : mode === 'create' ? 'Schedule' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
