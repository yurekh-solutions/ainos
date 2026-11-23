// Collect-payment links: the server side of "send this invoice to my customer
// as a pay link".
//
// The flow is intentionally two-step. A payer claims that they sent the money
// through UPI and leaves their reference number; the business then confirms it
// against their own bank statement. Only that confirmation moves the invoice,
// because a link nobody controls must never be able to mark money as received.
// Everything below is scoped by companyId, and a token alone only ever exposes
// one invoice to one payer.

import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import { postInvoicePayment } from '@/lib/finance/ledger';
import { buildUpiUri, isValidVpa, upiAmount, type UpiPaymentRequest } from '@/lib/upi';

export class PaymentLinkError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PaymentLinkError';
    this.status = status;
  }
}

const round = (value: unknown): number => Math.round((Number(value) || 0) * 100) / 100;

/** A link is only as strong as its secret, and it is the only credential a
 *  payer has, so it is generated here rather than derived from anything guessable. */
function newToken(): string {
  return randomBytes(24).toString('base64url');
}

type InvoiceMoney = {
  total?: number | null;
  totalAmount?: number | null;
  paidAmount?: number | null;
  status?: string | null;
};

/** What is still owed. `totalAmount` is the field the rest of Finance reads, so
 *  it wins when both are set on an older row. */
export function amountDue(inv: InvoiceMoney): number {
  const gross = round(inv.totalAmount ?? inv.total ?? 0);
  const paid = round(inv.paidAmount ?? 0);
  return round(Math.max(0, gross - paid));
}

export interface PaymentLinkSetup {
  link: {
    id: string;
    token: string;
    amount: number;
    currency: string;
    label: string;
    status: string;
    claimedAt: Date | null;
    paidAt: Date | null;
    expiresAt: Date | null;
    payerName: string | null;
    payerUpiId: string | null;
    payerRef: string | null;
    notes: string | null;
    views: number;
  };
  invoice: { id: string; invoiceNumber: string; dueDate: Date | null; invoiceDate: Date | null; customerName: string | null; status: string };
  company: { name: string; logoUrl: string | null; upiId: string; upiPayeeName: string | null; state: string | null };
  /** The string a QR encoder turns into the image a UPI app scans. */
  upiUri: string;
  /** True once the stored amount no longer matches what is actually owed. */
  stale: boolean;
  dueNow: number;
}

function statusOf(link: { status: string; expiresAt: Date | null }, now = new Date()): string {
  if (link.status === 'paid' || link.status === 'revoked') return link.status;
  if (link.expiresAt && link.expiresAt.getTime() < now.getTime()) return 'expired';
  return link.status;
}

/**
 * Create the link for an invoice, or hand back the one that already exists so
 * pressing the button twice does not print two different QR codes for the same
 * bill (which is how reconciliation messes start).
 */
