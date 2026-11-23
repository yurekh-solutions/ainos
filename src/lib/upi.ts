// UPI payment requests, built the way NPCI specifies them so any UPI app
// (GPay, PhonePe, Paytm, bank apps) can read the QR and pre-fill the amount.
//
// There is deliberately no gateway here: the request points at the business's
// own UPI id, so the money lands in their account with no per-transaction fee
// and nothing to onboard. That is the only reason this works for a small Indian
// shop on day one, and it is why the amount and payee id are validated strictly
// - a wrong VPA in a QR sends money to somebody else.

/** A UPI id (VPA) looks like `name@bank`. Loose enough for real handles, tight
 *  enough to reject a typo before it becomes a payment to the wrong person. */
export const VPA_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,254})@[a-z]{2,64}$/i;

/** Single-transaction ceiling most banks apply to a person-to-person UPI pay.
 *  Above it the payer usually has to split the payment, so we warn instead of
 *  pretending the QR will work. */
export const UPI_SOFT_LIMIT = 100_000;

export function isValidVpa(value: unknown): boolean {
  return typeof value === 'string' && VPA_PATTERN.test(value.trim());
}

export interface UpiPaymentRequest {
  payeeVpa: string;
  payeeName: string;
  amount: number;
  /** Invoice number or similar. UPI allows ~35 characters here. */
  transactionRef?: string | null;
  /** Shown to the payer as the payment message. */
  note?: string | null;
}

/** Amounts go into the URI with two decimals, nothing else. */
export function upiAmount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * Strip characters that would break the query string or a bank's parser, then
 * length-cap each field the way the UPI spec does. Never silently: a clipped
 * name is cosmetic, a clipped amount is not (so amounts are never clipped).
 */
function clean(value: unknown, max: number): string {
  const text = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[&=?#%+/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, max);
}

/** Digits, letters and a few separators only - everything else a bank rejects. */
function cleanRef(value: unknown, max = 35): string {
  return String(value ?? '').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, max);
}

export function buildUpiUri(req: UpiPaymentRequest): string {
  const vpa = String(req.payeeVpa ?? '').trim();
  if (!VPA_PATTERN.test(vpa)) {
    throw new UpiError('The UPI id is not valid. It should look like businessname@bank.');
  }
  const amount = upiAmount(req.amount);
  if (amount <= 0) throw new UpiError('The payable amount must be greater than zero.');
  if (amount > 99_99_999) throw new UpiError('The amount is too large for a single UPI request.');

  const parts = [
    `pa=${encodeURIComponent(vpa)}`,
    `pn=${encodeURIComponent(clean(req.payeeName, 80) || 'Business')}`,
    `am=${amount.toFixed(2)}`,
  ];
  const ref = cleanRef(req.transactionRef);
  if (ref) parts.push(`tr=${encodeURIComponent(ref)}`);
  const note = clean(req.note, 80);
  if (note) parts.push(`tn=${encodeURIComponent(note)}`);
  parts.push('cu=INR');

  return `upi://pay?${parts.join('&')}`;
}

/**
 * A human-readable payment instruction for the page, so a payer on desktop (or
 * on a phone where the deep link does not open an app) can still pay by typing
 * the UPI id and the amount into their own app.
 */
export function manualPayInstructions(req: UpiPaymentRequest): { vpa: string; amount: string; ref: string } {
  const amount = upiAmount(req.amount);
  return {
    vpa: String(req.payeeVpa ?? '').trim(),
    amount: amount > 0 ? `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
    ref: cleanRef(req.transactionRef),
  };
}

export class UpiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'UpiError';
    this.status = status;
  }
}
