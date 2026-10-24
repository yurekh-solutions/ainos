'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Plus, Save, Trash2 } from 'lucide-react';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

const fieldClass = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';
const labelClass = 'text-xs font-semibold uppercase tracking-wide';

export default function NewDebitNotePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    vendorName: '',
    vendorId: '',
    purchaseId: '',
    reason: '',
    status: 'draft',
    gstMode: 'intra' as 'intra' | 'inter',
  });
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, rate: 0, amount: 0 }]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const setItem = (index: number, patch: Partial<LineItem>) =>
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, ...patch };
        next.amount = Math.round(next.quantity * next.rate * 100) / 100;
        return next;
      }),
    );

  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const cgstAmount = form.gstMode === 'intra' ? Math.round((tax / 2) * 100) / 100 : 0;
  const sgstAmount = form.gstMode === 'intra' ? Math.round((tax / 2) * 100) / 100 : 0;
  const igstAmount = form.gstMode === 'inter' ? tax : 0;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.vendorName.trim()) {
      setError('Vendor name is required.');
      return;
    }
    const cleanItems = items.filter((item) => item.description.trim());
    if (cleanItems.length === 0) {
      setError('Add at least one line item.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/debit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName: form.vendorName.trim(),
          vendorId: form.vendorId.trim() || null,
          purchaseId: form.purchaseId.trim() || null,
          reason: form.reason.trim(),
          status: form.status,
          items: cleanItems,
          subtotal,
          tax,
          cgstAmount,
          sgstAmount,
          igstAmount,
          total,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not create debit note');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/finance/debit-notes');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create debit note');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6" style={{ background: 'var(--page-gradient)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-5 pb-24">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/finance/debit-notes')}
            className="rounded-lg border p-2 transition hover:bg-black/5"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            aria-label="Back to debit notes"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'hsl(var(--foreground))' }}>
              New debit note
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Raise a debit note against a vendor for returns or corrections
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Vendor
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Vendor name *
                </span>
                <input
                  value={form.vendorName}
                  onChange={(event) => setForm({ ...form, vendorName: event.target.value })}
                  placeholder="Sky Vision Traders"
                  className={`${fieldClass} mt-1`}
                  required
                />
              </label>
              <label>
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Purchase reference
                </span>
                <input
                  value={form.purchaseId}
                  onChange={(event) => setForm({ ...form, purchaseId: event.target.value })}
                  placeholder="PO number or bill no."
                  className={`${fieldClass} mt-1`}
                />
              </label>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Line items
              </h2>
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, { description: '', quantity: 1, rate: 0, amount: 0 }])}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add line
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-2 rounded-xl p-3 sm:grid-cols-12"
                  style={{ background: 'hsl(var(--secondary))' }}
                >
                  <input
                    value={item.description}
                    onChange={(event) => setItem(index, { description: event.target.value })}
                    placeholder="Description"
                    className={`${fieldClass} sm:col-span-5`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) => setItem(index, { quantity: Number(event.target.value) || 0 })}
                    placeholder="Qty"
                    className={`${fieldClass} sm:col-span-2`}
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.rate}
                    onChange={(event) => setItem(index, { rate: Number(event.target.value) || 0 })}
                    placeholder="Rate"
                    className={`${fieldClass} sm:col-span-2`}
                  />
                  <div className="flex items-center justify-between gap-2 sm:col-span-3">
                    <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      ₹{(item.amount || 0).toLocaleString('en-IN')}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                        className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Reason and tax
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="sm:col-span-2">
                <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Reason
                </span>
                <textarea
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  rows={2}
                  placeholder="Damaged goods returned, rate difference…"
                  className={`${fieldClass} mt-1 resize-none`}
                />
              </label>
              <div className="space-y-3">
                <label className="block">
                  <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                    GST type
                  </span>
                  <select
                    value={form.gstMode}
                    onChange={(event) => setForm({ ...form, gstMode: event.target.value as 'intra' | 'inter' })}
                    className={`${fieldClass} mt-1`}
                  >
                    <option value="intra">CGST + SGST</option>
                    <option value="inter">IGST</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass} style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Status
                  </span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                    className={`${fieldClass} mt-1`}
                  >
                    <option value="draft">Draft</option>
                    <option value="posted">Posted</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-5 space-y-1.5 border-t pt-4 text-sm" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="flex justify-between">
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal</span>
                <span style={{ color: 'hsl(var(--foreground))' }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {form.gstMode === 'intra' ? (
                <>
                  <div className="flex justify-between">
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>CGST (9%)</span>
                    <span style={{ color: 'hsl(var(--foreground))' }}>₹{cgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>SGST (9%)</span>
                    <span style={{ color: 'hsl(var(--foreground))' }}>₹{sgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>IGST (18%)</span>
                  <span style={{ color: 'hsl(var(--foreground))' }}>₹{igstAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div
                className="flex justify-between border-t pt-2 text-base font-bold"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                <span>Total</span>
                <span className="text-rose-600">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/finance/debit-notes')}
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
              {saved ? 'Saved' : saving ? 'Saving…' : 'Create debit note'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
