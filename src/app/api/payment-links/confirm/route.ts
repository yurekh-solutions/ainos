// POST /api/payment-links/confirm
//
// The owner's answer to a payer's claim. `confirm` is the only action in the
// product that moves an invoice to paid through a link, and it only runs after
// the caller has been identified and the link has been re-read inside this
// company. `reject` sends the claim back without touching the books.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { confirmPaymentLink, PaymentLinkError } from '@/lib/payment-links';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const id = String(body.id ?? '').trim();
    const action = body.action === 'reject' ? 'reject' : 'confirm';
    if (!id) return NextResponse.json({ error: 'Payment link ID is required' }, { status: 400 });

    const result = await confirmPaymentLink({
      companyId: user.companyId,
      userId: user.id,
      userEmail: session.user.email,
      linkId: id,
      action,
      bankReference: body.bankReference ?? null,
    });

    return NextResponse.json({
      status: result.link?.status ?? action,
      invoice: {
        id: result.invoice.id,
        invoiceNumber: result.invoice.invoiceNumber,
        status: result.invoice.status,
        paidAmount: result.invoice.paidAmount,
        totalAmount: result.invoice.totalAmount,
      },
    });
  } catch (error) {
    if (error instanceof PaymentLinkError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error confirming payment claim:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
