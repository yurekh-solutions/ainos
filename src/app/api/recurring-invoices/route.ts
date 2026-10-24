import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

function advance(date: Date, frequency: string): Date {
  const next = new Date(date);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  else if (frequency === 'quarterly') next.setMonth(next.getMonth() + 3);
  else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
}

async function context(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return { error: NextResponse.json({ error: 'Company not found' }, { status: 404 }) };
  return { user, companyId: user.companyId };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const invoices = await prisma.recurringInvoice.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recurring invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const startDate = new Date(body.startDate);
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'A valid start date is required' }, { status: 400 });
    }

    const frequency = FREQUENCIES.includes(body.frequency) ? body.frequency : 'monthly';
    const requestedNext = body.nextRunDate ? new Date(body.nextRunDate) : new Date(startDate);

    const invoice = await prisma.recurringInvoice.create({
      data: {
        customerId: body.customerId || null,
        customerName: body.customerName || null,
        items: body.items || null,
        frequency,
        startDate,
        endDate: body.endDate ? new Date(body.endDate) : null,
        nextRunDate: Number.isNaN(requestedNext.getTime()) ? startDate : requestedNext,
        status: body.status === 'paused' ? 'paused' : 'active',
        notes: body.notes || null,
        companyId: ctx.companyId,
      },
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring invoice:', error);
    return NextResponse.json({ error: 'Failed to create recurring invoice' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Recurring invoice id is required' }, { status: 400 });

    const existing = await prisma.recurringInvoice.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });

    const data: Record<string, unknown> = {};

    if (typeof body.status === 'string') {
      if (!['active', 'paused', 'completed'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      data.status = body.status;
    }

    if (Array.isArray(body.items)) data.items = body.items;
    if (body.customerName !== undefined) data.customerName = body.customerName || null;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (typeof body.frequency === 'string' && FREQUENCIES.includes(body.frequency)) data.frequency = body.frequency;

    if (body.startDate) {
      const start = new Date(body.startDate);
      if (!Number.isNaN(start.getTime())) data.startDate = start;
    }
    if (body.nextRunDate) {
      const next = new Date(body.nextRunDate);
      if (!Number.isNaN(next.getTime())) data.nextRunDate = next;
    }
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;

    // "Run now" pushes the schedule forward exactly one cycle from today.
    if (body.runNow) {
      data.nextRunDate = advance(new Date(), (data.frequency as string) || existing.frequency);
    }

    const invoice = await prisma.recurringInvoice.update({ where: { id }, data });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating recurring invoice:', error);
    return NextResponse.json({ error: 'Failed to update recurring invoice' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Recurring invoice id is required' }, { status: 400 });

  try {
    const existing = await prisma.recurringInvoice.findFirst({ where: { id, companyId: ctx.companyId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });

    await prisma.recurringInvoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring invoice:', error);
    return NextResponse.json({ error: 'Failed to delete recurring invoice' }, { status: 500 });
  }
}
