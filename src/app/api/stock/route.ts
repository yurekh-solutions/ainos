import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const items = await prisma.stockItem.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });

    const lowStockItems = items.filter(i => i.quantity <= i.minStock);

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

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const item = await prisma.stockItem.create({
      data: { ...body, companyId: user.companyId }
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating stock item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
