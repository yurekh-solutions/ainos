import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json([]);
    }

    const challans = await prisma.deliveryChallan.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(challans);
  } catch (error) {
    console.error('Error fetching challans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await req.json();

    if (!body.customerName || !body.items?.length) {
      return NextResponse.json({ error: 'Customer name and items required' }, { status: 400 });
    }

    const supplyType = body.supplyType || 'intra';

    const items = body.items.map((item: Record<string, unknown>, idx: number) => {
      const itemRate = Number(item.gstRate ?? 18);
      const qty = Number(item.quantity ?? 1);
      const price = Number(item.price ?? 0);
      const itemSubtotal = price * qty;
      const itemTax = itemRate > 0 ? (itemSubtotal * itemRate) / 100 : 0;

      return {
        productName: item.productName || 'Item',
        description: item.description || '',
        hsnCode: item.hsnCode || null,
        quantity: qty,
        price,
        gstRate: itemRate,
        taxAmount: itemTax,
        total: itemSubtotal + itemTax,
      };
    });

    const subtotal = items.reduce((s: number, i: Record<string, unknown>) =>
      s + (Number(i.price) * Number(i.quantity)), 0);
    const taxTotal = items.reduce((s: number, i: Record<string, unknown>) =>
      s + Number(i.taxAmount), 0);

    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
    if (supplyType === 'intra') {
      cgstAmount = taxTotal / 2;
      sgstAmount = taxTotal / 2;
    } else {
      igstAmount = taxTotal;
    }

    const totalAmount = subtotal + taxTotal;

    const count = await prisma.deliveryChallan.count({
      where: { companyId: user.companyId },
    });
    const challanNumber = `DC-${String(count + 1).padStart(4, '0')}-${new Date().getFullYear()}`;

    const challan = await prisma.deliveryChallan.create({
      data: {
        companyId: user.companyId,
        challanNumber,
        customerId: body.customerId || null,
        customerName: body.customerName,
        customerAddress: body.customerAddress || null,
        customerGst: body.customerGst || null,
        customerState: body.customerState || null,
        items,
        subtotal,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxTotal,
        totalAmount,
        status: body.status || 'open',
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : new Date(),
        vehicleNo: body.vehicleNo || null,
        transportDocNo: body.transportDocNo || null,
        notes: body.notes || null,
        supplyType,
      },
    });

    return NextResponse.json(challan, { status: 201 });
  } catch (error) {
    console.error('Error creating challan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Challan ID required' }, { status: 400 });
    }

    const existing = await prisma.deliveryChallan.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Challan not found' }, { status: 404 });
    }

    const challan = await prisma.deliveryChallan.update({ where: { id }, data });
    return NextResponse.json(challan);
  } catch (error) {
    console.error('Error updating challan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Challan ID required' }, { status: 400 });
    }

    await prisma.deliveryChallan.delete({
      where: { id, companyId: user.companyId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting challan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
