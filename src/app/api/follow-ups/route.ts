import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const STATUSES = ['pending', 'done', 'missed'];
const TYPES = ['call', 'email', 'whatsapp', 'meeting', 'visit'];

async function context(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return { error: NextResponse.json({ error: 'Company not found' }, { status: 404 }) };
  return { user, companyId: user.companyId };
}

function cleanDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const where: Record<string, unknown> = { companyId: user.companyId };
    if (status) where.status = status;

    const followUps = await prisma.followUp.findMany({
      where,
      orderBy: { dueDate: 'asc' }
    });
    return NextResponse.json(followUps);
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
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
    const followUp = await prisma.followUp.create({
      data: {
        contactId: body.contactId || null,
        contactName: body.contactName || body.contact || null,
        type: TYPES.includes(body.type) ? body.type : 'call',
        notes: body.notes || body.message || null,
        status: STATUSES.includes(body.status) ? body.status : 'pending',
        companyId: user.companyId,
        dueDate: cleanDate(body.dueDate || body.scheduledDate),
      }
    });
    return NextResponse.json(followUp, { status: 201 });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;

  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const id = String(searchParams.get('id') || body.id || '');
    if (!id) return NextResponse.json({ error: 'Follow-up id is required' }, { status: 400 });

    const existing = await prisma.followUp.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof body.status === 'string') {
      if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      data.status = body.status;
    }
    if (body.contactName !== undefined) data.contactName = body.contactName || null;
    if (typeof body.type === 'string' && TYPES.includes(body.type)) data.type = body.type;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.dueDate !== undefined || body.scheduledDate !== undefined) {
      data.dueDate = cleanDate(body.dueDate ?? body.scheduledDate);
    }

    const followUp = await prisma.followUp.update({ where: { id }, data });
    return NextResponse.json(followUp);
  } catch (error) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Follow-up id is required' }, { status: 400 });

  try {
    const existing = await prisma.followUp.findFirst({ where: { id, companyId: ctx.companyId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });

    await prisma.followUp.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
