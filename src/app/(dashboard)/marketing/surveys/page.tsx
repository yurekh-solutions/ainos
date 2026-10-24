'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardList, Link2, Loader2, MessageSquare, Pencil, Plus, Search, Star, Trash2, Users } from 'lucide-react';

interface SurveyRow {
  id: string;
  title: string;
  description?: string | null;
  audience?: string | null;
  status: string;
  questionCount: number;
  responseCount: number;
  average: number | null;
}

interface Summary {
  live: number;
  drafts: number;
  totalResponses: number;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
  live: { label: 'Live', className: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Closed', className: 'bg-amber-100 text-amber-700' },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'live', label: 'Live' },
  { id: 'closed', label: 'Closed' },
];

export default function SurveysPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ live: 0, drafts: 0, totalResponses: 0 });
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
      const res = await fetch(`/api/surveys?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not load surveys');
      setRows(data.surveys || []);
      setSummary(data.summary || { live: 0, drafts: 0, totalResponses: 0 });
      setCanManage(Boolean(data.canManage));
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not load surveys');
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
      const res = await fetch(`/api/surveys?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete this survey');
      setToast('Survey deleted');
      setConfirmId('');
      await load();
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not delete this survey');
    } finally {
      setBusyId('');
    }
  };

  const copyPublicLink = async (id: string) => {
    const url = `${window.location.origin}/s/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast('Public link copied');
    } catch {
      setToast(url);
    }
  };

  const kpis = [
    { label: 'Live surveys', value: summary.live, icon: ClipboardList, tone: 'text-emerald-600' },
    { label: 'Drafts', value: summary.drafts, icon: Pencil, tone: 'text-slate-600' },
    { label: 'Responses collected', value: summary.totalResponses, icon: MessageSquare, tone: 'text-violet-600' },
    { label: 'Surveys total', value: rows.length, icon: Users, tone: 'text-sky-600' },
  ];

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-5 pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              Surveys
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Feedback forms with scored questions and a response log
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/marketing/surveys/new')}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
              boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
            }}
          >
            <Plus className="h-4 w-4" />
            New survey
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
              placeholder="Search surveys"
              className="glass-input w-full rounded-xl py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading surveys…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <ClipboardList className="mx-auto h-8 w-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p className="mt-3 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              No surveys yet
            </p>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Build a questionnaire, mark it live and start collecting responses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => {
              const meta = STATUS_META[row.status] || { label: row.status, className: 'bg-slate-100 text-slate-700' };
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
                      <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {row.description || 'No description'}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <span className="rounded-md px-2 py-0.5" style={{ border: '1px solid hsl(var(--border) / 0.7)' }}>
                      {row.questionCount} questions
                    </span>
                    <span className="rounded-md px-2 py-0.5" style={{ border: '1px solid hsl(var(--border) / 0.7)' }}>
                      {row.responseCount} responses
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5" style={{ border: '1px solid hsl(var(--border) / 0.7)' }}>
                      <Star className="h-3 w-3" />
                      {row.average === null ? '—' : `${row.average} / 5`}
                    </span>
                    {row.audience && (
                      <span className="rounded-md px-2 py-0.5 capitalize" style={{ border: '1px solid hsl(var(--border) / 0.7)' }}>
                        {row.audience}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/marketing/surveys/${row.id}/respond`)}
                      disabled={row.status !== 'live'}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                      style={{ background: 'hsl(var(--primary))' }}
                    >
                      Collect response
                    </button>
                    <button
                      type="button"
                      onClick={() => copyPublicLink(row.id)}
                      disabled={row.status !== 'live'}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-40"
                      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      title={row.status === 'live' ? 'Copy the shareable survey link' : 'Set the survey live to share it'}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/marketing/surveys/${row.id}/edit`)}
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
                          aria-label="Delete survey"
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