export async function createPaymentLink(input: {
  companyId: string;
  userId: string | null;
  userEmail?: string | null;
  invoiceId: string;
  amount?: number | null;
  label?: string | null;
  notes?: string | null;
  expiresInDays?: number | null;
}) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, companyId: input.companyId },
    select: {
      id: true, invoiceNumber: true, status: true, total: true, totalAmount: true,
      paidAmount: true, customerName: true, dueDate: true,
    },
  });
  if (!invoice) throw new PaymentLinkError('Invoice not found', 404);
  if (invoice.status === 'draft') {
    throw new PaymentLinkError('This invoice is still a draft. Finalise it before asking for payment.');
  }
  if (invoice.status === 'void' || invoice.status === 'cancelled') {
    throw new PaymentLinkError('This invoice is void, so there is nothing to collect.');
  }

  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
    select: { upiId: true, upiPayeeName: true, name: true },
  });
  const vpa = String(company?.upiId ?? '').trim();
  if (!vpa) {
    throw new PaymentLinkError(
      'Add your UPI id under Company profile first — the QR sends money straight to that handle.',
    );
  }
  if (!isValidVpa(vpa)) {
    throw new PaymentLinkError('The saved UPI id looks incomplete. It should look like businessname@bank.');
  }

  const due = amountDue(invoice);
  if (due <= 0) throw new PaymentLinkError('This invoice is already fully paid.');

  // A partial link is allowed (advance / balance), but never more than is owed:
  // over-collecting through a link nobody reconciles is how disputes start.
  const amount = input.amount === null || input.amount === undefined ? due : upiAmount(input.amount);
  if (amount <= 0) throw new PaymentLinkError('Enter the amount to collect.');
  if (amount > due) {
    throw new PaymentLinkError(`You can collect at most ₹${due.toLocaleString('en-IN')} on this invoice.`);
  }

  const label = String(input.label ?? '').trim() || (amount === due ? 'Full payment' : 'Part payment');
  const open = await prisma.paymentLink.findFirst({
    where: {
      companyId: input.companyId,
      invoiceId: invoice.id,
      status: { in: ['active', 'claimed'] },
      amount,
      label,
    },
    orderBy: { createdAt: 'desc' },
  });
  if (open) return { link: open, reused: true };

  const days = Number(input.expiresInDays ?? 0);
  const expiresAt = Number.isFinite(days) && days >= 1 && days <= 365
    ? new Date(Date.now() + days * 86_400_000)
    : null;

  // token is unique, so a fresh one is only reused when it provably does not
  // exist yet. A collision this unlikely is not worth a retry loop that hides
  // real database errors.
  let token = newToken();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const clash = await prisma.paymentLink.findUnique({ where: { token }, select: { id: true } });
    if (!clash) break;
    token = newToken();
  }

  const link = await prisma.paymentLink.create({
    data: {
      token,
      invoiceId: invoice.id,
      companyId: input.companyId,
      amount,
      currency: 'INR',
      label,
      status: 'active',
      notes: String(input.notes ?? '').trim().slice(0, 500) || null,
      expiresAt,
    },
  });

  await recordAudit({
    companyId: input.companyId,
    entity: 'payment',
    entityId: link.id,
    action: 'link_created',
    actor: { id: input.userId, email: input.userEmail ?? null },
    summary: `${label} ₹${amount.toLocaleString('en-IN')} for ${invoice.invoiceNumber}`,
    changes: { invoiceNumber: invoice.invoiceNumber, amount, dueAt: invoice.dueDate ?? null, expiresAt: link.expiresAt ?? null },
  });

  return { link, reused: false };
}

export async function revokePaymentLink(input: { companyId: string; userId: string | null; userEmail?: string | null; linkId: string }) {
  const link = await prisma.paymentLink.findFirst({
    where: { id: input.linkId, companyId: input.companyId },
    include: { invoice: { select: { invoiceNumber: true } } },
  });
  if (!link) throw new PaymentLinkError('Payment link not found', 404);
  if (link.status === 'paid') throw new PaymentLinkError('This payment is already confirmed, so the link stays as history.');

  const updated = await prisma.paymentLink.update({
    where: { id: link.id },
    data: { status: 'revoked' },
  });
  await recordAudit({
    companyId: input.companyId,
    entity: 'payment',
    entityId: link.id,
    action: 'link_revoked',
    actor: { id: input.userId, email: input.userEmail ?? null },
    summary: `Link revoked for ${link.invoice?.invoiceNumber ?? 'an invoice'}`,
    changes: { amount: link.amount, status: { from: link.status, to: 'revoked' } },
  });
  return updated;
}

/**
 * Everything a payer needs, assembled from the token only. The company filter
 * is applied through the link row itself, so a token can never resolve into
 * another tenant's invoice.
 */
