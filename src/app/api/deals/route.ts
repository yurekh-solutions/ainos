import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Deal from '@/models/Deal';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');
    const query: Record<string, unknown> = { createdBy: session.user.id || session.user.email };
    if (stage) query.stage = stage;
    const deals = await Deal.find(query).sort({ createdAt: -1 });
    const stats = {
      total: deals.length,
      byStage: deals.reduce((acc: Record<string, number>, d) => { acc[d.stage] = (acc[d.stage] || 0) + 1; return acc; }, {}),
      totalValue: deals.reduce((sum, d) => sum + (d.value || 0), 0),
      winRate: deals.length ? Math.round((deals.filter(d => d.stage === 'won').length / deals.length) * 100) : 0,
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
    await connectDB();
    const body = await req.json();
    const deal = await Deal.create({ ...body, createdBy: session.user.id || session.user.email });
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
