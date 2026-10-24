import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { settleCreditPurchase } from '@/lib/credit-purchases';

/**
 * Called by the browser straight after Razorpay checkout succeeds, so the buyer
 * sees the new balance without waiting for the webhook. Whichever of the two
 * arrives first grants the credits; the other is a no-op.
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

    const purchase = await prisma.creditPurchase.findUnique({ where: { orderId: razorpay_order_id } });
    if (!purchase || purchase.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const result = await settleCreditPurchase(razorpay_order_id, razorpay_payment_id);
    if (!result.ok) {
      console.error(`[billing/verify] ${result.reason} for order ${razorpay_order_id}`);
      return NextResponse.json({ error: 'Payment could not be settled' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      credits: result.credits,
      alreadyPaid: result.alreadyPaid,
      balance: result.balance,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
