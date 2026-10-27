'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CalendarClock, CheckCircle2, Download, FileText, FolderOpen, Loader2, Pencil, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react';

interface DocumentRow {
  id: string;
  name: string;
  type: string | null;
  url: string | null;
  category: string | null;
  notes: string | null;
  expiryDate: string | null;
  daysToExpiry: number | null;
  verificationStatus: string | null;
  createdAt: string;
}

interface Summary {
  total: number;
  addedThisMonth: number;
  expiringSoon: number;
  expired: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  contract: 'Contract',
  license: 'License',
  certificate: 'Certificate',
  policy: 'Policy',
  other: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  resubmit: 'bg-sky-50 text-sky-700 border-sky-200',
};

function day(value: string | null): string {
  if (!value) return 'No expiry';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function expiryTone(days: number | null): string {
  if (days === null) return 'text-slate-500';
  if (days < 0) return 'text-rose-600 font-semibold';
  if (days <= 30) return 'text-amber-600 font-semibold';
  return 'text-slate-500';
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search.trim()) params.set('q', search.trim());

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not load documents');
      }
      const data = await res.json();
      setDocuments(data.documents || []);
      setSummary(data.summary || null);
      setCanManage(Boolean(data.canManage));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load documents');
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      setToast('Document deleted');
      setDeletingId('');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <div className="mx-auto max-w-7xl space-y-5 pb-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              Documents
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Contracts, licences, certificates and policies with expiry tracking
            </p>
          </div>
          <Link
            href="/compliance/documents/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
            }}
          >
            <Plus className="h-4 w-4" />
            Add document
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Total documents',
              value: summary ? String(summary.total) : '—',
              hint: 'Stored for this company',
              icon: FolderOpen,
              tint: 'from-violet-500 to-purple-600',
            },
            {
              label: 'Added this month',
              value: summary ? String(summary.addedThisMonth) : '—',
              hint: 'Uploaded or recorded',
              icon: FileText,
              tint: 'from-sky-500 to-blue-600',
            },
            {
              label: 'Expiring in 30 days',
              value: summary ? String(summary.expiringSoon) : '—',
              hint: 'Renew before the deadline',
              icon: CalendarClock,
              tint: 'from-amber-500 to-orange-600',
            },
            {
              label: 'Expired',
              value: summary ? String(summary.expired) : '—',
              hint: 'Needs replacement',
              icon: ShieldAlert,
              tint: 'from-rose-500 to-red-600',
            },
          ].map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative overflow-hidden rounded-2xl p-4 pl-5"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
                border: '1px solid hsl(var(--border) / 0.5)',
                boxShadow: '0 4px 20px -6px rgb(0 0 0 / 0.08)',
              }}
            >
              <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${card.tint}`} />
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {card.label}
                </p>
                <card.icon className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </div>
              <p className="mt-2 text-xl font-bold leading-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
                {card.value}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {card.hint}
              </p>
            </motion.div>
          ))}
        </div>

        <div
          className="rounded-2xl p-4 md:p-5"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1 rounded-xl p-1" style={{ background: 'hsl(var(--muted))' }}>
              {[{ id: 'all', label: 'All' }, ...Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label }))].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    category === tab.id ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative lg:w-72">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search document"
                className="glass-input w-full py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents…
            </div>
          ) : documents.length === 0 ? (
            <div className="py-16 text-center">
              <FolderOpen className="mx-auto mb-3 h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                No documents yet
              </p>
              <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Record a contract or licence to start tracking expiry dates.
              </p>
              <Link
                href="/compliance/documents/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Add document
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead>
                    <tr
                      className="border-b text-xs uppercase tracking-wide"
                      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                    >
                      <th className="pb-3 pr-3 font-semibold">Document</th>
                      <th className="pb-3 pr-3 font-semibold">Category</th>
                      <th className="pb-3 pr-3 font-semibold">Expiry</th>
                      <th className="pb-3 pr-3 font-semibold">Verification</th>
                      <th className="pb-3 pr-3 font-semibold">Added</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b last:border-0" style={{ borderColor: 'hsl(var(--border) / 0.6)' }}>
                        <td className="py-3 pr-3">
                          <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {doc.name}
                          </p>
                          {doc.notes && (
                            <p className="max-w-[280px] truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {doc.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          {CATEGORY_LABELS[doc.category || 'other'] || 'Other'}
                        </td>
                        <td className={`py-3 pr-3 text-sm ${expiryTone(doc.daysToExpiry)}`}>
                          {day(doc.expiryDate)}
                          {doc.daysToExpiry !== null && (
                            <span className="ml-1 text-xs">
                              ({doc.daysToExpiry < 0 ? `${Math.abs(doc.daysToExpiry)}d overdue` : `${doc.daysToExpiry}d left`})
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              STATUS_STYLES[doc.verificationStatus || 'pending'] || STATUS_STYLES.pending
                            }`}
                          >
                            {(doc.verificationStatus || 'pending').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {day(doc.createdAt)}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {doc.url && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                              >
                                <Download className="h-3.5 w-3.5" />
                                Open
                              </a>
                            )}
                            <Link
                              href={`/compliance/documents/${doc.id}/edit`}
                              className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Link>
                            {deletingId === doc.id ? (
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <button
                                  type="button"
                                  disabled={busyId === doc.id}
                                  onClick={() => remove(doc.id)}
                                  className="rounded-lg bg-rose-600 px-2 py-1.5 font-semibold text-white disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId('')}
                                  className="rounded-lg border px-2 py-1.5 font-semibold"
                                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                >
                                  No
                                </button>
                              </span>
                            ) : (
                              canManage && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(doc.id)}
                                  className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                                  aria-label="Delete document"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 lg:hidden">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-xl p-3.5"
                    style={{ border: '1px solid hsl(var(--border) / 0.7)', background: 'hsl(var(--card))' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {doc.name}
                        </p>
                        <p className="truncate text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {CATEGORY_LABELS[doc.category || 'other'] || 'Other'} · {day(doc.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          STATUS_STYLES[doc.verificationStatus || 'pending'] || STATUS_STYLES.pending
                        }`}
                      >
                        {(doc.verificationStatus || 'pending').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className={`mt-2 text-xs ${expiryTone(doc.daysToExpiry)}`}>
                      {doc.expiryDate ? `Expires ${day(doc.expiryDate)}` : 'No expiry date'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold"
                          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Open
                        </a>
                      )}
                      <Link
                        href={`/compliance/documents/${doc.id}/edit`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold"
                        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setDeletingId(doc.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-2.5 py-2 text-rose-600"
                          aria-label="Delete document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {deletingId === doc.id && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                        <span className="flex-1">Delete this document?</span>
                        <button
                          type="button"
                          disabled={busyId === doc.id}
                          onClick={() => remove(doc.id)}
                          className="rounded-md bg-rose-600 px-2 py-1 font-semibold text-white disabled:opacity-50"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId('')}
                          className="rounded-md border border-rose-200 px-2 py-1 font-semibold"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
