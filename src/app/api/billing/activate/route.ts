import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { PLANS, activateSubscription } from '@/lib/billing';
import { PlanKey } from '@/models/Subscription';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// POST /api/billing/activate — admin-only: activate a plan after verifying payment
// body: { customerEmail, plan, months? }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const customerEmail = String(body?.customerEmail || '').trim().toLowerCase();
    const planKey = body?.plan as PlanKey;
    const months = Number(body?.months) || 1;

    if (!customerEmail || !PLANS[planKey]) {
      return NextResponse.json(
        { error: 'customerEmail and valid plan are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const customer = await User.findOne({ email: customerEmail });
    if (!customer?.companyId) {
      return NextResponse.json(
        { error: 'No user with a company found for that email' },
        { status: 404 }
      );
    }

    const sub = await activateSubscription(customer.companyId, planKey, months);

    return NextResponse.json({
      activated: true,
      companyId: customer.companyId,
      plan: sub.plan,
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  } catch (error) {
    console.error('Error activating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
