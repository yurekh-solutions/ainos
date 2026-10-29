import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 90-day cash-flow projection: current cash + scheduled receivables − the
// company's average monthly burn. Deterministic (no provider call).

const DAY = 24 * 60 * 60 * 1000;
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });
    const companyId = user.companyId;

    const today = new Date();
    const horizonEnd = new Date(today.getTime() + 90 * DAY);

    // Opening cash from the ledger's Cash & Bank account (code 1000).
    const cashAccount = await prisma.account.findFirst({ where: { companyId, code: '1000' }, select: { balance: true } });
    const startingCash = round2(cashAccount?.balance || 0);

    // Scheduled inflows: outstanding receivables bucketed by due date.
    const invoices = await prisma.invoice.findMany({
      where: { companyId, status: { in: ['sent', 'paid', 'overdue', 'partial'] } },
      select: { totalAmount: true, paidAmount: true, dueDate: true },
    });

    // Historical burn from approved/reimbursed expenses over the last ~6 months.
    const sixMonthsAgo = new Date(today.getTime() - 182 * DAY);
    const expenses = await prisma.expense.findMany({
      where: { companyId, status: { in: ['approved', 'reimbursed'] }, date: { gte: sixMonthsAgo } },
      select: { amount: true, taxAmount: true, date: true },
    });
    const monthsObserved = Math.max(1, expenses.length ? 6 : 1);
    const totalSpend = expenses.reduce((s, e) => s + (e.amount || 0) + (e.taxAmount || 0), 0);
    const monthlyBurn = round2(totalSpend / monthsObserved);

    const WEEKS = 13;
    const points = Array.from({ length: WEEKS }, (_, i) => {
      const start = new Date(today.getTime() + i * 7 * DAY);
      const end = new Date(start.getTime() + 7 * DAY);
      const inflow = invoices.reduce((s, inv) => {
        const remaining = round2((inv.totalAmount || 0) - (inv.paidAmount || 0));
        if (remaining <= 0) return s;
        const due = inv.dueDate ? new Date(inv.dueDate) : start;
        // Overdue invoices are assumed to land in the first bucket.
        const scheduled = due < today ? start : due;
        return scheduled >= start && scheduled < end ? round2(s + remaining) : s;
      }, 0);
      const outflow = round2(monthlyBurn / 4.345); // ~weekly share of monthly burn
      return {
        week: i + 1,
        weekStart: start.toISOString().slice(0, 10),
        inflow,
        outflow,
        net: round2(inflow - outflow),
        closingCash: 0,
      };
    });

    let running = startingCash;
    let cumulative = 0;
    let runwayDays: number | null = null;
    for (const p of points) {
      cumulative = round2(cumulative + p.net);
      running = round2(startingCash + cumulative);
      p.closingCash = running;
      if (runwayDays === null && running < 0) {
        runwayDays = (p.week - 1) * 7;
      }
    }

    return NextResponse.json({
      currency: 'INR',
      startingCash,
      monthlyBurn,
      expectedInflows90: round2(points.reduce((s, p) => s + p.inflow, 0)),
      projectedOutflows90: round2(points.reduce((s, p) => s + p.outflow, 0)),
      projectedCash90: round2(startingCash + cumulative),
      runwayDays,
      horizonStart: today.toISOString().slice(0, 10),
      horizonEnd: horizonEnd.toISOString().slice(0, 10),
      points,
    });
  } catch (error) {
    console.error('Cash forecast error:', error);
    const message = error instanceof Error ? error.message : 'Failed to forecast';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
