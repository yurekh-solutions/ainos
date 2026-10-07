import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const accounts = await prisma.bankAccount.findMany({
      where: { companyId: user.companyId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const body = await req.json();
    const account = await prisma.bankAccount.create({
      data: {
        name: body.name,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode || null,
        bankName: body.bankName || null,
        balance: body.balance || 0,
        companyId: user.companyId,
      },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 });
  }
}
