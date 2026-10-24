import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

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

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = String(body.id || new URL(req.url).searchParams.get('id') || '');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    // Explicit whitelist of the bank_accounts columns that may change.
    const data: Prisma.BankAccountUpdateInput = {};

    if (body.name !== undefined) {
      const name = String(body.name || '').trim();
      if (!name) return NextResponse.json({ error: 'Account name is required' }, { status: 400 });
      data.name = name;
    }
    if (body.accountNumber !== undefined) {
      const accountNumber = String(body.accountNumber || '').trim();
      if (!accountNumber) return NextResponse.json({ error: 'Account number is required' }, { status: 400 });
      data.accountNumber = accountNumber;
    }
    if (body.bankName !== undefined) data.bankName = body.bankName ? String(body.bankName).trim() : null;
    if (body.ifscCode !== undefined) data.ifscCode = body.ifscCode ? String(body.ifscCode).trim().toUpperCase() : null;
    if (body.balance !== undefined) data.balance = toNumber(body.balance);

    const account = await prisma.bankAccount.update({ where: { id }, data });
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating bank account:', error);
    return NextResponse.json({ error: 'Failed to update bank account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    // BankTransaction has no cascade: deleting a used account would hit a foreign-key error.
    const transactions = await prisma.bankTransaction.count({ where: { accountId: id } });
    if (transactions > 0) {
      return NextResponse.json(
        { error: `This account still has ${transactions} transaction(s) and cannot be deleted` },
        { status: 409 },
      );
    }

    await prisma.bankAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    return NextResponse.json({ error: 'Failed to delete bank account' }, { status: 500 });
  }
}
