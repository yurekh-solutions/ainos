'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Loader2, MessageCircle, QrCode, Trash2 } from 'lucide-react';

export interface CollectInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string | null;
  totalAmount: number;
  paidAmount?: number;
}

type LinkRow = {
  id: string;
  token: string;
  amount: number;
  label: string | null;
  status: string;
  expiresAt: string | null;
  claimedAt: string | null;
  paidAt: string | null;
};

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const round2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

const STATUS_TEXT: Record<string, string> = {
  active: 'Waiting for payment',
  claimed: 'Customer says paid — confirm',
  paid: 'Confirmed',
  revoked: 'Revoked',
  expired: 'Expired',
};

/**
 * Share & Collect: turn one invoice into a UPI payment link the owner can drop
 * into WhatsApp. Nothing here moves money - the link points at the business's
 * own UPI handle, and the invoice only changes when the owner confirms the
 * payment in Finance after checking their bank statement.
 */
export default function CollectPaymentDialog({ invoice, onClose }: { invoice: CollectInvoice; onClose: () => void }) {
  const due = round2((invoice.totalAmount || 0) - (invoice.paidAmount || 0));
  const [amount, setAmount] = useState(String(due));
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [upi, setUpi] = useState<{ configured: boolean; vpa: string | null }>({ configured: false, vpa: null });
  const [active, setActive] = useState<LinkRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'link' | 'vpa' | null>(null);

  const payUrl = (token: string) => `${window.location.origin}/pay/${token}`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/payment-links?invoiceId=${invoice.id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Could not load this invoice.');
        return;
      }
      const rows: LinkRow[] = Array.isArray(data.links) ? data.links : [];
      setLinks(rows);
      setUpi(data?.upi ?? { configured: false, vpa: null });
      // One open link is shown as soon as the panel opens, so pressing the
      // button twice can never look like two different bills for one invoice.
      setActive(rows.find((l) => l.status === 'active' || l.status === 'claimed') ?? null);
    } catch {
      setError('Network problem. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [invoice.id]);

  // Loading on open is the point: the panel must show the link that already
  // exists rather than let someone create a second one for the same bill.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const copy = async (value: string, which: 'link' | 'vpa') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Your browser blocked copying. Select the text and copy it manually.');
    }
  };

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, amount: Number(amount) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Could not create the payment link.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the payment link.');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (link: LinkRow) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/payment-links?id=${link.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Could not revoke this link.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke this link.');
    } finally {
      setBusy(false);
    }
  };

  const shareText = active
    ? `Hi ${invoice.customerName}, invoice ${invoice.invoiceNumber} for ${money(active.amount)} can be paid by UPI here: ${payUrl(active.token)}`
    : '';

  const shareOnWhatsApp = () => {
    if (!active) return;
    const phone = (invoice.customerPhone || '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const overAmount = round2(Number(amount)) > due;

  return (
    <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto p-5 sm:p-6" style={{ background: 'hsl(var(--card))' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Share &amp; collect</h3>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Invoice {invoice.invoiceNumber} — {invoice.customerName}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-sm underline" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Close
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {!upi.configured ? (
            <div className="rounded-xl border p-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted))' }}>
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Add your UPI id first</p>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                The link and QR send money straight to your own UPI account, so it has to be on file. Nothing is held by
                AINOS.
              </p>
              <Link
                href="/company"
                className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white"
                style={{ background: 'hsl(var(--primary))' }}
              >
                <QrCode className="w-4 h-4" /> Open Company profile
              </Link>
            </div>
          ) : active ? (
            <div className="rounded-xl border p-4" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  {STATUS_TEXT[active.status] ?? active.status}
                </p>
                <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{money(active.amount)}</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  readOnly
                  value={payUrl(active.token)}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 px-3 py-2 text-xs rounded-lg border"
                  style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
                <button
                  type="button"
                  onClick={() => copy(payUrl(active.token), 'link')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                >
                  {copied === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'link' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={shareOnWhatsApp}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                  style={{ background: '#16a34a' }}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Share on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => window.open(payUrl(active.token), '_blank')}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                >
                  Open the pay page
                </button>
                <button
                  type="button"
                  onClick={() => revoke(active)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke link
                </button>
              </div>

              {upi.vpa && (
                <p className="mt-3 text-[11px] leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Payments land in: {upi.vpa}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border p-4" style={{ borderColor: 'hsl(var(--border))' }}>
              <label className="block text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Amount to collect
                <span className="ml-1" style={{ color: 'hsl(var(--foreground))' }}>{money(due)} due</span>
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={due}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-36 px-3 py-2 text-sm rounded-lg border"
                  style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
                <button type="button" onClick={() => setAmount(String(due))} className="text-xs underline" style={{ color: 'hsl(var(--primary))' }}>
                  Full amount
                </button>
              </div>
              {overAmount && (
                <p className="mt-2 text-[11px] text-rose-700">A link can never ask for more than what is due.</p>
              )}
              <button
                type="button"
                onClick={create}
                disabled={busy || overAmount || round2(Number(amount)) <= 0}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'hsl(var(--primary))' }}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Create payment link
              </button>
            </div>
          )}

          {links.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Links on this invoice
              </p>
              <div className="mt-2 space-y-1.5">
                {links.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 text-xs">
                    <span style={{ color: 'hsl(var(--foreground))' }}>
                      {money(l.amount)} · {l.label || 'Payment'}
                    </span>
                    <span
                      className={
                        l.status === 'paid' ? 'text-emerald-700 font-semibold'
                          : l.status === 'claimed' ? 'text-amber-700 font-semibold'
                            : 'text-neutral-500'
                      }
                    >
                      {STATUS_TEXT[l.status] ?? l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs leading-relaxed text-rose-700" role="alert">{error}</p>}

          <p className="text-[11px] leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
            When the customer taps “I have paid”, the claim appears under Finance → Payment reminders for you to confirm
            against your bank statement. Money is never held by AINOS.
          </p>
        </div>
      )}
    </div>
  );
}
