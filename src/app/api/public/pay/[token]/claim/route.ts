// POST /api/public/pay/[token]/claim
//
// The only write a person without an account can make anywhere in AINOS, so it
// is deliberately weak in power and strong in checks: it records that the payer
// says they paid, and nothing else. The invoice does not move, credits do not
// change, and the amount cannot be edited here - it was frozen when the link
// was created. Rate limiting for this path comes from the /api middleware.

import { NextRequest, NextResponse } from 'next/server';
import { claimPaymentLink, PaymentLinkError } from '@/lib/payment-links';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const body = await req.json().catch(() => ({}));

    const result = await claimPaymentLink({
      token,
      payerName: body.payerName ?? null,
      payerUpiId: body.payerUpiId ?? null,
      payerRef: body.payerRef ?? null,
    });

    return NextResponse.json({
      ok: true,
      invoiceNumber: result.invoiceNumber,
      amount: result.amount,
      // Telling the payer who to notify is what stops them paying again.
      message: 'Recorded. The business will confirm it against their bank and update the invoice.',
    });
  } catch (error) {
    if (error instanceof PaymentLinkError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error recording payment claim:', error);
    return NextResponse.json({ error: 'Could not record the payment. Please try again.' }, { status: 500 });
  }
}
