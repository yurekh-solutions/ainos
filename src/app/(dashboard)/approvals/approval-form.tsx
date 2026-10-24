'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckSquare, IndianRupee, Loader2, Save, UserCheck } from 'lucide-react';
import RecordHistory from '@/components/audit/RecordHistory';

export const APPROVAL_CATEGORIES = [
  { id: 'purchase', label: 'Purchase' },
  { id: 'expense', label: 'Expense' },
  { id: 'leave', label: 'Leave' },
  { id: 'budget', label: 'Budget' },
  { id: 'other', label: 'Other' },
];

export const APPROVAL_STATUSES = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'refused', label: 'Refused' },
  { id: 'cancelled', label: 'Cancelled' },
];

export interface ApprovalFormValues {
  id?: string;
  title: string;
  category: string;
  amount: string;
  requesterName: string;
  approverName: string;
  status: string;
  description: string;
  decisionNote: string;
}

export const emptyApproval: ApprovalFormValues = {
  title: '',
  category: 'purchase',
  amount: '0',
  requesterName: '',
  approverName: '',
  status: 'pending',
  description: '',
  decisionNote: '',
};

export function approvalFromRecord(record: {
  id: string;
  title?: string | null;
  category?: string | null;
  amount?: number | null;
  requesterName?: string | null;
  approverName?: string | null;
  status?: string | null;
  description?: string | null;
  decisionNote?: string | null;
}): ApprovalFormValues {
  return {
    id: record.id,
    title: record.title || '',
    category: record.category || 'other',
    amount: String(record.amount ?? 0),
    requesterName: record.requesterName || '',
    approverName: record.approverName || '',
    status: record.status || 'pending',
    description: record.description || '',
    decisionNote: record.decisionNote || '',
  };
}

const labelClass = 'text-xs font-semibold uppercase tracking-wide';
const fieldClass = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';

export default function ApprovalForm({ mode, initial }: { mode: 'create' | 'edit'; initial: ApprovalFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<ApprovalFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof ApprovalFormValues>(key: K, value: ApprovalFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Describe what needs approval.');
      return;
    }
    if (!form.requesterName.trim()) {
      setError('Add who is requesting this approval.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/approvals', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          title: form.title.trim(),
          category: form.category,
          amount: Number(form.amount) || 0,
          requesterName: form.requesterName.trim(),
          approverName: form.approverName.trim(),
          status: form.status,
          description: form.description.trim(),
          decisionNote: form.decisionNote.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this approval request');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/approvals');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this approval request');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/approvals')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to approvals"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'New approval request' : 'Edit approval request'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Route purchases, expenses and leave through an approver
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Request
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
                  placeholder="New laptops for the design team"
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
                  {APPROVAL_CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Amount (₹)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => set('amount', event.target.value)}
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Requested by *
                </span>
                <input
                  value={form.requesterName}
                  onChange={(event) => set('requesterName', event.target.value)}
                  placeholder="Priya Nair"
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Approver
                </span>
                <input
                  value={form.approverName}
                  onChange={(event) => set('approverName', event.target.value)}
                  placeholder="Finance head"
                  className={`${fieldClass} mt-1`}
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
                  {APPROVAL_STATUSES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Justification
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                  rows={3}
                  placeholder="Why this spend is needed, quotes attached, urgency…"
                  className={`${fieldClass} mt-1 resize-none`}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Decision note
                </span>
                <textarea
                  value={form.decisionNote}
                  onChange={(event) => set('decisionNote', event.target.value)}
                  rows={2}
                  placeholder="Approver remarks"
                  className={`${fieldClass} mt-1 resize-none`}
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
              Approval amount:{' '}
              <strong style={{ color: 'hsl(var(--foreground))' }}>
                ₹{(Number(form.amount) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </strong>
            </span>
            <UserCheck className="ml-auto h-4 w-4" />
            <span>{form.approverName.trim() || 'Unassigned'}</span>
          </div>

          <RecordHistory entity="approval" entityId={form.id} />

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/approvals')}
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
              {saved ? <CheckSquare className="h-4 w-4" /> : saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved' : saving ? 'Saving…' : mode === 'create' ? 'Submit request' : 'Save changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