export async function readPaymentLink(token: string, now = new Date()): Promise<PaymentLinkSetup | null> {
  const clean = String(token ?? '').trim();
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(clean)) return null;

  const row = await prisma.paymentLink.findUnique({
    where: { token: clean },
    select: {
      id: true, token: true, amount: true, currency: true, label: true, status: true,
      claimedAt: true, paidAt: true, expiresAt: true, payerName: true, payerUpiId: true,
      payerRef: true, notes: true, views: true, companyId: true,
      invoice: { select: { id: true, invoiceNumber: true, dueDate: true, invoiceDate: true, customerName: true, status: true, totalAmount: true, total: true, paidAmount: true } },
      company: { select: { name: true, logoUrl: true, upiId: true, upiPayeeName: true, state: true } },
    },
  });
  if (!row || !row.invoice || !row.company) return null;

  const status = statusOf(row, now);
  // An expired row is flipped once, on read, instead of needing a cron job that
  // a free hosting plan cannot reliably run.
  if (status === 'expired' && row.status !== 'expired') {
    await prisma.paymentLink.update({ where: { id: row.id }, data: { status: 'expired' } }).catch(() => undefined);
  }
  await prisma.paymentLink.update({ where: { id: row.id }, data: { views: { increment: 1 } } }).catch(() => undefined);

  const vpa = String(row.company.upiId ?? '').trim();
  if (!isValidVpa(vpa)) return null;

  const upiRequest: UpiPaymentRequest = {
    payeeVpa: vpa,
    payeeName: row.company.upiPayeeName || row.company.name,
    amount: row.amount,
    transactionRef: row.invoice.invoiceNumber,
    note: `${row.company.name} ${row.label}`.slice(0, 80),
  };

  return {
    link: {
      id: row.id, token: row.token, amount: row.amount, currency: row.currency,
      label: row.label ?? 'Payment', status, claimedAt: row.claimedAt, paidAt: row.paidAt,
      expiresAt: row.expiresAt, payerName: row.payerName, payerUpiId: row.payerUpiId,
      payerRef: row.payerRef, notes: row.notes, views: row.views,
    },
    invoice: row.invoice,
    company: {
      name: row.company.name,
      logoUrl: row.company.logoUrl ?? null,
      upiId: vpa,
      upiPayeeName: row.company.upiPayeeName ?? null,
      state: row.company.state ?? null,
    },
    upiUri: buildUpiUri(upiRequest),
    dueNow: amountDue(row.invoice),
    stale: status === 'active' && round(row.amount) !== amountDue(row.invoice),
  };
}

/** A payer says "I paid". Nothing about the invoice changes yet. */
export async function claimPaymentLink(input: { token: string; payerName?: string | null; payerUpiId?: string | null; payerRef?: string | null }) {
  const setup = await readPaymentLink(input.token);
  if (!setup) throw new PaymentLinkError('This payment link is not valid.', 404);
  if (setup.link.status === 'paid') throw new PaymentLinkError('This payment is already confirmed. Thank you — no need to pay again.');
  if (setup.link.status === 'revoked' || setup.link.status === 'expired') {
    throw new PaymentLinkError('This payment link is no longer active. Ask the business for a new one.');
  }

  const ref = String(input.payerRef ?? '').replace(/[^0-9a-zA-Z._-]/g, '').trim().slice(0, 40);
  if (ref.length < 6) {
    throw new PaymentLinkError('Enter the UPI reference number from your payment app (it is 12 digits or more).');
  }
  const payerVpa = String(input.payerUpiId ?? '').trim();
  if (payerVpa && !isValidVpa(payerVpa)) {
    throw new PaymentLinkError('Your UPI id looks incomplete. Leave it blank or use the full name@bank.');
  }
  const payerName = String(input.payerName ?? '').replace(/[\r\n<>]/g, '').trim().slice(0, 120);

  const link = await prisma.paymentLink.update({
    where: { id: setup.link.id },
    data: {
      status: 'claimed',
      claimedAt: new Date(),
      payerRef: ref,
      payerUpiId: payerVpa || null,
      payerName: payerName || setup.invoice.customerName || null,
    },
  });

  await recordAudit({
    companyId: link.companyId,
    entity: 'payment',
    entityId: link.id,
    action: 'payment_claimed',
    actor: { id: null, email: payerName ? `${payerName} (payer)` : 'payer' },
    summary: `₹${link.amount.toLocaleString('en-IN')} claimed for ${setup.invoice.invoiceNumber}`,
    changes: { reference: ref, payerVpa: payerVpa || null },
  });

  return { ok: true, invoiceNumber: setup.invoice.invoiceNumber, amount: link.amount };
}

/**
 * The business confirms the money landed. This is the only place that touches
 * an invoice, and it re-checks ownership plus the live balance before writing.
 */
