import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Subscription, { PlanKey } from '@/models/Subscription';
import User from '@/models/User';
import { PLANS, PAYMENT_DETAILS } from '@/lib/billing';

// GET /api/billing — current subscription + plan catalog
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    const plansList = Object.values(PLANS).map((p) => ({
      key: p.key,
      name: p.name,
      priceInr: p.priceInr,
      features: p.features,
    }));

    if (!user?.companyId) {
      return NextResponse.json({ subscription: null, plans: plansList });
    }

    const sub = await Subscription.findOne({ companyId: user.companyId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            trialEndsAt: sub.trialEndsAt,
          }
        : null,
      plans: plansList,
    });
  } catch (error) {
    console.error('Error fetching billing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/billing — choose a plan, get bank transfer details
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const planKey = body?.plan as PlanKey;
    const plan = PLANS[planKey];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user?.companyId) {
      return NextResponse.json(
        { error: 'Complete onboarding before choosing a plan' },
        { status: 400 }
      );
    }

    // Mark intent as pending — activation happens after payment verification
    const existing = await Subscription.findOne({ companyId: user.companyId }).sort({
      createdAt: -1,
    });
    if (existing && existing.status !== 'active') {
      existing.plan = planKey;
      existing.status = 'pending';
      await existing.save();
    } else if (!existing) {
      await Subscription.create({
        companyId: user.companyId,
        userId: String(user._id),
        plan: planKey,
        status: 'pending',
      });
    }

    const message =
      `Hi, I want to activate the AINOS ${plan.name} plan (Rs.${plan.priceInr}/month). ` +
      `My registered email: ${session.user.email}. I am making the bank transfer now.`;
    const whatsappUrl = `https://wa.me/${PAYMENT_DETAILS.whatsapp}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({
      plan: plan.key,
      planName: plan.name,
      amountInr: plan.priceInr,
      payment: PAYMENT_DETAILS,
      whatsappUrl,
    });
  } catch (error) {
    console.error('Error creating billing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
