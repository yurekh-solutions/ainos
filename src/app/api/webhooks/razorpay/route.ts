import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { settleCreditPurchase } from '@/lib/credit-purchases';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event !== 'payment.captured') {
      return NextResponse.json({ status: 'ignored', event: event.event });
    }

    const payment = event.payload?.payment?.entity || {};
    const orderId = payment.order_id;
    if (!orderId) {
      console.error('[razorpay-webhook] payment without order_id', payment.id);
      return NextResponse.json({ status: 'ignored', reason: 'missing_order' });
    }

    const result = await settleCreditPurchase(orderId, payment.id, payment.amount);

    if (!result.ok) {
      // A 2xx stops Razorpay retrying a delivery we can never settle; the log
      // line is what an operator needs to reconcile by hand.
      console.error(`[razorpay-webhook] ${result.reason} for order ${orderId} payment ${payment.id}`);
      return NextResponse.json({ status: 'ignored', reason: result.reason });
    }

    return NextResponse.json({
      status: 'ok',
      credited: result.credits,
      alreadyPaid: result.alreadyPaid,
      balance: result.balance,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
