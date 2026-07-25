import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import {
  PLANS, PlanId, getActivePlan, getUsage, razorpayConfigured,
  createRazorpayOrder, verifyRazorpaySignature, activatePlan,
} from '@/lib/billing';

// GET → current plan, usage & available plans
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id || session.user.email;
    const [{ plan, periodEnd }, usage] = await Promise.all([getActivePlan(userId), getUsage(userId)]);
    return NextResponse.json({
      plan,
      periodEnd,
      usage,
      limits: PLANS[plan].limits,
      plans: Object.values(PLANS),
      paymentsEnabled: razorpayConfigured(),
      keyId: process.env.RAZORPAY_KEY_ID || null,
    });
  } catch (error) {
    console.error('Error fetching billing status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST { action: 'createOrder', plan } → Razorpay order for checkout
// POST { action: 'verify', plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } → activate plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id || session.user.email;
    const body = await req.json();
    const plan = body.plan as PlanId;
    if (!['starter', 'growth'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (body.action === 'createOrder') {
      if (!razorpayConfigured()) {
        return NextResponse.json({ error: 'Payments are being activated. Contact the Yurekh team to upgrade manually.', setupRequired: true }, { status: 503 });
      }
      const order = await createRazorpayOrder(PLANS[plan].priceInr, `ainos_${plan}_${Date.now()}`);
      if (!order) return NextResponse.json({ error: 'Could not create payment order. Try again.' }, { status: 502 });
      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        plan,
      });
    }

    if (body.action === 'verify') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
      }
      if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }
      await activatePlan(userId, plan, razorpay_order_id, razorpay_payment_id);
      return NextResponse.json({ success: true, plan });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing billing action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
