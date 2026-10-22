import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');

    const where: Record<string, unknown> = {};
    // Use email-based scoping for deals (matches original pattern)
    where.OR = [
      { ownerId: session.user.id || session.user.email },
      { companyId: null }
    ];

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user?.companyId) {
      where.companyId = user.companyId;
    }

    if (stage) where.stage = stage;

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      total: deals.length,
      byStage: deals.reduce((acc: Record<string, number>, d: { stage: string }) => { acc[d.stage] = (acc[d.stage] || 0) + 1; return acc; }, {}),
      totalValue: deals.reduce((sum: number, d: { value?: number | null }) => sum + (d.value || 0), 0),
      winRate: deals.length ? Math.round((deals.filter((d: { stage: string }) => d.stage === 'won').length / deals.length) * 100) : 0,
    };

    return NextResponse.json({ deals, stats });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    const deal = await prisma.deal.create({
      data: {
        title: body.title || 'Untitled Deal',
        value: body.value !== undefined && body.value !== null && body.value !== '' ? Number(body.value) : null,
        currency: body.currency || 'INR',
        stage: body.stage || 'new',
        probability: body.probability !== undefined && body.probability !== '' ? Number(body.probability) : 0,
        expectedClose: (body.expectedClose || body.closeDate) ? new Date(body.expectedClose || body.closeDate) : null,
        source: body.source || null,
        notes: [body.notes || null, body.contact ? `Contact: ${body.contact}` : null].filter(Boolean).join(' \u00b7 ') || null,
        companyId: user?.companyId || null,
        ownerId: session.user.id || session.user.email
      }
    });
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
