import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const stores = await prisma.onlineStore.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { products: true, orders: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
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
    const store = await prisma.onlineStore.create({
      data: {
        name: body.name || 'New Store',
        description: body.description || null,
        currency: body.currency || 'INR',
        domain: body.domain || null,
        status: body.status || 'active',
        companyId: user.companyId,
      }
    });
    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
