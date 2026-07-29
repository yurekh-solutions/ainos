import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Subscription, { AppKey } from '@/models/Subscription';
import User from '@/models/User';
import {
  APPS,
  ALL_APP_KEYS,
  ONE_BUNDLE,
  PAYMENT_DETAILS,
  priceForSelection,
} from '@/lib/billing';

// GET /api/billing — current subscription + app catalog
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    const appsList = Object.values(APPS).map((a) => ({
      key: a.key,
      name: a.name,
      tagline: a.tagline,
      priceInr: a.priceInr,
      features: a.features,
    }));
    const bundle = {
      key: ONE_BUNDLE.key,
      name: ONE_BUNDLE.name,
      tagline: ONE_BUNDLE.tagline,
      priceInr: ONE_BUNDLE.priceInr,
      apps: ONE_BUNDLE.apps,
    };

    if (!user?.companyId) {
      return NextResponse.json({ subscription: null, apps: appsList, bundle });
    }

    const sub = await Subscription.findOne({ companyId: user.companyId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      subscription: sub
        ? {
            plan: sub.plan || null,
            apps: sub.apps || [],
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            trialEndsAt: sub.trialEndsAt,
          }
        : null,
      apps: appsList,
      bundle,
    });
  } catch (error) {
    console.error('Error fetching billing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/billing — choose the One bundle or individual apps, get bank transfer details
// body: { plan: 'one' } | { apps: AppKey[] }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const wantsOne = body?.plan === 'one';
    const pickedApps: AppKey[] = wantsOne
      ? []
      : [...new Set((Array.isArray(body?.apps) ? body.apps : []) as AppKey[])].filter(
          (k) => ALL_APP_KEYS.includes(k)
        );

    if (!wantsOne && pickedApps.length === 0) {
      return NextResponse.json(
        { error: 'Choose AINOS One or at least one app' },
        { status: 400 }
      );
    }

    const selection = wantsOne ? { plan: 'one' as const } : { apps: pickedApps };
    const amountInr = priceForSelection(selection);
    const oneIsCheaper = !wantsOne && amountInr >= ONE_BUNDLE.priceInr;

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
    const pendingFields = wantsOne
      ? { plan: 'one', apps: undefined, status: 'pending' }
      : { plan: undefined, apps: pickedApps, status: 'pending' };
    if (existing && existing.status !== 'active') {
      Object.assign(existing, pendingFields);
      await existing.save();
    } else if (!existing) {
      await Subscription.create({
        companyId: user.companyId,
        userId: String(user._id),
        ...pendingFields,
      });
    }

    const label = wantsOne
      ? ONE_BUNDLE.name
      : pickedApps.map((k) => APPS[k].name).join(', ');
    const message =
      `Hi, I want to activate ${label} (Rs.${amountInr}/month). ` +
      `My registered email: ${session.user.email}. I am making the bank transfer now.`;
    const whatsappUrl = `https://wa.me/${PAYMENT_DETAILS.whatsapp}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({
      plan: wantsOne ? 'one' : null,
      apps: pickedApps,
      label,
      amountInr,
      oneIsCheaper,
      payment: PAYMENT_DETAILS,
      whatsappUrl,
    });
  } catch (error) {
    console.error('Error creating billing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
