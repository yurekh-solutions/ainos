'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalendarDays, IndianRupee, Link2, Loader2, MapPin, Pencil, Plus, Search, Ticket, Trash2, Users } from 'lucide-react';

interface EventRow {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  capacity: number;
  ticketPrice: number;
  status: string;
  seatsSold: number;
  revenue: number;
}

interface Summary {
  upcoming: number;
  published: number;
  seatsSold: number;
  revenueMonth: number;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
  published: { label: 'Published', className: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Closed', className: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-100 text-rose-700' },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'closed', label: 'Closed' },
];

const money = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const when = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function EventsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<EventRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ upcoming: 0, published: 0, seatsSold: 0, revenueMonth: 0 });
  const [canManage, setCanManage] = useState(false);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [confirmId, setConfirmId] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('status', tab);
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not load events');
      setRows(data.events || []);
      setSummary(data.summary || { upcoming: 0, published: 0, seatsSold: 0, revenueMonth: 0 });
      setCanManage(Boolean(data.canManage));
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not load events');
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete this event');
      setToast('Event deleted');
      setConfirmId('');
      await load();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not delete this event');
    } finally {
      setBusyId('');
    }
  };

  const copyPublicLink = async (id: string) => {
    const url = `${window.location.origin}/e/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast('Public registration link copied');
    } catch {
      setToast(url);
    }
  };

  const kpis = [
    { label: 'Upcoming events', value: summary.upcoming, icon: CalendarDays, tone: 'text-violet-600' },
    { label: 'Published', value: summary.published, icon: Ticket, tone: 'text-sky-600' },
    { label: 'Seats sold', value: summary.seatsSold, icon: Users, tone: 'text-emerald-600' },
    { label: 'Revenue this month', value: money(summary.revenueMonth), icon: IndianRupee, tone: 'text-amber-600' },
  ];

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-5 pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              Events
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Conferences, workshops and webinars with ticketing and capacity control
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/marketing/events/new')}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
            }}
          >
            <Plus className="h-4 w-4" />
            New event
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-2xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {kpi.label}
                </p>
                <kpi.icon className={`h-4 w-4 ${kpi.tone}`} />
              </div>
              <p className="mt-2 text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center lg:justify-between" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setLoading(true);
                  setTab(item.id);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === item.id ? 'text-white' : 'hover:bg-black/5'}`}
                style={
                  tab === item.id
                    ? { background: 'hsl(var(--primary))' }
                    : { color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border) / 0.6)' }
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input
              value={search}
              onChange={(event) => {
                setLoading(true);
                setSearch(event.target.value);
              }}
              placeholder="Search events or venues"
              className="glass-input w-full rounded-xl py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading events…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <CalendarDays className="mx-auto h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p className="mt-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              No events yet
            </p>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Create an event, publish it and start registering attendees.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => {
              const meta = STATUS_META[row.status] || { label: row.status, className: 'bg-slate-100 text-slate-700' };
              const fill = row.capacity > 0 ? Math.min(100, Math.round((row.seatsSold / row.capacity) * 100)) : 0;
              return (
                <div
                  key={row.id}
                  className="flex flex-col rounded-2xl p-4"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        {row.title}
                      </p>
                      <p className="mt-0.5 text-xs capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {row.category}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                  </div>

                  <p className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <CalendarDays className="h-3 w-3" />
                    {when(row.startAt)}
                  </p>
                  {row.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <MapPin className="h-3 w-3" />
                      {row.location}
                    </p>
                  )}

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span>
                        {row.seatsSold} / {row.capacity > 0 ? row.capacity : '∞'} seats
                      </span>
                      <span>{money(row.revenue)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'hsl(var(--border) / 0.5)' }}>
                      <div className="h-full rounded-full" style={{ width: `${fill}%`, background: 'hsl(var(--primary))' }} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/marketing/events/${row.id}/register`)}
                      disabled={row.status !== 'published'}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                      style={{ background: 'hsl(var(--primary))' }}
                    >
                      Registrations
                    </button>
                    <button
                      type="button"
                      onClick={() => copyPublicLink(row.id)}
                      disabled={row.status !== 'published'}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-40"
                      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      title={row.status === 'published' ? 'Copy the shareable registration link' : 'Publish the event to share it'}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/marketing/events/${row.id}/edit`)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    >
                      Edit
                    </button>
                    {canManage &&
                      (confirmId === row.id ? (
                        <span className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => remove(row.id)}
                            disabled={busyId === row.id}
                            className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId('')}
                            className="rounded-lg border px-2 py-1 text-xs font-semibold"
                            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(row.id)}
                          className="ml-auto rounded-lg p-1.5 transition hover:bg-rose-50"
                          style={{ color: 'hsl(var(--error))' }}
                          aria-label="Delete event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg" style={{ background: 'hsl(var(--foreground))' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
