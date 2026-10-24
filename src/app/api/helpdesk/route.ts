import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

const asText = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

const asNullableText = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  const text = asText(value);
  if (text === undefined) return undefined;
  return text === '' ? null : text;
};

const asLower = (value: unknown): string | undefined => asText(value)?.toLowerCase();

// "in-progress", "in progress" and "In Progress" all become the stored "in_progress".
const normalizeStatus = (value: unknown): string | undefined =>
  asText(value)?.toLowerCase().replace(/[\s-]+/g, '_');

// DELETE accepts the id either as ?id= or in a JSON body.
async function resolveId(req: NextRequest): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  const fromQuery = searchParams.get('id');
  if (fromQuery) return fromQuery;
  try {
    const body = await req.json();
    return typeof body?.id === 'string' && body.id ? body.id : null;
  } catch {
    return null;
  }
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

    const tickets = await prisma.helpdeskTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
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
    const ticketNumber = body.ticketNumber || `TKT-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const ticket = await prisma.helpdeskTicket.create({
      data: {
        ticketNumber,
        subject: body.subject || 'New Ticket',
        description: body.description || null,
        priority: body.priority || 'medium',
        status: body.status || 'open',
        category: body.category || null,
        customerId: body.customerId || null,
        assignedTo: body.assignedTo || null,
        companyId: user.companyId,
      }
    });
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const id = asText(body.id);
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.helpdeskTicket.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true }
    });
    if (!existing) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    // Status is the ticket lifecycle: open -> in_progress -> resolved -> closed.
    const status = normalizeStatus(body.status);
    if (body.status !== undefined && !status) {
      return NextResponse.json({ error: 'Status cannot be empty' }, { status: 400 });
    }
    if (status && !(TICKET_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${TICKET_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Whitelisted HelpdeskTicket columns only. `response`/`notes` map to resolution.
    const subject = asText(body.subject);
    const description = body.description;
    const priority = asLower(body.priority);
    const category = body.category;
    const assignedTo = body.assignedTo;
    const customerId = body.customerId;
    const resolution = body.resolution !== undefined ? body.resolution : (body.response !== undefined ? body.response : body.notes);

    const data: Prisma.HelpdeskTicketUncheckedUpdateInput = {
      ...(subject ? { subject } : {}),
      ...(description !== undefined ? { description: asNullableText(description) ?? null } : {}),
      ...(priority ? { priority } : {}),
      ...(status ? { status } : {}),
      ...(category !== undefined ? { category: asNullableText(category) ?? null } : {}),
      ...(assignedTo !== undefined ? { assignedTo: asNullableText(assignedTo) ?? null } : {}),
      ...(customerId !== undefined ? { customerId: asNullableText(customerId) ?? null } : {}),
      ...(resolution !== undefined ? { resolution: asNullableText(resolution) ?? null } : {})
    };

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const ticket = await prisma.helpdeskTicket.update({ where: { id }, data });
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const id = await resolveId(req);
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.helpdeskTicket.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true }
    });
    if (!existing) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    await prisma.helpdeskTicket.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
