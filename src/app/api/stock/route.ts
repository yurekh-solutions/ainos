import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import StockItem from '@/models/StockItem';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const lowStock = searchParams.get('lowStock');
    const query: Record<string, unknown> = { createdBy: session.user.id || session.user.email };
    if (lowStock === 'true') query.quantity = { $lte: { $ref: 'reorderLevel' } };
    const items = await StockItem.find(query).sort({ createdAt: -1 });
    const lowStockItems = items.filter(i => i.quantity <= i.reorderLevel);
    return NextResponse.json({ items, lowStockItems, lowStockCount: lowStockItems.length });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const item = await StockItem.create({ ...body, createdBy: session.user.id || session.user.email });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating stock item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
