import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { settleWorkspaceSubscriptionsByOrder } from '@/lib/workspace-subscriptions';

/**
 * POST /api/billing/workspaces/verify — browser confirms right after Razorpay
 * checkout. Settles the consolidated order by id (never by amount) and
 * idempotently flips each pending WorkspaceSubscription to active, then re-syncs
 * Company.enabledVerticals so the entitlement engine opens those workspaces.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    // The order must belong to this company (some pending row carries it).
    const owned = await prisma.workspaceSubscription.findFirst({
      where: { companyId: user.companyId, orderId: razorpay_order_id },
    });
    if (!owned) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const result = await settleWorkspaceSubscriptionsByOrder(user.companyId, razorpay_order_id, razorpay_payment_id);
    return NextResponse.json({ success: true, activated: result.activated });
  } catch (error) {
    console.error('Error verifying workspace subscription payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