export async function confirmPaymentLink(input: {
  companyId: string;
  userId: string | null;
  userEmail?: string | null;
  linkId: string;
  action: 'confirm' | 'reject';
  bankReference?: string | null;
}) {
  const link = await prisma.paymentLink.findFirst({
    where: { id: input.linkId, companyId: input.companyId },
    include: { invoice: true },
  });
  if (!link) throw new PaymentLinkError('Payment link not found', 404);
  if (!link.invoice) throw new PaymentLinkError('The invoice behind this link no longer exists.', 404);
  if (link.status === 'paid') throw new PaymentLinkError('This payment is already confirmed.');
  if (link.status === 'revoked') throw new PaymentLinkError('This link was revoked, so it cannot be confirmed.');

  if (input.action === 'reject') {
    const back = await prisma.paymentLink.update({
      where: { id: link.id },
      data: { status: 'active', claimedAt: null },
    });
    await recordAudit({
      companyId: input.companyId,
      entity: 'payment',
      entityId: link.id,
      action: 'claim_rejected',
      actor: { id: input.userId, email: input.userEmail ?? null },
      summary: `Claim on ${link.invoice.invoiceNumber} sent back to the payer`,
      changes: { amount: link.amount, reference: link.payerRef },
    });
    return { link: back, invoice: link.invoice };
  }

  const invoice = link.invoice;
  const gross = round(invoice.totalAmount ?? invoice.total ?? 0);
  const alreadyPaid = round(invoice.paidAmount ?? 0);
  const paidAmount = round(Math.min(gross, alreadyPaid + round(link.amount)));
  const remaining = round(gross - paidAmount);
  const bankRef = String(input.bankReference ?? '').replace(/[\r\n<>]/g, '').trim().slice(0, 60);

  const history = Array.isArray(invoice.payments) ? (invoice.payments as unknown[]) : [];
  const entry = {
    date: new Date().toISOString(),
    amount: round(link.amount),
    method: 'upi-link',
    reference: link.payerRef ?? bankRef ?? null,
    linkId: link.id,
    payer: link.payerName ?? invoice.customerName ?? null,
  };
  const payments = [...history, entry] as unknown as Prisma.InputJsonValue;

  const [updated] = await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount,
        payments,
        paymentMethod: invoice.paymentMethod ?? 'upi',
        status: remaining <= 0 ? 'paid' : 'partial',
        paidDate: remaining <= 0 ? (invoice.paidDate ?? new Date()) : invoice.paidDate,
      },
    }),
    prisma.paymentLink.update({
      where: { id: link.id },
      data: { status: 'paid', paidAt: new Date(), payerRef: link.payerRef ?? (bankRef || null) },
    }),
  ]);

  // Same poster every other Finance route uses, so the daybook and the reports
  // pick the money up without a second version of the truth.
  await postInvoicePayment(prisma, updated);

  await recordAudit({
    companyId: input.companyId,
    entity: 'payment',
    entityId: link.id,
    action: 'payment_confirmed',
    actor: { id: input.userId, email: input.userEmail ?? null },
    summary: `₹${round(link.amount).toLocaleString('en-IN')} confirmed against ${invoice.invoiceNumber}`,
    changes: { paidBefore: alreadyPaid, paidAfter: paidAmount, remaining, reference: entry.reference },
  });

  return { link: await prisma.paymentLink.findUnique({ where: { id: link.id } }), invoice: updated };
}

/** The queue a business owner works through: claims waiting on a bank check. */
export async function pendingPaymentClaims(companyId: string) {
  const rows = await prisma.paymentLink.findMany({
    where: { companyId, status: 'claimed' },
    include: { invoice: { select: { id: true, invoiceNumber: true, customerName: true, dueDate: true } } },
    orderBy: { claimedAt: 'desc' },
    take: 100,
  });
  return rows.map((row) => ({
    id: row.id,
    token: row.token,
    amount: row.amount,
    label: row.label,
    claimedAt: row.claimedAt,
    payerName: row.payerName,
    payerUpiId: row.payerUpiId,
    payerRef: row.payerRef,
    invoiceId: row.invoice?.id ?? null,
    invoiceNumber: row.invoice?.invoiceNumber ?? null,
    customerName: row.invoice?.customerName ?? null,
    dueDate: row.invoice?.dueDate ?? null,
  }));
}

/** Links attached to a set of invoices, for the list view badges. */
export async function paymentLinksForInvoices(companyId: string, invoiceIds: string[]) {
  if (!invoiceIds.length) return [];
  return prisma.paymentLink.findMany({
    where: { companyId, invoiceId: { in: invoiceIds } },
    select: { id: true, token: true, invoiceId: true, amount: true, label: true, status: true, expiresAt: true, paidAt: true, claimedAt: true },
    orderBy: { createdAt: 'desc' },
  });
}
