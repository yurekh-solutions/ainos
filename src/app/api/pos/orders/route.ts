import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { companyId: user.companyId };
    if (sessionId) where.sessionId = sessionId;
    if (status) where.status = status;

    const orders = await prisma.pOSOrder.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(orders);
  } catch (e) {
    console.error('GET /api/pos/orders error:', e);
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
    const count = await prisma.pOSOrder.count({ where: { companyId: user.companyId } });
    const orderNumber = `POS-${String(count + 1).padStart(5, '0')}`;

    const order = await prisma.pOSOrder.create({
      data: {
        orderNumber,
        items: body.items || [],
        subtotal: body.subtotal || 0,
        tax: body.tax || 0,
        discount: body.discount || 0,
        total: body.total || 0,
        status: body.status || 'completed',
        paymentMethod: body.paymentMethod || 'cash',
        amountPaid: body.amountPaid || body.total || 0,
        changeAmount: body.changeAmount || 0,
        customerName: body.customerName || '',
        notes: body.notes || '',
        sessionId: body.sessionId || null,
        companyId: user.companyId,
      },
    });

    // Update session totals
    if (body.sessionId) {
      const sessionOrders = await prisma.pOSOrder.findMany({ where: { sessionId: body.sessionId } });
      const totalSales = sessionOrders.reduce((a, o) => a + (o.total || 0), 0);
      await prisma.pOSSession.update({
        where: { id: body.sessionId },
        data: { totalSales, totalOrders: sessionOrders.length },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    console.error('POST /api/pos/orders error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const existing = await prisma.pOSOrder.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const order = await prisma.pOSOrder.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.notes && { notes: body.notes }),
      },
    });
    return NextResponse.json(order);
  } catch (e) {
    console.error('PUT /api/pos/orders error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
