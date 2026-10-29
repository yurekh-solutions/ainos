import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { postExpense, removeSource } from '@/lib/finance/ledger';

const STATUSES = ['pending', 'approved', 'rejected', 'reimbursed'] as const;
const PAYMENT_METHODS = ['cash', 'upi', 'card', 'bank', 'cheque', 'credit'] as const;

type SessionContext = {
  email: string;
  companyId: string;
  canApprove: boolean;
};

/** Resolves the caller and whether they may approve/reject on behalf of the company. */
async function getContext(req: NextRequest): Promise<SessionContext | NextResponse> {
  const session = await getServerSession(req);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  const role = (user.role || '').toLowerCase();
  const canApprove = user.isAdmin || role === 'owner' || role === 'admin' || adminEmails.includes(user.email.toLowerCase());

  return { email: user.email, companyId: user.companyId, canApprove };
}

function startOfDay(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function endOfDay(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(23, 59, 59, 999);
  return parsed;
}

function monthStart(offset: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function GET(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const { searchParams } = new URL(req.url);

    // Edit screens load a single claim through the same route.
    const singleId = searchParams.get('id');
    if (singleId) {
      const row = await prisma.expense.findFirst({
        where: { id: singleId, companyId: context.companyId },
      });
      if (!row) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
      return NextResponse.json({ expense: row });
    }

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = (searchParams.get('q') || '').trim();

    const where: Record<string, unknown> = { companyId: context.companyId };

    if (from || to) {
      const range: Record<string, Date> = {};
      const lower = from ? startOfDay(from) : null;
      const upper = to ? endOfDay(to) : null;
      if (lower) range.gte = lower;
      if (upper) range.lte = upper;
      if (Object.keys(range).length) where.date = range;
    }

    if (status && status !== 'all') where.status = status;
    if (category && category !== 'all') where.category = category;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rows, pending, recent] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: 500,
      }),
      prisma.expense.findMany({
        where: { companyId: context.companyId, status: 'pending' },
        select: { amount: true },
      }),
      prisma.expense.findMany({
        where: { companyId: context.companyId, date: { gte: monthStart(-5) } },
        select: { amount: true, category: true, status: true, date: true },
      }),
    ]);

    const categoryMap = new Map<string, { amount: number; count: number }>();
    for (const row of rows) {
      const entry = categoryMap.get(row.category) || { amount: 0, count: 0 };
      entry.amount += row.amount + (row.taxAmount || 0);
      entry.count += 1;
      categoryMap.set(row.category, entry);
    }

    const byCategory = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ category: name, amount: money(value.amount), count: value.count }))
      .sort((a, b) => b.amount - a.amount);

    const currentMonthStart = monthStart(0);
    const previousMonthStart = monthStart(-1);

    let monthTotal = 0;
    let monthCount = 0;
    let previousMonthTotal = 0;
    let reimbursedMonth = 0;
    const trendBuckets: { key: string; label: string; amount: number }[] = [];

    for (let offset = -5; offset <= 0; offset += 1) {
      const start = monthStart(offset);
      trendBuckets.push({
        key: `${start.getFullYear()}-${start.getMonth()}`,
        label: start.toLocaleDateString('en-IN', { month: 'short' }),
        amount: 0,
      });
    }

    for (const row of recent) {
      if (row.status === 'rejected') continue;
      const total = row.amount + 0;
      const bucket = trendBuckets.find(
        (entry) => entry.key === `${row.date.getFullYear()}-${row.date.getMonth()}`,
      );
      if (bucket) bucket.amount += total;

      if (row.date >= currentMonthStart) {
        monthTotal += total;
        monthCount += 1;
        if (row.status === 'reimbursed') reimbursedMonth += total;
      } else if (row.date >= previousMonthStart) {
        previousMonthTotal += row.amount;
      }
    }

    const trend = trendBuckets.map((entry) => ({ label: entry.label, amount: money(entry.amount) }));
    const trendPeak = Math.max(...trend.map((entry) => entry.amount), 0);

    return NextResponse.json({
      expenses: rows.map((row) => ({
        id: row.id,
        title: row.title || row.description || 'Expense',
        category: row.category,
        vendor: row.vendor,
        description: row.description,
        amount: row.amount,
        taxAmount: row.taxAmount,
        paymentMethod: row.paymentMethod,
        date: row.date,
        receipt: row.receipt,
        status: row.status,
        submittedBy: row.submittedBy,
        approvedBy: row.approvedBy,
        approvedAt: row.approvedAt,
        rejectionReason: row.rejectionReason,
        reimbursedAt: row.reimbursedAt,
        createdAt: row.createdAt,
      })),
      summary: {
        monthTotal: money(monthTotal),
        monthCount,
        previousMonthTotal: money(previousMonthTotal),
        changePercent:
          previousMonthTotal > 0
            ? Math.round(((monthTotal - previousMonthTotal) / previousMonthTotal) * 100)
            : null,
        pendingAmount: money(pending.reduce((sum, row) => sum + row.amount, 0)),
        pendingCount: pending.length,
        reimbursedMonth: money(reimbursedMonth),
        byCategory,
        trend,
        trendPeak,
        periodTotal: money(rows.reduce((sum, row) => sum + row.amount + (row.taxAmount || 0), 0)),
      },
      canApprove: context.canApprove,
      truncated: rows.length === 500,
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    const amount = Number(body.amount);
    const date = body.date ? new Date(body.date) : new Date();

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid expense date' }, { status: 400 });
    }

    const paymentMethod = PAYMENT_METHODS.includes(body.paymentMethod) ? body.paymentMethod : 'cash';
    const taxAmount = Number(body.taxAmount) || 0;

    const expense = await prisma.expense.create({
      data: {
        title,
        category: String(body.category || 'Other').trim() || 'Other',
        description: body.description ? String(body.description).trim() : null,
        vendor: body.vendor ? String(body.vendor).trim() : null,
        amount,
        taxAmount: taxAmount > 0 ? taxAmount : 0,
        paymentMethod,
        date,
        receipt: body.receipt ? String(body.receipt).trim() : null,
        status: 'pending',
        submittedBy: context.email,
        companyId: context.companyId,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isOwnerOfRow = existing.submittedBy === context.email;
    const wantsStatusChange = body.status !== undefined && body.status !== existing.status;
    const wantsFinancialEdit =
      body.amount !== undefined || body.taxAmount !== undefined || body.date !== undefined;

    // Only company approvers may decide a claim, or amend one that was already decided.
    if ((wantsStatusChange || wantsFinancialEdit) && !context.canApprove) {
      return NextResponse.json(
        { error: 'Only a company owner or admin can approve, reject or amend an expense' },
        { status: 403 },
      );
    }
    if (!context.canApprove && !isOwnerOfRow) {
      return NextResponse.json({ error: 'You can only edit expenses you submitted' }, { status: 403 });
    }
    if (!context.canApprove && existing.status !== 'pending') {
      return NextResponse.json({ error: 'This expense is already decided' }, { status: 409 });
    }

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      data.title = title;
    }
    if (body.category !== undefined) data.category = String(body.category || 'Other').trim() || 'Other';
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.vendor !== undefined) data.vendor = body.vendor ? String(body.vendor).trim() : null;
    if (body.receipt !== undefined) data.receipt = body.receipt ? String(body.receipt).trim() : null;

    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
      }
      data.amount = amount;
    }
    if (body.taxAmount !== undefined) data.taxAmount = Math.max(0, Number(body.taxAmount) || 0);
    if (body.paymentMethod !== undefined) {
      data.paymentMethod = PAYMENT_METHODS.includes(body.paymentMethod) ? body.paymentMethod : 'cash';
    }
    if (body.date !== undefined) {
      const date = new Date(body.date);
      if (Number.isNaN(date.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
      data.date = date;
    }

    if (wantsStatusChange) {
      const status = String(body.status);
      if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
        return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
      }

      data.status = status;
      if (status === 'approved' || status === 'rejected') {
        data.approvedBy = context.email;
        data.approvedAt = new Date();
        data.rejectionReason =
          status === 'rejected' && body.rejectionReason ? String(body.rejectionReason).trim() : null;
      }
      if (status === 'reimbursed') {
        data.reimbursedAt = new Date();
        if (!existing.approvedBy) {
          data.approvedBy = context.email;
          data.approvedAt = new Date();
        }
      }
      if (status === 'pending') {
        // Re-opening a claim clears the previous decision.
        data.approvedBy = null;
        data.approvedAt = null;
        data.rejectionReason = null;
        data.reimbursedAt = null;
      }
    }

    const expense = await prisma.expense.update({ where: { id }, data });
    // Approved/reimbursed claims post to the ledger; others are cleared.
    await postExpense(prisma, expense);
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isOwnerOfRow = existing.submittedBy === context.email;
    if (!context.canApprove && (!isOwnerOfRow || existing.status !== 'pending')) {
      return NextResponse.json(
        { error: 'Only pending expenses you submitted can be deleted' },
        { status: 403 },
      );
    }

    await prisma.expense.delete({ where: { id } });
    await removeSource(prisma, 'EXPENSE', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
