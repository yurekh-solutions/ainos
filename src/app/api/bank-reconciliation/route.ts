import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const transactions = await prisma.bankTransaction.findMany({
      where: { companyId: user.companyId },
      include: { account: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const body = await req.json();
    const transactions = await Promise.all(
      body.transactions.map((t: any) =>
        prisma.bankTransaction.create({
          data: {
            accountId: t.accountId,
            date: new Date(t.date),
            description: t.description || null,
            debit: t.debit || 0,
            credit: t.credit || 0,
            balance: t.balance || null,
            reference: t.reference || null,
            companyId: user.companyId,
          },
        })
      )
    );
    return NextResponse.json(transactions, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import transactions' }, { status: 500 });
  }
}
