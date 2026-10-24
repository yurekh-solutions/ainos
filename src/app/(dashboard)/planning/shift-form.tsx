'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CalendarClock, CheckCircle2, Clock, Loader2, MapPin, Save, User } from 'lucide-react';
import RecordHistory from '@/components/audit/RecordHistory';

export const SHIFT_STATUSES = [
  { id: 'planned', label: 'Planned' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'done', label: 'Completed' },
  { id: 'absent', label: 'No show' },
  { id: 'cancelled', label: 'Cancelled' },
];

export interface ShiftFormValues {
  id?: string;
  employeeName: string;
  role: string;
  startAt: string;
  endAt: string;
  location: string;
  status: string;
  notes: string;
}

function toLocalInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultShiftRange(): { startAt: string; endAt: string } {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(9);
  if (start.getTime() < Date.now()) start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setHours(start.getHours() + 8);
  return { startAt: toLocalInput(start.toISOString()), endAt: toLocalInput(end.toISOString()) };
}

export const emptyShift: ShiftFormValues = {
  employeeName: '',
  role: '',
  startAt: '',
  endAt: '',
  location: '',
  status: 'planned',
  notes: '',
};

export function shiftFromRecord(record: {
  id: string;
  employeeName?: string | null;
  role?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  location?: string | null;
  status?: string | null;
  notes?: string | null;
}): ShiftFormValues {
  return {
    id: record.id,
    employeeName: record.employeeName || '',
    role: record.role || '',
    startAt: toLocalInput(record.startAt),
    endAt: toLocalInput(record.endAt),
    location: record.location || '',
    status: record.status || 'planned',
    notes: record.notes || '',
  };
}

export function shiftHours(startAt: string, endAt: string): number {
  if (!startAt || !endAt) return 0;
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.round(((end - start) / 3600000) * 100) / 100;
}

const labelClass = 'text-xs font-semibold uppercase tracking-wide';
const fieldClass = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';

export default function ShiftForm({ mode, initial }: { mode: 'create' | 'edit'; initial: ShiftFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<ShiftFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof ShiftFormValues>(key: K, value: ShiftFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const duration = shiftHours(form.startAt, form.endAt);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.employeeName.trim()) {
      setError('Choose who is working this shift.');
      return;
    }
    if (!form.startAt || !form.endAt) {
      setError('Set both the start and end time.');
      return;
    }
    if (new Date(form.endAt).getTime() <= new Date(form.startAt).getTime()) {
      setError('The shift end must be after the start.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/planning', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          employeeName: form.employeeName.trim(),
          role: form.role.trim(),
          startAt: form.startAt,
          endAt: form.endAt,
          location: form.location.trim(),
          status: form.status,
          notes: form.notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this shift');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/planning');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this shift');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/planning')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to planning"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'New shift' : 'Edit shift'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Schedule employees, track hours and confirm attendance
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <User className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Who is working
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Employee *
                </span>
                <input
                  value={form.employeeName}
                  onChange={(event) => set('employeeName', event.target.value)}
                  placeholder="Imran Sheikh"
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Role
                </span>
                <input
                  value={form.role}
                  onChange={(event) => set('role', event.target.value)}
                  placeholder="Field technician"
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Location
                </span>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input
                    value={form.location}
                    onChange={(event) => set('location', event.target.value)}
                    placeholder="Andheri service centre"
                    className={`${fieldClass} mt-1 pl-9`}
                  />
                </div>
              </label>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Timing
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Starts *
                </span>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(event) => set('startAt', event.target.value)}
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Ends *
                </span>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(event) => set('endAt', event.target.value)}
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(event) => set('status', event.target.value)}
                  className={`${fieldClass} mt-1`}
                >
                  {SHIFT_STATUSES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'hsl(var(--muted) / 0.4, rgba(0,0,0,0.03))', color: 'hsl(var(--muted-foreground))' }}
              >
                <Clock className="h-4 w-4" />
                Duration
                <strong className="ml-auto" style={{ color: 'hsl(var(--foreground))' }}>
                  {duration ? `${duration} h` : '—'}
                </strong>
              </div>
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Notes
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) => set('notes', event.target.value)}
                  rows={3}
                  placeholder="Site instructions, buddy pairing, tools to carry…"
                  className={`${fieldClass} mt-1 resize-none`}
                />
              </label>
            </div>
          </div>

          <RecordHistory entity="shift" entityId={form.id} />

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/planning')}
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
              {saved ? 'Saved' : saving ? 'Saving…' : mode === 'create' ? 'Create shift' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
