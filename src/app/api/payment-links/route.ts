// Collect-payment links, from the business side: look at an invoice, create the
// shareable link, and revoke it again.
//
// The link itself carries no login; the random token in the URL is the whole
// capability, so every handler here re-checks that the invoice and the link
// belong to the caller's company before doing anything.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  amountDue, createPaymentLink, PaymentLinkError, pendingPaymentClaims,
  paymentLinksForInvoices, revokePaymentLink,
} from '@/lib/payment-links';

async function caller(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return null;
  return { id: user.id, email: session.user.email, companyId: user.companyId };
}

/** A payer taps a link on WhatsApp, so the address has to be absolute and must
 *  point at whatever host this request actually arrived on. */
function linkUrl(req: NextRequest, token: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '');
  const origin = configured && /^https?:\/\//i.test(configured) ? configured : new URL(req.url).origin;
  return `${origin}/pay/${token}`;
}

function failure(error: unknown) {
  if (error instanceof PaymentLinkError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error('Error handling payment link:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

/** GET ?invoiceId=… for one invoice, or no parameter for the confirm queue. */
export async function GET(req: NextRequest) {
  try {
    const user = await caller(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoiceId = new URL(req.url).searchParams.get('invoiceId');
    if (!invoiceId) {
      const claims = await pendingPaymentClaims(user.companyId);
      return NextResponse.json({ claims });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, companyId: user.companyId },
      select: { id: true, invoiceNumber: true, status: true, total: true, totalAmount: true, paidAmount: true, customerName: true },
    });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const [links, company] = await Promise.all([
      paymentLinksForInvoices(user.companyId, [invoice.id]),
      prisma.company.findUnique({
        where: { id: user.companyId },
        select: { upiId: true, upiPayeeName: true, name: true },
      }),
    ]);

    return NextResponse.json({
      invoice,
      due: amountDue(invoice),
      links,
      // The UI needs this to say "add your UPI id first" instead of failing on
      // the share button, which is the difference between a confused owner and
      // an owner who thinks the product is broken.
      upi: {
        configured: Boolean(company?.upiId),
        vpa: company?.upiId ?? null,
        payeeName: company?.upiPayeeName ?? company?.name ?? null,
      },
    });
  } catch (error) {
    return failure(error);
  }
}

/** POST { invoiceId, amount?, label?, notes?, expiresInDays? } - create or reuse. */
export async function POST(req: NextRequest) {
  try {
    const user = await caller(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const invoiceId = String(body.invoiceId ?? '').trim();
    if (!invoiceId) return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });

    const { link, reused } = await createPaymentLink({
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      invoiceId,
      amount: body.amount === undefined || body.amount === null || body.amount === '' ? null : Number(body.amount),
      label: body.label ?? null,
      notes: body.notes ?? null,
      expiresInDays: body.expiresInDays === undefined || body.expiresInDays === null || body.expiresInDays === ''
        ? null
        : Number(body.expiresInDays),
    });

    return NextResponse.json({
      link: {
        id: link.id,
        token: link.token,
        amount: link.amount,
        label: link.label,
        status: link.status,
        expiresAt: link.expiresAt,
        claimedAt: link.claimedAt,
        payerRef: link.payerRef,
      },
      url: linkUrl(req, link.token),
      reused,
    });
  } catch (error) {
    return failure(error);
  }
}

/** DELETE ?id=… - stop a link from being usable. */
export async function DELETE(req: NextRequest) {
  try {
    const user = await caller(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Payment link ID is required' }, { status: 400 });

    const link = await revokePaymentLink({
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      linkId: id,
    });
    return NextResponse.json({ link: { id: link.id, status: link.status } });
  } catch (error) {
    return failure(error);
  }
}
