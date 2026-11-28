import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import {
  APPS,
  ALL_APP_KEYS,
  ONE_BUNDLE,
  PAYMENT_DETAILS,
  priceForSelection,
  hasLiveAccess,
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

    const label = wantsOne
      ? ONE_BUNDLE.name
      : pickedApps.map((k) => APPS[k].name).join(', ');

    // Record what they asked for. Activation still waits for the transfer to
    // actually land, but the status must never be downgraded to do it: a
    // company inside a live trial that taps "buy" would otherwise lose every
    // app the moment it asked, which punishes exactly the intent we want.
    const existing = await prisma.subscription.findFirst({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });

    const accessContinues = hasLiveAccess(existing);

    // `apps` is a nullable Json column, so clearing it needs Prisma.JsonNull -
    // a plain null is rejected by the client, and leaving the old list behind
    // would show the wrong apps as chosen on every screen that reads this row.
    const selectionData = wantsOne
      ? { plan: 'one' as string | null, apps: Prisma.JsonNull as Prisma.NullableJsonNullValueInput }
      : { plan: null, apps: pickedApps as unknown as Prisma.InputJsonValue };

    let subscriptionId = existing?.id ?? '';
    if (!existing) {
      const created = await prisma.subscription.create({
        data: { companyId: user.companyId, userId: user.id, status: 'pending', ...selectionData },
      });
      subscriptionId = created.id;
    } else {
      // Same row, so nothing about the current period is reset. Only a company
      // with no live access is moved to 'pending'.
      await prisma.subscription.update({
        where: { id: existing.id },
        data: { ...selectionData, ...(accessContinues ? {} : { status: 'pending' }) },
      });
    }

    await recordAudit({
      companyId: user.companyId,
      entity: 'subscription',
      entityId: subscriptionId,
      action: 'plan_requested',
      actor: { id: user.id, email: session.user.email },
      summary: `${label} requested at ₹${amountInr}/month by bank transfer`,
      changes: { plan: wantsOne ? 'one' : null, apps: pickedApps, amountInr, accessContinues },
    });

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
      // Lets the screen promise the right thing: keep working, or start fresh.
      accessContinues,
      payment: PAYMENT_DETAILS,
      whatsappUrl,
    });
  } catch (error) {
    console.error('Error creating billing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
