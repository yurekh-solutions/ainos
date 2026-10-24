'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, IndianRupee, Loader2, MapPin, Save, Ticket } from 'lucide-react';
import RecordHistory from '@/components/audit/RecordHistory';

export const EVENT_STATUSES = [
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'closed', label: 'Closed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const EVENT_CATEGORIES = [
  { id: 'conference', label: 'Conference' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'webinar', label: 'Webinar' },
  { id: 'training', label: 'Training' },
  { id: 'meetup', label: 'Meetup' },
  { id: 'other', label: 'Other' },
];

export interface EventFormValues {
  id?: string;
  title: string;
  category: string;
  startAt: string;
  endAt: string;
  location: string;
  capacity: string;
  ticketPrice: string;
  status: string;
  description: string;
}

function toLocalInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultEventRange(): { startAt: string; endAt: string } {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setDate(start.getDate() + 7);
  start.setHours(10);
  const end = new Date(start);
  end.setHours(start.getHours() + 2);
  return { startAt: toLocalInput(start.toISOString()), endAt: toLocalInput(end.toISOString()) };
}

export const emptyEvent: EventFormValues = {
  title: '',
  category: 'conference',
  startAt: '',
  endAt: '',
  location: '',
  capacity: '0',
  ticketPrice: '0',
  status: 'draft',
  description: '',
};

export function eventFromRecord(record: {
  id: string;
  title?: string | null;
  category?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  location?: string | null;
  capacity?: number | null;
  ticketPrice?: number | null;
  status?: string | null;
  description?: string | null;
}): EventFormValues {
  return {
    id: record.id,
    title: record.title || '',
    category: record.category || 'other',
    startAt: toLocalInput(record.startAt),
    endAt: toLocalInput(record.endAt),
    location: record.location || '',
    capacity: String(record.capacity ?? 0),
    ticketPrice: String(record.ticketPrice ?? 0),
    status: record.status || 'draft',
    description: record.description || '',
  };
}

const labelClass = 'text-xs font-semibold uppercase tracking-wide';
const fieldClass = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';

export default function EventForm({ mode, initial }: { mode: 'create' | 'edit'; initial: EventFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<EventFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const potential = (Number(form.capacity) || 0) * (Number(form.ticketPrice) || 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Give the event a title.');
      return;
    }
    if (!form.startAt) {
      setError('Pick when the event starts.');
      return;
    }
    if (form.endAt && new Date(form.endAt).getTime() <= new Date(form.startAt).getTime()) {
      setError('The end time must be after the start.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/events', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          title: form.title.trim(),
          category: form.category,
          startAt: form.startAt,
          endAt: form.endAt || null,
          location: form.location.trim(),
          capacity: Number(form.capacity) || 0,
          ticketPrice: Number(form.ticketPrice) || 0,
          status: form.status,
          description: form.description.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this event');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/marketing/events');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this event');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/marketing/events')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to events"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'New event' : `Edit ${form.title || 'event'}`}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Publish the event, sell seats and manage the attendee list
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Ticket className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Event
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Title *
                </span>
                <input
                  value={form.title}
                  onChange={(event) => set('title', event.target.value)}
                  placeholder="AINOS Partner Summit 2027"
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
                  {EVENT_CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
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
                  {EVENT_STATUSES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
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
                    placeholder="Grand Hyatt, Mumbai or online"
                    className={`${fieldClass} mt-1 pl-9`}
                  />
                </div>
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Description
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                  rows={3}
                  placeholder="Agenda, speakers, who should attend…"
                  className={`${fieldClass} mt-1 resize-none`}
                />
              </label>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Schedule and tickets
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
                  Ends
                </span>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(event) => set('endAt', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Capacity (0 = unlimited)
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.capacity}
                  onChange={(event) => set('capacity', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Ticket price (₹)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.ticketPrice}
                  onChange={(event) => set('ticketPrice', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
            </div>
          </div>

          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)', color: 'hsl(var(--muted-foreground))' }}
          >
            <IndianRupee className="h-4 w-4" />
            <span>
              Full-house value:{' '}
              <strong style={{ color: 'hsl(var(--foreground))' }}>
                ₹{potential.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </strong>
            </span>
          </div>

          <RecordHistory entity="event" entityId={form.id} />

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/marketing/events')}
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
              {saved ? 'Saved' : saving ? 'Saving…' : mode === 'create' ? 'Create event' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
