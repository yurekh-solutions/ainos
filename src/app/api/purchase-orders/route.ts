import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const where: Record<string, unknown> = {};
    if (user?.companyId) where.companyId = user.companyId;
    else where.createdBy = session.user.email;

    const orders = await prisma.purchaseOrder.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const body = await req.json();

    // Auto-generate PO number (collision-safe: poNumber is globally unique)
    const poYear = new Date().getFullYear();
    let poN = (await prisma.purchaseOrder.count()) + 1;
    let poNumber = body.poNumber || `PO-${String(poN).padStart(4, '0')}-${poYear}`;
    while (await prisma.purchaseOrder.findUnique({ where: { poNumber } })) {
      poN += 1;
      poNumber = `PO-${String(poN).padStart(4, '0')}-${poYear}`;
    }

    const order = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorName: body.vendorName,
        vendorId: body.vendorId,
        items: body.items,
        subtotal: body.subtotal,
        tax: body.tax,
        discount: body.discount || 0,
        total: body.total,
        status: body.status || 'draft',
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
        notes: body.notes,
        companyId: user?.companyId || null,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
