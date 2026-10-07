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
    const reportType = searchParams.get('type') || 'profit-loss';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { companyId: user.companyId };
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    if (reportType === 'profit-loss') {
      const revenue = await prisma.invoice.findMany({ where: { ...where, status: { in: ['sent', 'paid'] } } });
      const totalRevenue = revenue.reduce((s, i) => s + (i.totalAmount || 0), 0);
      const totalProfit = revenue.reduce((s, i) => s + (i.profitAmount || 0), 0);
      const expenses = await prisma.expense.findMany({ where });
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      return NextResponse.json({ type: 'Profit & Loss', totalRevenue, totalExpenses, netProfit: totalProfit - totalExpenses, revenue, expenses });
    }

    if (reportType === 'trial-balance') {
      const accounts = await prisma.account.findMany({ where: { companyId: user.companyId } });
      const totalDebit = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
      const totalCredit = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);
      return NextResponse.json({ type: 'Trial Balance', accounts, totalDebit, totalCredit });
    }

    if (reportType === 'cash-flow') {
      const invoices = await prisma.invoice.findMany({ where: { ...where, status: 'paid' } });
      const cashIn = invoices.reduce((s, i) => s + (i.paidAmount || i.totalAmount || 0), 0);
      const expenses = await prisma.expense.findMany({ where });
      const cashOut = expenses.reduce((s, e) => s + e.amount, 0);
      return NextResponse.json({ type: 'Cash Flow', cashIn, cashOut, netCashFlow: cashIn - cashOut });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
