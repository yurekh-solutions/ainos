'use client';

import { use, useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Loader2, MapPin, Ticket } from 'lucide-react';

interface PublicEvent {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  capacity: number;
  ticketPrice: number;
}

const labelClass = 'text-xs font-semibold uppercase tracking-wide';

const money = (value: number) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const when = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null);
  const [form, setForm] = useState({ attendeeName: '', attendeeEmail: '', seats: '1' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState<{ seats: number; amount: number; attendeeName: string } | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch(`/api/public/events/${id}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'This event is not open for registration');
        if (active) {
          setEvent(data.event);
          setSeatsLeft(typeof data.seatsLeft === 'number' ? data.seatsLeft : null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'This event is not open for registration');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  const submit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setError('');

    if (!form.attendeeName.trim()) {
      setError('Please enter your name');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/public/events/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeName: form.attendeeName.trim(),
          attendeeEmail: form.attendeeEmail.trim(),
          seats: Number(form.seats) || 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not complete this booking');
      setBooked(data.registration);
      setSeatsLeft((current) => (current === null ? current : Math.max(0, current - (data.registration?.seats || 0))));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete this booking');
    } finally {
      setSaving(false);
    }
  };

  const soldOut = seatsLeft === 0;

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'var(--page-gradient, hsl(var(--background)))' }}>
      <div className="mx-auto max-w-xl space-y-5">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading event…
          </div>
        )}

        {!loading && !event && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <AlertCircle className="mx-auto h-7 w-7" style={{ color: 'hsl(var(--error))' }} />
            <p className="mt-3 text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              {error || 'This event is not open for registration'}
            </p>
          </div>
        )}

        {event && booked && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
            <p className="mt-3 text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              You are registered
            </p>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {booked.attendeeName} · {booked.seats} seat(s) for {event.title}
            </p>
            <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--foreground))' }}>
              <p>{when(event.startAt)}</p>
              {event.location && <p className="mt-1">{event.location}</p>}
              <p className="mt-1 font-semibold">Amount due {money(booked.amount)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBooked(null);
                setForm({ attendeeName: '', attendeeEmail: '', seats: '1' });
              }}
              className="mt-5 rounded-xl border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              Book another seat
            </button>
          </div>
        )}

        {event && !booked && (
          <>
            <header className="space-y-2">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
              >
                <Ticket className="h-3.5 w-3.5" />
                {event.category}
              </span>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                {event.title}
              </h1>
              {event.description && (
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {event.description}
                </p>
              )}
            </header>

            <div
              className="space-y-2 rounded-2xl p-4 text-sm"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)', color: 'hsl(var(--foreground))' }}
            >
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                {when(event.startAt)}
              </p>
              {event.location && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  {event.location}
                </p>
              )}
              <p className="flex items-center gap-2">
                <Ticket className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                {event.ticketPrice > 0 ? `${money(event.ticketPrice)} per seat` : 'Free entry'}
                {seatsLeft !== null && <span style={{ color: 'hsl(var(--muted-foreground))' }}>· {seatsLeft} left</span>}
              </p>
            </div>

            {soldOut ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  This event is fully booked
                </p>
              </div>
            ) : (
              <form
                onSubmit={submit}
                className="space-y-3 rounded-2xl p-4 md:p-5"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
              >
                <label className="block">
                  <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Full name
                  </span>
                  <input
                    value={form.attendeeName}
                    onChange={(changeEvent) => setForm((prev) => ({ ...prev, attendeeName: changeEvent.target.value }))}
                    className="glass-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                    required
                  />
                </label>

                <label className="block">
                  <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Email
                  </span>
                  <input
                    type="email"
                    value={form.attendeeEmail}
                    onChange={(changeEvent) => setForm((prev) => ({ ...prev, attendeeEmail: changeEvent.target.value }))}
                    className="glass-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </label>

                <label className="block">
                  <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Seats
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={seatsLeft === null ? 20 : Math.min(20, seatsLeft)}
                    value={form.seats}
                    onChange={(changeEvent) => setForm((prev) => ({ ...prev, seats: changeEvent.target.value }))}
                    className="glass-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </label>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    Total {money((Number(form.seats) || 1) * event.ticketPrice)}
                  </p>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                      boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
                    }}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {saving ? 'Booking…' : 'Confirm registration'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
