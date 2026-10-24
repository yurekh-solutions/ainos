import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDate = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

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

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || new URL(req.url).searchParams.get('id') || '');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    // Same ownership rule as GET: company-scoped when available, otherwise the unassigned bucket.
    const ownsOrder = user?.companyId ? existing?.companyId === user.companyId : existing?.companyId === null;
    if (!existing || !ownsOrder) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });

    // Explicit whitelist: poNumber stays immutable, only these columns can be written.
    const data: Prisma.PurchaseOrderUpdateInput = {};

    if (body.vendorId !== undefined) data.vendorId = body.vendorId ? String(body.vendorId) : null;
    if (body.vendorName !== undefined) data.vendorName = body.vendorName ? String(body.vendorName).trim() : null;
    if (body.status !== undefined) data.status = String(body.status);
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;
    if (body.items !== undefined) {
      data.items = body.items === null ? Prisma.JsonNull : (body.items as unknown as Prisma.InputJsonValue);
    }

    if (body.subtotal !== undefined) data.subtotal = toNumber(body.subtotal);
    if (body.tax !== undefined) data.tax = toNumber(body.tax);
    if (body.discount !== undefined) data.discount = toNumber(body.discount);
    if (body.total !== undefined || body.totalAmount !== undefined) {
      data.total = toNumber(body.total ?? body.totalAmount);
    }

    if (body.orderDate !== undefined) data.orderDate = toDate(body.orderDate);
    // expectedDelivery is the client-facing name for the expectedDate column.
    if (body.expectedDate !== undefined || body.expectedDelivery !== undefined) {
      data.expectedDate = toDate(body.expectedDate ?? body.expectedDelivery);
    }

    const order = await prisma.purchaseOrder.update({ where: { id }, data });
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    const ownsOrder = user?.companyId ? existing?.companyId === user.companyId : existing?.companyId === null;
    if (!existing || !ownsOrder) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });

    await prisma.purchaseOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
