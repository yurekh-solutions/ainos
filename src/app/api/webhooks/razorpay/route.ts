import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addCredits } from '@/lib/credits';
import { verifyWebhookSignature, CREDIT_PACKS } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle payment captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const receipt = payment.receipt; // credits_{companyId}_{timestamp}

      // Extract companyId from receipt
      const parts = receipt.split('_');
      const companyId = parts[1];

      if (!companyId) {
        return NextResponse.json({ error: 'Invalid receipt' }, { status: 400 });
      }

      // Find the credit pack from amount
      const amountInRupees = payment.amount / 100;
      const pack = CREDIT_PACKS.find(p => p.price === amountInRupees);

      if (pack) {
        await addCredits(companyId, pack.credits, `Payment: ${payment.id}`);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
