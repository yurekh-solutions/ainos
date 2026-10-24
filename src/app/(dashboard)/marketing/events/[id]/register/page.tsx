'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Plus, Ticket, UserX } from 'lucide-react';

interface Registration {
  id: string;
  attendeeName: string;
  attendeeEmail?: string | null;
  seats: number;
  amount: number;
  status: string;
  registeredAt: string;
}

interface EventDetail {
  id: string;
  title: string;
  status: string;
  startAt: string;
  location?: string | null;
  capacity: number;
  ticketPrice: number;
  registrations: Registration[];
}

const labelClass = 'text-xs font-semibold uppercase tracking-wide';
const fieldClass = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';

const money = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function EventRegistrationsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');

  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [seats, setSeats] = useState('1');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/events?id=${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not load this event');
      setEvent(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this event');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const confirmed = (event?.registrations || []).filter((row) => row.status === 'confirmed');
  const seatsSold = confirmed.reduce((sum, row) => sum + row.seats, 0);
  const revenue = confirmed.reduce((sum, row) => sum + row.amount, 0);
  const capacityLeft = event && event.capacity > 0 ? Math.max(0, event.capacity - seatsSold) : null;

  const addAttendee = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setError('');

    if (!attendeeName.trim()) {
      setError('Attendee name is required.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/events/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          attendeeName: attendeeName.trim(),
          attendeeEmail: attendeeEmail.trim(),
          seats: Number(seats) || 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not register this attendee');
      setAttendeeName('');
      setAttendeeEmail('');
      setSeats('1');
      setToast('Attendee registered');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register this attendee');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (registration: Registration, status: 'confirmed' | 'cancelled') => {
    setBusyId(registration.id);
    try {
      const res = await fetch('/api/events/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: registration.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update this registration');
      setToast(status === 'cancelled' ? 'Registration cancelled' : 'Registration restored');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not update this registration');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (registration: Registration) => {
    setBusyId(registration.id);
    try {
      const res = await fetch(`/api/events/registrations?id=${registration.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete this registration');
      setToast('Registration deleted');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not delete this registration');
    } finally {
      setBusyId('');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm" style={{ background: 'var(--page-gradient)', color: 'hsl(var(--muted-foreground))' }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading event…
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-full items-center justify-center p-6" style={{ background: 'var(--page-gradient)' }}>
        <div className="max-w-md rounded-2xl p-6 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <AlertCircle className="mx-auto h-6 w-6" style={{ color: 'hsl(var(--error))' }} />
          <p className="mt-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            {error || 'Event not found'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/marketing/events')}
            className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'hsl(var(--primary))' }}
          >
            Back to events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <div className="mx-auto max-w-5xl space-y-5 pb-24">
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
              {event.title}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {new Date(event.startAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {event.location ? ` · ${event.location}` : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Seats sold', value: seatsSold },
            { label: 'Seats left', value: capacityLeft === null ? '∞' : capacityLeft },
            { label: 'Ticket price', value: money(event.ticketPrice) },
            { label: 'Revenue', value: money(revenue) },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {item.label}
              </p>
              <p className="mt-1 text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {event.status !== 'published' && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)', color: 'hsl(var(--muted-foreground))' }}>
            This event is <strong style={{ color: 'hsl(var(--foreground))' }}>{event.status}</strong>. Publish it from the editor to accept new
            registrations.
          </div>
        )}

        <form
          onSubmit={addAttendee}
          className="rounded-2xl p-4 md:p-5"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Register an attendee
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <label className="sm:col-span-2">
              <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                Name *
              </span>
              <input
                value={attendeeName}
                onChange={(input) => setAttendeeName(input.target.value)}
                placeholder="Meera Sharma"
                className={`${fieldClass} mt-1`}
                required
              />
            </label>
            <label>
              <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                Email
              </span>
              <input
                value={attendeeEmail}
                onChange={(input) => setAttendeeEmail(input.target.value)}
                placeholder="meera@email.com"
                className={`${fieldClass} mt-1`}
              />
            </label>
            <label>
              <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                Seats
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={seats}
                onChange={(input) => setSeats(input.target.value)}
                className={`${fieldClass} mt-1`}
              />
            </label>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving || event.status !== 'published'}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
              }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
              {saving ? 'Registering…' : 'Register attendee'}
            </button>
          </div>
        </form>

        <div className="rounded-2xl p-4 md:p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Registrations ({event.registrations.length})
          </h2>

          {event.registrations.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No attendees yet.
            </p>
          ) : (
            <div className="space-y-2">
              {event.registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between"
                  style={{ border: '1px solid hsl(var(--border) / 0.7)' }}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      {registration.attendeeName}
                    </p>
                    <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {registration.attendeeEmail || 'No email'} · {registration.seats} seat(s) · {money(registration.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        registration.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {registration.status}
                    </span>
                    {registration.status === 'confirmed' ? (
                      <button
                        type="button"
                        onClick={() => setStatus(registration, 'cancelled')}
                        disabled={busyId === registration.id}
                        className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold disabled:opacity-50"
                        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      >
                        <UserX className="h-3 w-3" />
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setStatus(registration, 'confirmed')}
                        disabled={busyId === registration.id}
                        className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold disabled:opacity-50"
                        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Restore
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(registration)}
                      disabled={busyId === registration.id}
                      className="rounded-lg border px-2 py-1 text-xs font-semibold disabled:opacity-50"
                      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--error))' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg" style={{ background: 'hsl(var(--foreground))' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
