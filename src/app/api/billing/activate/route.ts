import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { ALL_APP_KEYS, activateSubscription } from '@/lib/billing';
import { AppKey } from '@/models/Subscription';

// yurekhsolutions@gmail.com is always an admin; ADMIN_EMAILS env can add more
const DEFAULT_ADMIN = 'yurekhsolutions@gmail.com';
const ADMIN_EMAILS = [
  DEFAULT_ADMIN,
  ...(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
];

// POST /api/billing/activate — admin-only: activate after verifying payment
// body: { customerEmail, plan: 'one', months? } | { customerEmail, apps: AppKey[], months? }
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
    const wantsOne = body?.plan === 'one';
    const apps: AppKey[] = wantsOne
      ? []
      : [...new Set((Array.isArray(body?.apps) ? body.apps : []) as AppKey[])].filter(
          (k) => ALL_APP_KEYS.includes(k)
        );
    const months = Number(body?.months) || 1;

    if (!customerEmail || (!wantsOne && apps.length === 0)) {
      return NextResponse.json(
        { error: "customerEmail and either plan:'one' or apps[] are required" },
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

    const sub = await activateSubscription(
      customer.companyId,
      wantsOne ? { plan: 'one' } : { apps },
      months
    );

    return NextResponse.json({
      activated: true,
      companyId: customer.companyId,
      plan: sub.plan || null,
      apps: sub.apps || [],
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  } catch (error) {
    console.error('Error activating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
