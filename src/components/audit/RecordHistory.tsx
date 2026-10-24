'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, History, Loader2 } from 'lucide-react';

export type AuditEntity = 'rental' | 'approval' | 'shift' | 'survey' | 'event' | 'registration';

interface AuditEntry {
  id: string;
  action: string;
  actorEmail?: string | null;
  summary?: string | null;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  status_changed: 'Status changed',
  deleted: 'Deleted',
  approved: 'Approved',
  refused: 'Refused',
  returned: 'Returned',
  handover: 'Handed over',
  cancelled: 'Cancelled',
  response_received: 'Response received',
  response_deleted: 'Response deleted',
  registered: 'Registered',
  booking: 'Booked',
};

const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'empty';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'string' && ISO_LIKE.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    }
  }
  return String(value);
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] || action.replace(/_/g, ' ');
}

/**
 * Read-only timeline for one record. Loaded on demand so list-to-edit
 * navigation does not pay for a query nobody looked at.
 */
export default function RecordHistory({ entity, entityId }: { entity: AuditEntity; entityId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/audit?entity=${entity}&entityId=${encodeURIComponent(entityId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not load history');
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load history');
    } finally {
      setLoading(false);
    }
  }, [entity, entityId]);

  useEffect(() => {
    if (!open || entries !== null) return;
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [open, entries, load]);

  if (!entityId) return null;

  return (
    <div
      className="rounded-2xl p-4 md:p-5"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <History className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          History
        </h2>
        {entries && entries.length > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'hsl(var(--muted) / 0.6)', color: 'hsl(var(--muted-foreground))' }}
          >
            {entries.length}
          </span>
        )}
        <ChevronDown
          className={`ml-auto h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'hsl(var(--muted-foreground))' }}
        />
      </button>

      {open && (
        <div className="mt-4">
          {loading && (
            <p className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading history…
            </p>
          )}

          {!loading && error && (
            <p className="flex items-start gap-2 text-sm" style={{ color: 'hsl(var(--error))' }}>
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}

          {!loading && !error && entries && entries.length === 0 && (
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No changes recorded yet.
            </p>
          )}

          {!loading && !error && entries && entries.length > 0 && (
            <ol className="space-y-4">
              {entries.map((entry) => {
                const changes = entry.changes ? Object.entries(entry.changes) : [];
                return (
                  <li key={entry.id} className="relative border-l pl-4" style={{ borderColor: 'hsl(var(--border))' }}>
                    <span
                      className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full"
                      style={{ background: 'hsl(var(--primary))' }}
                    />
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p className="text-sm font-semibold capitalize" style={{ color: 'hsl(var(--foreground))' }}>
                        {actionLabel(entry.action)}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(entry.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {entry.actorEmail ? ` · ${entry.actorEmail}` : ''}
                      </p>
                    </div>

                    {entry.summary && (
                      <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {entry.summary}
                      </p>
                    )}

                    {changes.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {changes.map(([field, delta]) => (
                          <li key={field} className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                              {field}
                            </span>{' '}
                            {formatValue(delta?.from)} → {formatValue(delta?.to)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
