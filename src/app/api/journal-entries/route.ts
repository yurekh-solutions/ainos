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
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { journal: { companyId: user.companyId } };
    if (accountId) where.accountId = accountId;
    if (startDate || endDate) {
      where.journal = { ...where.journal, date: {} };
      if (startDate) where.journal.date.gte = new Date(startDate);
      if (endDate) where.journal.date.lte = new Date(endDate);
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      include: {
        journal: true,
        account: true,
      },
      orderBy: { journal: { date: 'desc' } },
    });

    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const body = await req.json();
    const { date, description, reference, entries } = body;

    if (!entries || entries.length < 2) {
      return NextResponse.json({ error: 'At least 2 ledger entries required (debit & credit)' }, { status: 400 });
    }

    const totalDebit = entries.reduce((s: number, e: any) => s + (e.debit || 0), 0);
    const totalCredit = entries.reduce((s: number, e: any) => s + (e.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ error: 'Debit and credit must be equal' }, { status: 400 });
    }

    // Chart-of-accounts rows belong to a company, so every posted accountId has
    // to be one of the caller's. Otherwise any tenant could post into another
    // company's ledger and move its balances.
    const accountIds = Array.from(
      new Set<string>(entries.map((e: { accountId?: unknown }) => String(e.accountId || ''))),
    ).filter(Boolean);
    if (accountIds.length === 0) {
      return NextResponse.json({ error: 'Every ledger entry needs an account' }, { status: 400 });
    }
    const ownedAccounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, companyId: user.companyId },
      select: { id: true },
    });
    if (ownedAccounts.length !== accountIds.length) {
      return NextResponse.json({ error: 'One or more accounts do not belong to your company' }, { status: 403 });
    }

    const journal = await prisma.journalEntry.create({
      data: {
        date: new Date(date),
        description,
        reference,
        companyId: user.companyId,
        entries: {
          create: entries.map((e: any) => ({
            accountId: e.accountId,
            debit: e.debit || 0,
            credit: e.credit || 0,
            description: e.description || null,
          })),
        },
      },
      include: { entries: { include: { account: true } } },
    });

    // Update account balances - keyed on id + companyId, so a row that was
    // moved to another tenant between the check and the write cannot be hit.
    for (const e of entries) {
      await prisma.account.updateMany({
        where: { id: String(e.accountId), companyId: user.companyId },
        data: { balance: { increment: (e.debit || 0) - (e.credit || 0) } },
      });
    }

    return NextResponse.json(journal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}
