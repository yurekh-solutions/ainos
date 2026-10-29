'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Receipt, Save, Sparkles } from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  'Travel',
  'Food',
  'Office Supplies',
  'Software',
  'Marketing',
  'Utilities',
  'Rent',
  'Salary',
  'Maintenance',
  'Transport',
  'Professional Fees',
  'Other',
];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
  { id: 'bank', label: 'Bank transfer' },
  { id: 'cheque', label: 'Cheque' },
  { id: 'credit', label: 'Credit / payable' },
];

export interface ExpenseFormValues {
  id?: string;
  title: string;
  amount: string;
  taxAmount: string;
  category: string;
  vendor: string;
  date: string;
  paymentMethod: string;
  receipt: string;
  description: string;
  status?: string;
  submittedBy?: string | null;
  approvedBy?: string | null;
  rejectionReason?: string | null;
}

export const emptyExpense: ExpenseFormValues = {
  title: '',
  amount: '',
  taxAmount: '',
  category: 'Other',
  vendor: '',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: 'cash',
  receipt: '',
  description: '',
};

export default function ExpenseForm({
  mode,
  initial,
}: {
  mode: 'create' | 'edit';
  initial: ExpenseFormValues;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ExpenseFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [categorizing, setCategorizing] = useState(false);
  const [aiNote, setAiNote] = useState('');

  const aiCategorise = async () => {
    const text = [form.title, form.vendor, form.description].filter(Boolean).join('\n').trim();
    if (!text) { setError('Add a title, vendor or description first so AI can categorise.'); return; }
    setError(''); setAiNote(''); setCategorizing(true);
    try {
      const res = await fetch('/api/finance/ai/categorize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, amount: Number(form.amount) || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI categorise failed');
      setForm((prev) => {
        const base = Number(prev.amount) || 0;
        const suggestedTax = base > 0 ? String(Math.round(base * (data.gstRate || 0))) : prev.taxAmount;
        return { ...prev, category: data.category, taxAmount: (data.gstRate ? suggestedTax : prev.taxAmount) };
      });
      setAiNote(`${data.category} · ${data.gstRate}% GST — ${data.reason || 'AI suggestion'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI categorise failed');
    } finally { setCategorizing(false); }
  };

  const set = <K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const totals = useMemo(() => {
    const base = Number(form.amount) || 0;
    const tax = Number(form.taxAmount) || 0;
    return { base, tax, total: base + tax };
  }, [form.amount, form.taxAmount]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Give the expense a short title.');
      return;
    }
    if (!Number.isFinite(totals.base) || totals.base <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: form.id,
        title: form.title.trim(),
        amount: totals.base,
        taxAmount: totals.tax > 0 ? totals.tax : 0,
        category: form.category,
        vendor: form.vendor.trim(),
        date: form.date,
        paymentMethod: form.paymentMethod,
        receipt: form.receipt.trim(),
        description: form.description.trim(),
      };

      const res = await fetch('/api/expenses', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this expense');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/finance/expenses');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this expense');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/finance/expenses')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to expenses"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              {mode === 'create' ? 'Record an expense' : 'Edit expense'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {mode === 'create'
                ? 'New entries go to the approval queue before they count as spend.'
                : 'Changes are saved to this claim immediately.'}
            </p>
          </div>
        </div>

        {initial.status && initial.status !== 'pending' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            This claim is <strong className="capitalize">{initial.status}</strong>
            {initial.approvedBy ? ` by ${initial.approvedBy}` : ''}. Only an owner or admin can amend it.
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <section
            className="rounded-2xl p-4 sm:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              <Receipt className="h-4 w-4" />
              What did you spend on?
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Title *
                </label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(event) => set('title', event.target.value)}
                  placeholder="e.g. Client lunch, Adobe subscription"
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="amount" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Amount (Rs.) *
                  </label>
                  <input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) => set('amount', event.target.value)}
                    placeholder="0.00"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="tax" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    GST / tax included
                  </label>
                  <input
                    id="tax"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={form.taxAmount}
                    onChange={(event) => set('taxAmount', event.target.value)}
                    placeholder="Optional"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="category" className="block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Category
                    </label>
                    <button type="button" onClick={aiCategorise} disabled={categorizing}
                      className="flex items-center gap-1 text-[11px] font-medium text-purple-600 hover:text-purple-700 disabled:opacity-60">
                      {categorizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI categorise
                    </button>
                  </div>
                  {aiNote && <p className="mb-1 text-[11px] text-emerald-600">{aiNote}</p>}
                  <select
                    id="category"
                    value={form.category}
                    onChange={(event) => set('category', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  >
                    {EXPENSE_CATEGORIES.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="date" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(event) => set('date', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="vendor" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Vendor / paid to
                  </label>
                  <input
                    id="vendor"
                    value={form.vendor}
                    onChange={(event) => set('vendor', event.target.value)}
                    placeholder="e.g. Amazon, Indian Oil"
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="payment" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Paid via
                  </label>
                  <select
                    id="payment"
                    value={form.paymentMethod}
                    onChange={(event) => set('paymentMethod', event.target.value)}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                  >
                    {PAYMENT_METHODS.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="receipt" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Receipt link
                </label>
                <input
                  id="receipt"
                  value={form.receipt}
                  onChange={(event) => set('receipt', event.target.value)}
                  placeholder="https://drive.google.com/…"
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-1 block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Notes
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                  rows={3}
                  placeholder="Why was this spend needed?"
                  className="glass-input w-full resize-none rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </section>

          <section
            className="flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Base {`Rs.${totals.base.toFixed(2)}`}</span>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>Tax {`Rs.${totals.tax.toFixed(2)}`}</span>
              <span className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                Total {`Rs.${totals.total.toFixed(2)}`}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {mode === 'create' ? 'Owner or admin approves this next' : 'Saved instantly'}
            </p>
          </section>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving || saved}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.32)',
              }}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </>
              ) : saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {mode === 'create' ? 'Submit for approval' : 'Save changes'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/finance/expenses')}
              className="rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-black/5"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
