import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createOrder, CREDIT_PACKS } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { creditPackId } = body;

    const pack = CREDIT_PACKS.find(p => p.credits === creditPackId);
    if (!pack) {
      return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const receipt = `credits_${user.companyId}_${Date.now()}`;
    const order = await createOrder(pack.price, receipt);

    return NextResponse.json({
      orderId: order.id,
      amount: pack.price,
      credits: pack.credits,
      keyId: process.env.RAZORPAY_KEY_ID,
      companyId: user.companyId
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(CREDIT_PACKS);
}
