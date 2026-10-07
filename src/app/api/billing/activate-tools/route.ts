import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import type { ToolName } from '@/lib/tool-guard';

// Plan definitions with included tools
const PLANS: Record<string, { name: string; amount: number; tools: ToolName[] }> = {
  starter: {
    name: 'Starter Plan',
    amount: 749,
    tools: ['autoBlog', 'invoiceGen', 'crmAccess'],
  },
  growth: {
    name: 'Growth Plan',
    amount: 2499,
    tools: ['autoBlog', 'invoiceGen', 'crmAccess', 'inventoryMgmt', 'hrPayroll', 'emailMarketing'],
  },
  enterprise: {
    name: 'Enterprise Plan',
    amount: 9999,
    tools: [
      'autoBlog',
      'invoiceGen',
      'crmAccess',
      'inventoryMgmt',
      'hrPayroll',
      'emailMarketing',
      'aiAssistant',
      'websiteGen',
    ],
  },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { paymentId, plan, tools: customTools } = body;

    // Validate plan
    const planConfig = PLANS[plan];
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose: starter, growth, or enterprise' },
        { status: 400 }
      );
    }

    // Use plan tools or custom tools (for flexible billing)
    const toolsToActivate: ToolName[] = customTools || planConfig.tools;

    // Verify payment (Razorpay integration)
    const paymentVerified = await verifyPayment(paymentId, planConfig.amount);

    if (!paymentVerified) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Build company update data
    const toolUpdates: Record<string, boolean> = {};
    toolsToActivate.forEach((tool: string) => {
      toolUpdates[tool] = true;
    });

    // Calculate subscription end date (1 month from now)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Update company: enable tools + set subscription status
    const company = await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        ...toolUpdates,
        subscriptionStatus: 'active',
        subscriptionEndsAt: endDate,
      },
    });

    // Create subscription record
    const subscription = await prisma.subscription.create({
      data: {
        companyId: session.user.companyId,
        userId: session.user.id,
        plan: plan,
        planName: planConfig.name,
        amount: planConfig.amount,
        currency: 'INR',
        status: 'active',
        startDate: new Date(),
        endDate: endDate,
        toolsIncluded: toolsToActivate,
        paymentId: paymentId,
        paymentMethod: 'razorpay',
      },
    });

    // Log tool activations in audit trail
    for (const tool of toolsToActivate) {
      await prisma.toolActivation.create({
        data: {
          companyId: session.user.companyId,
          toolName: tool,
          activated: true,
          activatedBy: session.user.id,
          reason: `subscription_started_${plan}`,
        },
      });
    }

    return NextResponse.json({
      message: 'Tools activated successfully',
      company: {
        id: company.id,
        name: company.name,
        subscriptionStatus: company.subscriptionStatus,
        subscriptionEndsAt: company.subscriptionEndsAt,
        activatedTools: toolsToActivate,
      },
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        planName: subscription.planName,
        status: subscription.status,
        endDate: subscription.endDate,
        toolsIncluded: subscription.toolsIncluded,
      },
    });
  } catch (error) {
    console.error('Activate-tools error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify Razorpay payment
 * In production, this calls Razorpay API to verify the payment signature.
 * For now, returns true if paymentId is present (implement actual verification).
 */
async function verifyPayment(paymentId: string, amount: number): Promise<boolean> {
  if (!paymentId) return false;

  // TODO: Implement actual Razorpay verification
  // const razorpay = new Razorpay({
  //   key_id: process.env.RAZORPAY_KEY_ID!,
  //   key_secret: process.env.RAZORPAY_KEY_SECRET!,
  // });
  // const payment = await razorpay.payments.fetch(paymentId);
  // return payment.status === 'captured' && payment.amount === amount * 100;

  // For development: accept any non-empty paymentId
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Production: implement actual verification
  return paymentId.startsWith('pay_');
}

/**
 * GET endpoint to check current subscription and tool status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        name: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        autoBlog: true,
        invoiceGen: true,
        crmAccess: true,
        inventoryMgmt: true,
        hrPayroll: true,
        emailMarketing: true,
        aiAssistant: true,
        websiteGen: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      company: {
        name: company.name,
        subscriptionStatus: company.subscriptionStatus,
        subscriptionEndsAt: company.subscriptionEndsAt,
      },
      tools: {
        autoBlog: company.autoBlog,
        invoiceGen: company.invoiceGen,
        crmAccess: company.crmAccess,
        inventoryMgmt: company.inventoryMgmt,
        hrPayroll: company.hrPayroll,
        emailMarketing: company.emailMarketing,
        aiAssistant: company.aiAssistant,
        websiteGen: company.websiteGen,
      },
      recentSubscriptions: subscriptions,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
