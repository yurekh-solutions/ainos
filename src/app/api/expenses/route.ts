import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const expenses = await prisma.expense.findMany({
      where: { companyId: user.companyId },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const description = [body.description || body.title || null, body.vendor ? `Vendor: ${body.vendor}` : null].filter(Boolean).join(' \u00b7 ') || null;
    const expense = await prisma.expense.create({
      data: {
        category: body.category || 'Other',
        description,
        amount: Number(body.amount ?? 0) || 0,
        date: body.date ? new Date(body.date) : new Date(),
        receipt: body.receipt || null,
        status: body.status || 'pending',
        companyId: user.companyId,
      }
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (rest.category !== undefined) data.category = rest.category;
    if (rest.description !== undefined) data.description = rest.description;
    if (rest.amount !== undefined) data.amount = Number(rest.amount);
    if (rest.date !== undefined) data.date = rest.date ? new Date(rest.date) : new Date();
    if (rest.receipt !== undefined) data.receipt = rest.receipt;
    if (rest.status !== undefined) data.status = rest.status;

    const expense = await prisma.expense.update({ where: { id }, data });
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
