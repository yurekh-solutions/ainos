import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import QRCode from 'qrcode';
import { readPaymentLink } from '@/lib/payment-links';
import { UPI_SOFT_LIMIT, manualPayInstructions } from '@/lib/upi';
import PayActions from './PayActions';

// A payment link is a private URL that a customer receives on WhatsApp or email.
// It must never be indexed, cached or guessed, so the page is rendered fresh on
// every visit and carries no session.
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ token: string }>;
}

function rupees(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateLabel(value: Date | string | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const setup = await readPaymentLink(token).catch(() => null);
  if (!setup) return { title: 'Payment link', robots: 'noindex, nofollow' };
  return {
    title: `Pay ${rupees(setup.link.amount)} to ${setup.company.name}`,
    description: `Pay invoice ${setup.invoice.invoiceNumber} to ${setup.company.name} using UPI.`,
    robots: 'noindex, nofollow',
  };
}

export default async function PayPage({ params }: Props) {
  const { token } = await params;
  // Anything unreadable - wrong token, deleted invoice, missing UPI id - lands on
  // the same generic screen instead of telling a probing caller which one it was.
  const setup = await readPaymentLink(token).catch(() => null);
  if (!setup) notFound();

  const status = setup.link.status;
  const paid = status === 'paid';
  const closed = status === 'revoked' || status === 'expired';
  const instructions = manualPayInstructions({
    payeeVpa: setup.company.upiId,
    payeeName: setup.company.upiPayeeName || setup.company.name,
    amount: setup.link.amount,
    transactionRef: setup.invoice.invoiceNumber,
  });

  let qr: string | null = null;
  try {
    qr = await QRCode.toDataURL(setup.upiUri, { margin: 1, width: 320, errorCorrectionLevel: 'M' });
  } catch {
    // A QR that will not render must not eat the page: the UPI id and the amount
    // are still enough for anyone to pay from their own app.
    qr = null;
  }

  const alreadySettled = !paid && (setup.invoice.status === 'paid' || setup.dueNow <= 0);
  const dueLabel = dateLabel(setup.invoice.dueDate);
  const expiresLabel = dateLabel(setup.link.expiresAt);
  const paidLabel = dateLabel(setup.link.paidAt);
  const claimedLabel = dateLabel(setup.link.claimedAt);

  return (
    <main className="min-h-screen bg-[#f6f6fb] px-4 py-8 text-neutral-900">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {/* Who is being paid - the payer needs to recognise the business before sending money. */}
          <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
            {setup.company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={setup.company.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-sm font-bold text-purple-700">
                {setup.company.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{setup.company.name}</p>
              <p className="truncate text-xs text-neutral-500">Payment request</p>
            </div>
          </div>

          <div className="px-5 py-5">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Amount payable</p>
            <p className="mt-1 text-3xl font-bold text-[#4c1d95]">{rupees(setup.link.amount)}</p>
            <p className="mt-1 text-sm text-neutral-600">
              {setup.link.label} · Invoice {setup.invoice.invoiceNumber}
            </p>
            {setup.invoice.customerName ? (
              <p className="mt-0.5 text-sm text-neutral-500">For {setup.invoice.customerName}</p>
            ) : null}

            {dueLabel && !paid ? (
              <p className="mt-3 text-xs text-neutral-500">
                Due {dueLabel}
                {expiresLabel ? ` · link valid till ${expiresLabel}` : ''}
              </p>
            ) : null}

            {paid ? (
              <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-semibold">Paid{paidLabel ? ` on ${paidLabel}` : ''}.</p>
                <p className="mt-1 text-emerald-700">
                  Thank you. This payment is confirmed in the business&apos;s books, so you do not need to pay again.
                </p>
              </div>
            ) : null}

            {status === 'claimed' ? (
              <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Waiting for the business to confirm</p>
                <p className="mt-1">
                  You marked this as paid{claimedLabel ? ` on ${claimedLabel}` : ''}
                  {setup.link.payerRef ? ` with reference ${setup.link.payerRef}` : ''}. Nothing is needed from you now.
                </p>
              </div>
            ) : null}

            {closed ? (
              <div className="mt-4 rounded-xl bg-neutral-100 p-4 text-sm text-neutral-700">
                <p className="font-semibold">This link is {status === 'expired' ? 'no longer valid' : 'closed'}.</p>
                <p className="mt-1">Ask {setup.company.name} to send a fresh payment link.</p>
              </div>
            ) : null}

            {alreadySettled ? (
              <div className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
                <p className="font-semibold">This invoice already shows as paid.</p>
                <p className="mt-1">
                  Please do not pay again. Contact {setup.company.name} if you have already sent the money.
                </p>
              </div>
            ) : null}

            {setup.stale && !paid && !closed ? (
              <p className="mt-3 text-xs text-neutral-500">
                The balance on this invoice is now {rupees(setup.dueNow)}. If that differs from what you agreed,
                check with {setup.company.name} before paying.
              </p>
            ) : null}

            {!alreadySettled && !paid && !closed ? (
              <div className="mt-5 flex flex-col items-center">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="UPI QR code" className="h-48 w-48 rounded-xl border border-neutral-200 bg-white p-2" />
                ) : (
                  <p className="text-xs text-neutral-500">QR could not be drawn — pay using the UPI id below.</p>
                )}
                <p className="mt-2 text-xs text-neutral-500">Scan with any UPI app — GPay, PhonePe, Paytm or your bank app</p>

                {setup.link.amount > UPI_SOFT_LIMIT ? (
                  <p className="mt-2 rounded-lg bg-neutral-50 p-2 text-center text-xs text-neutral-600">
                    Above {rupees(UPI_SOFT_LIMIT)} many banks cap a single UPI payment. If this fails, pay in two parts.
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Paying details in text, because a payer on a desktop or a phone where
                the app does not open still needs a way to complete the payment. */}
            {!paid ? (
              <dl className="mt-5 divide-y divide-neutral-100 rounded-xl border border-neutral-200 text-sm">
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                  <dt className="text-neutral-500">UPI id</dt>
                  <dd className="truncate font-medium">{instructions.vpa}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                  <dt className="text-neutral-500">Amount</dt>
                  <dd className="font-medium">{instructions.amount}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                  <dt className="text-neutral-500">Reference</dt>
                  <dd className="truncate font-medium">{instructions.ref || setup.invoice.invoiceNumber}</dd>
                </div>
              </dl>
            ) : null}
          </div>
        </div>

        {!paid && !closed && !alreadySettled ? (
          <PayActions
            token={token}
            upiUri={setup.upiUri}
            defaultPayerName={setup.invoice.customerName ?? ''}
            payeeName={setup.company.name}
          />
        ) : null}

        <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-400">
          Money goes directly to {setup.company.name}&apos;s own UPI account. AINOS is not a payment gateway and never
          holds your money or your card details.
        </p>
      </div>
    </main>
  );
}
