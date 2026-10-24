'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import EventForm, { EventFormValues, eventFromRecord } from '../../event-form';

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [initial, setInitial] = useState<EventFormValues | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      try {
        const res = await fetch(`/api/events?id=${id}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not load this event');
        if (active) setInitial(eventFromRecord(data.event));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load this event');
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6" style={{ background: 'var(--page-gradient)' }}>
        <div className="max-w-md rounded-2xl p-6 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <AlertCircle className="mx-auto h-6 w-6" style={{ color: 'hsl(var(--error))' }} />
          <p className="mt-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            {error}
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

  if (!initial) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm" style={{ background: 'var(--page-gradient)', color: 'hsl(var(--muted-foreground))' }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading event…
      </div>
    );
  }

  return <EventForm mode="edit" initial={initial} />;
}
