'use client';

import { useState } from 'react';

interface Props {
  token: string;
  upiUri: string;
  defaultPayerName: string;
  payeeName: string;
}

/**
 * The payer's two actions: open the payment in a UPI app, then tell the business
 * it was sent. The second one is a claim, not a receipt - which is why the
 * reference number is required and the confirmation still happens on the
 * business's side against their bank statement.
 */
export default function PayActions({ token, upiUri, defaultPayerName, payeeName }: Props) {
  const [open, setOpen] = useState(false);
  const [payerName, setPayerName] = useState(defaultPayerName);
  const [payerUpiId, setPayerUpiId] = useState('');
  const [payerRef, setPayerRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyVpa = async () => {
    const vpa = new URLSearchParams(upiUri.split('?')[1] ?? '').get('pa') ?? '';
    try {
      await navigator.clipboard.writeText(vpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is denied in some in-app browsers. The id is already
      // printed on the page, so there is nothing to apologise about.
      setCopied(false);
    }
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/pay/${encodeURIComponent(token)}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payerName, payerUpiId, payerRef }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Could not record the payment. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network problem. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="text-sm font-semibold text-emerald-700">Marked as paid.</p>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600">
          {payeeName} has been notified and will confirm the payment against their bank. You can send them the same
          reference number on WhatsApp if you want it confirmed faster.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-col gap-2">
        <a
          href={upiUri}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#4c1d95] px-4 text-sm font-semibold text-white"
        >
          Open in a UPI app
        </a>
        <button
          type="button"
          onClick={copyVpa}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700"
        >
          {copied ? 'UPI id copied' : 'Copy UPI id'}
        </button>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 w-full text-left text-sm font-medium text-[#4c1d95]"
        >
          I have paid — tell the business
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-xs leading-relaxed text-neutral-500">
            Send the money first, then fill this in. Nothing here marks the invoice as paid — {payeeName} confirms it
            after checking their bank.
          </p>

          <label className="block">
            <span className="text-xs font-medium text-neutral-600">Your name</span>
            <input
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              placeholder="As it appears on your UPI account"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-neutral-600">UPI reference number from your payment app</span>
            <input
              value={payerRef}
              onChange={(e) => setPayerRef(e.target.value)}
              inputMode="numeric"
              className="mt-1 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              placeholder="12-digit UTR / reference"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-neutral-600">Your UPI id (optional)</span>
            <input
              value={payerUpiId}
              onChange={(e) => setPayerUpiId(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              placeholder="urname@bank"
            />
          </label>

          {error ? <p className="text-xs text-rose-700">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-[#4c1d95] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Submit for confirmation'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm text-neutral-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
