import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';
import { settleCreditPurchase } from '@/lib/credit-purchases';
import { settleToolSubscriptionsByOrder } from '@/lib/tool-subscriptions';
import { settleWorkspaceSubscriptionsByOrder } from '@/lib/workspace-subscriptions';

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

    // A single captured order may belong to a credit top-up OR a consolidated
    // tool/workspace subscription invoice. Attempt each settlement path by order
    // id (all are idempotent + keyed by order id, never amount) so the webhook
    // is the authoritative grant even if the browser verify call never lands.
    const credit = await settleCreditPurchase(orderId, payment.id, payment.amount);

    let toolActivated = 0;
    const toolPending = await prisma.toolSubscription.findFirst({
      where: { orderId, status: 'pending' },
      select: { companyId: true },
    });
    if (toolPending) {
      toolActivated = (await settleToolSubscriptionsByOrder(toolPending.companyId, orderId, payment.id)).activated;
    }

    let workspacesActivated = 0;
    const wsPending = await prisma.workspaceSubscription.findFirst({
      where: { orderId, status: 'pending' },
      select: { companyId: true },
    });
    if (wsPending) {
      workspacesActivated = (await settleWorkspaceSubscriptionsByOrder(wsPending.companyId, orderId, payment.id)).activated;
    }

    // Nothing this handler knows how to settle for that order → log for manual
    // reconciliation but return 2xx so Razorpay stops retrying a delivery we can
    // never settle locally.
    if (!credit.ok && toolActivated === 0 && workspacesActivated === 0) {
      console.error(`[razorpay-webhook] ${credit.reason} for order ${orderId} payment ${payment.id}`);
      return NextResponse.json({ status: 'ignored', reason: credit.reason });
    }

    return NextResponse.json({
      status: 'ok',
      credited: credit.ok ? credit.credits : 0,
      alreadyPaid: credit.ok ? credit.alreadyPaid : false,
      balance: credit.ok ? credit.balance : undefined,
      toolActivated,
      workspacesActivated,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
