import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const orders = await prisma.salesOrder.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching sales orders:', error);
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
    const orderNumber = body.orderNumber || `SO-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const order = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId: body.customerId || null,
        customerName: body.customerName || body.customer || 'Customer',
        items: body.items || [],
        subtotal: Number(body.subtotal ?? 0) || 0,
        tax: Number(body.tax ?? 0) || 0,
        discount: Number(body.discount ?? 0) || 0,
        total: Number(body.total ?? body.totalAmount ?? 0) || 0,
        status: body.status || 'pending',
        orderDate: body.orderDate ? new Date(body.orderDate) : null,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        notes: body.notes || null,
        companyId: user.companyId,
      }
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating sales order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const existing = await prisma.salesOrder.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (rest.status !== undefined) data.status = rest.status;
    if (rest.items !== undefined) data.items = rest.items;
    if (rest.notes !== undefined) data.notes = rest.notes;
    if (rest.customerName !== undefined) data.customerName = rest.customerName;
    if (rest.deliveryDate !== undefined) data.deliveryDate = rest.deliveryDate ? new Date(rest.deliveryDate) : null;
    if (rest.subtotal !== undefined) data.subtotal = Number(rest.subtotal);
    if (rest.tax !== undefined) data.tax = Number(rest.tax);
    if (rest.discount !== undefined) data.discount = Number(rest.discount);
    if (rest.total !== undefined || rest.totalAmount !== undefined) data.total = Number(rest.total ?? rest.totalAmount);

    const order = await prisma.salesOrder.update({ where: { id }, data });
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating sales order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const existing = await prisma.salesOrder.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.salesOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sales order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
