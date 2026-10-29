import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBankCsv, reconcile, type InvoiceLite } from '@/lib/finance/bank';

async function resolveUser(req: NextRequest): Promise<{ id: string; companyId: string } | null> {
  const session = await getServerSession(req);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return null;
  return { id: user.id, companyId: user.companyId };
}

/**
 * POST { accountId, csv } — parse a bank statement, persist its transactions on the
 * account, and return a reconciliation preview (each credit matched, if at all, to an
 * open invoice). Persisted rows stay unmatched until the client applies a payment.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const transactions = await prisma.bankTransaction.findMany({
      where: { companyId: user.companyId },
      orderBy: { date: 'desc' },
      take: 200,
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Bank transactions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const csv = String(body.csv || '');
    if (!csv.trim()) return NextResponse.json({ error: 'CSV content is required' }, { status: 400 });

    const account = body.accountId
      ? await prisma.bankAccount.findFirst({ where: { id: String(body.accountId), companyId: user.companyId } })
      : null;
    if (body.accountId && !account) return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });

    const { transactions, errors } = parseBankCsv(csv);
    if (!transactions.length) {
      return NextResponse.json({ error: errors[0] || 'No transactions found in this CSV', summary: null, rows: [] }, { status: 400 });
    }

    // Load open invoices for matching.
    const invoiceRows = await prisma.invoice.findMany({
      where: { companyId: user.companyId, status: { not: 'draft' } },
      select: { id: true, invoiceNumber: true, customerName: true, totalAmount: true, paidAmount: true, status: true },
      orderBy: { createdAt: 'desc' },
    });
    const invoices = invoiceRows as unknown as InvoiceLite[];

    const rows = reconcile(transactions, invoices);

    // Persist to the chosen account, de-duplicating by date+amount+reference.
    let persisted = 0;
    if (account) {
      const existing = await prisma.bankTransaction.findMany({
        where: { companyId: user.companyId, accountId: account.id },
        select: { date: true, credit: true, debit: true, reference: true },
      });
      const seen = new Set(existing.map((e) =>
        `${e.date.toISOString().slice(0, 10)}|${e.credit}|${e.debit}|${(e.reference || '').toUpperCase()}`));

      for (const row of rows) {
        const key = `${row.txn.date}|${row.txn.credit}|${row.txn.debit}|${(row.txn.reference || '').toUpperCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const created = await prisma.bankTransaction.create({
          data: {
            accountId: account.id,
            companyId: user.companyId,
            date: new Date(row.txn.date),
            description: row.txn.description || null,
            reference: row.txn.reference || null,
            debit: row.txn.debit,
            credit: row.txn.credit,
            balance: row.txn.balance ?? null,
            matched: false,
          },
        });
        row.txnId = created.id;
        persisted++;
      }
    }

    const summary = {
      parsed: transactions.length,
      persisted,
      matched: rows.filter((r) => r.match).length,
      unmatched: rows.filter((r) => !r.match && r.txn.credit > 0).length,
      creditTotal: rows.reduce((s, r) => s + r.txn.credit, 0),
      matchedAmount: rows.reduce((s, r) => s + (r.match?.allocAmount || 0), 0),
    };

    return NextResponse.json({
      account: account ? { id: account.id, name: account.name } : null,
      summary,
      rows: rows.map((r) => ({ txn: r.txn, txnId: r.txnId ?? null, match: r.match })),
    });
  } catch (error) {
    console.error('Bank reconciliation error:', error);
    return NextResponse.json({ error: 'Failed to reconcile bank statement' }, { status: 500 });
  }
}

/**
 * PUT { applied: [{ transactionId, invoiceId }] } — flag statement rows as reconciled
 * after the client has applied the corresponding invoice payment.
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const applied = Array.isArray(body.applied) ? body.applied : [];
    let updated = 0;
    for (const a of applied) {
      if (!a?.transactionId) continue;
      const txn = await prisma.bankTransaction.findFirst({ where: { id: String(a.transactionId), companyId: user.companyId } });
      if (!txn) continue;
      await prisma.bankTransaction.update({
        where: { id: txn.id },
        data: { matched: true, matchedWith: a.invoiceId ? String(a.invoiceId) : txn.matchedWith },
      });
      updated++;
    }
    return NextResponse.json({ updated });
  } catch (error) {
    console.error('Bank reconciliation apply error:', error);
    return NextResponse.json({ error: 'Failed to update reconciliation' }, { status: 500 });
  }
}
