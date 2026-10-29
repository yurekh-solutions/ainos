import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type AcctType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

interface LedgerAccount {
  code: string;
  name: string;
  type: AcctType;
  debit: number;
  credit: number;
  net: number; // debit - credit
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Aggregates posted ledger lines into per-account debit/credit totals. */
async function loadLedger(companyId: string, startDate?: string, endDate?: string): Promise<LedgerAccount[]> {
  const journalWhere: Record<string, unknown> = { companyId, status: 'posted' };
  if (startDate || endDate) {
    const range: Record<string, Date> = {};
    if (startDate) range.gte = new Date(startDate);
    if (endDate) { const d = new Date(endDate); d.setHours(23, 59, 59, 999); range.lte = d; }
    journalWhere.date = range;
  }

  const entries = await prisma.ledgerEntry.findMany({
    where: { journal: journalWhere },
    include: { account: { select: { code: true, name: true, type: true } } },
  });

  const map = new Map<string, LedgerAccount>();
  for (const e of entries) {
    if (!e.account) continue;
    const key = e.account.code;
    const row = map.get(key) || { code: e.account.code, name: e.account.name, type: e.account.type as AcctType, debit: 0, credit: 0, net: 0 };
    row.debit = round2(row.debit + (e.debit || 0));
    row.credit = round2(row.credit + (e.credit || 0));
    row.net = round2(row.debit - row.credit);
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'profit-loss';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const accounts = await loadLedger(user.companyId, startDate, endDate);
    const by = (t: AcctType) => accounts.filter(a => a.type === t);

    // Net income (income credit less expense debit) — shared by P&L and the
    // Balance Sheet's retained-earnings line so both stay consistent.
    const incomeTotal = round2(by('income').reduce((s, a) => s - a.net, 0));
    const expenseTotal = round2(by('expense').reduce((s, a) => s + a.net, 0));
    const netIncome = round2(incomeTotal - expenseTotal);

    if (reportType === 'profit-loss') {
      return NextResponse.json({
        type: 'Profit & Loss',
        income: by('income').filter(a => a.net !== 0),
        expenses: by('expense').filter(a => a.net !== 0),
        totalRevenue: incomeTotal,
        totalExpenses: expenseTotal,
        netProfit: netIncome,
      });
    }

    if (reportType === 'trial-balance') {
      const rows = accounts.filter(a => a.debit !== 0 || a.credit !== 0).map(a => ({
        code: a.code, name: a.name, type: a.type,
        debit: a.net > 0 ? a.net : 0,
        credit: a.net < 0 ? -a.net : 0,
      }));
      const totalDebit = round2(rows.reduce((s, r) => s + r.debit, 0));
      const totalCredit = round2(rows.reduce((s, r) => s + r.credit, 0));
      return NextResponse.json({ type: 'Trial Balance', rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.5 });
    }

    if (reportType === 'balance-sheet') {
      const assets = by('asset').filter(a => a.net !== 0).map(a => ({ code: a.code, name: a.name, amount: round2(a.net) }));
      const liabilities = by('liability').filter(a => a.net !== 0).map(a => ({ code: a.code, name: a.name, amount: round2(-a.net) }));
      const equity = by('equity').filter(a => a.net !== 0).map(a => ({ code: a.code, name: a.name, amount: round2(-a.net) }));

      const totalAssets = round2(assets.reduce((s, a) => s + a.amount, 0));
      const totalLiabilities = round2(liabilities.reduce((s, a) => s + a.amount, 0));
      const totalEquity = round2(equity.reduce((s, a) => s + a.amount, 0) + netIncome);

      return NextResponse.json({
        type: 'Balance Sheet',
        assets,
        liabilities,
        equity: [...equity, { code: 'RETAINED', name: 'Retained Earnings', amount: netIncome }].filter(e => e.amount !== 0),
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity: round2(totalLiabilities + totalEquity),
        balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.5,
      });
    }

    if (reportType === 'cash-flow') {
      const cash = accounts.find(a => a.code === '1000');
      const cashIn = cash ? cash.debit : 0;
      const cashOut = cash ? cash.credit : 0;
      return NextResponse.json({
        type: 'Cash Flow',
        cashIn: round2(cashIn),
        cashOut: round2(cashOut),
        netCashFlow: round2(cashIn - cashOut),
        closingBalance: cash ? round2(cash.net) : 0,
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
