import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const invoices = await prisma.recurringInvoice.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recurring invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const body = await req.json();
    const startDate = new Date(body.startDate);
    const nextRunDate = new Date(startDate);

    const invoice = await prisma.recurringInvoice.create({
      data: {
        customerId: body.customerId || null,
        customerName: body.customerName || null,
        items: body.items || null,
        frequency: body.frequency || 'monthly',
        startDate,
        endDate: body.endDate ? new Date(body.endDate) : null,
        nextRunDate,
        status: 'active',
        notes: body.notes || null,
        companyId: user.companyId,
      },
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create recurring invoice' }, { status: 500 });
  }
}
