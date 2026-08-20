import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  APPS,
  ALL_APP_KEYS,
  ONE_BUNDLE,
  PAYMENT_DETAILS,
  priceForSelection,
  getAiUsage,
  type AppKey,
} from '@/lib/billing';

// GET /api/billing — current subscription + app catalog
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
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

    const owner = session.user.id || session.user.email;
    const [sub, ai] = await Promise.all([
      prisma.subscription.findFirst({
        where: { companyId: user.companyId },
        orderBy: { createdAt: 'desc' },
      }),
      getAiUsage(owner),
    ]);

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
      ai,
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

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json(
        { error: 'Complete onboarding before choosing a plan' },
        { status: 400 }
      );
    }

    // Mark intent as pending — activation happens after payment verification
    const existing = await prisma.subscription.findFirst({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing && existing.status !== 'active') {
      const updateData: Record<string, unknown> = { status: 'pending' };
      if (wantsOne) {
        updateData.plan = 'one';
        updateData.apps = null;
      } else {
        updateData.plan = null;
        updateData.apps = pickedApps;
      }
      await prisma.subscription.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else if (!existing) {
      const createData: Record<string, unknown> = {
        companyId: user.companyId,
        userId: user.id,
        status: 'pending',
      };
      if (wantsOne) {
        createData.plan = 'one';
      } else {
        createData.apps = pickedApps;
      }
      await prisma.subscription.create({ data: createData });
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
