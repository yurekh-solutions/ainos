import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'gstr1';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { companyId: user.companyId };
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    if (type === 'gstr1') {
      const invoices = await prisma.invoice.findMany({
        where: { ...where, status: { in: ['sent', 'paid'] } },
        select: {
          invoiceNumber: true, invoiceDate: true, customerName: true,
          customerGstNumber: true, totalAmount: true, cgstAmount: true,
          sgstAmount: true, igstAmount: true,
        },
      });
      return NextResponse.json({ type: 'GSTR-1', invoices, totalTax: invoices.reduce((s, i) => s + (i.cgstAmount || 0) + (i.sgstAmount || 0) + (i.igstAmount || 0), 0) });
    }

    if (type === 'gstr3b') {
      const invoices = await prisma.invoice.findMany({ where: { ...where, status: { in: ['sent', 'paid'] } } });
      const totalRevenue = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
      const totalTax = invoices.reduce((s, i) => s + (i.cgstAmount || 0) + (i.sgstAmount || 0) + (i.igstAmount || 0), 0);
      const expenses = await prisma.expense.findMany({ where });
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      return NextResponse.json({ type: 'GSTR-3B', totalRevenue, totalTax, totalExpenses, netTax: totalTax });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate GST report' }, { status: 500 });
  }
}
