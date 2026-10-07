import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const invoices = await prisma.invoice.findMany({
      where: { companyId: user.companyId, status: { in: ['sent', 'paid', 'overdue'] } },
      select: { id: true, invoiceNumber: true, totalAmount: true, status: true, createdAt: true, customerName: true },
    });
    const expenses = await prisma.expense.findMany({
      where: { companyId: user.companyId },
      select: { id: true, amount: true, category: true, date: true, description: true },
    });

    return NextResponse.json({ invoices, expenses });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch daybook' }, { status: 500 });
  }
}
