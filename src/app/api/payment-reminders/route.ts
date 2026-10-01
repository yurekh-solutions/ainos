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
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {
      companyId: user.companyId,
      status: { not: 'paid' },
    };

    if (status === 'overdue') {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ['paid', 'cancelled'] };
    } else if (status === 'upcoming') {
      where.dueDate = { gte: new Date() };
      where.status = { notIn: ['paid', 'cancelled'] };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        customerEmail: true,
        totalAmount: true,
        paidAmount: true,
        dueDate: true,
        status: true,
        createdAt: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const reminders = invoices.map(inv => {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const isOverdue = dueDate ? dueDate < new Date() : false;
      const daysOverdue = dueDate
        ? Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const pendingAmount = (inv.totalAmount || 0) - (inv.paidAmount || 0);

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        customerEmail: inv.customerEmail,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount || 0,
        pendingAmount,
        dueDate: inv.dueDate,
        status: inv.status,
        isOverdue,
        daysOverdue: isOverdue ? daysOverdue : 0,
        whatsappLink: inv.customerEmail
          ? `https://wa.me/?text=${encodeURIComponent(
              `Reminder: Invoice ${inv.invoiceNumber} of ₹${pendingAmount.toLocaleString('en-IN')} is ${isOverdue ? `overdue by ${daysOverdue} days` : `due on ${dueDate?.toLocaleDateString('en-IN')}`}. Please make the payment at the earliest.`
            )}`
          : null,
      };
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Mark reminder as sent / update paid amount
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
    const { id, status, paidAmount } = body;

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
      if (paidAmount >= 0) {
        const inv = await prisma.invoice.findUnique({ where: { id } });
        if (inv && paidAmount >= (inv.totalAmount || 0)) {
          updateData.status = 'paid';
          updateData.paidDate = new Date();
        }
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id, companyId: user.companyId },
      data: updateData,
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
