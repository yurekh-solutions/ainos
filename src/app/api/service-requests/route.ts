import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const asText = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

const asNullableText = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  const text = asText(value);
  if (text === undefined) return undefined;
  return text === '' ? null : text;
};

// "in-progress" and "in progress" both become "in_progress" so status filters keep matching.
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

    const requests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
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
    const request = await prisma.serviceRequest.create({
      data: {
        title: body.title || 'Service Request',
        description: body.description || null,
        category: body.category || body.type || null,
        priority: body.priority || 'medium',
        status: body.status || 'open',
        customerId: body.customerId || null,
        assignedTo: body.assignedTo || null,
        companyId: user.companyId,
      }
    });
    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error('Error creating service request:', error);
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

    const existing = await prisma.serviceRequest.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true }
    });
    if (!existing) return NextResponse.json({ error: 'Service request not found' }, { status: 404 });

    // Whitelisted ServiceRequest columns only. `serviceName` maps to title and `type` to category;
    // scheduling metadata (scheduledDate/notes) has no column on this model and is ignored.
    const title = asText(body.title) ?? asText(body.serviceName);
    const description = body.description;
    const categoryInput = body.category !== undefined ? body.category : body.type;
    const priority = asText(body.priority)?.toLowerCase();
    const status = normalizeStatus(body.status);
    const customerId = body.customerId;
    const assignedTo = body.assignedTo;

    if (body.status !== undefined && !status) {
      return NextResponse.json({ error: 'Status cannot be empty' }, { status: 400 });
    }

    const data: Prisma.ServiceRequestUncheckedUpdateInput = {
      ...(title ? { title } : {}),
      ...(description !== undefined ? { description: asNullableText(description) ?? null } : {}),
      ...(categoryInput !== undefined ? { category: asNullableText(categoryInput) ?? null } : {}),
      ...(priority ? { priority } : {}),
      ...(status ? { status } : {}),
      ...(customerId !== undefined ? { customerId: asNullableText(customerId) ?? null } : {}),
      ...(assignedTo !== undefined ? { assignedTo: asNullableText(assignedTo) ?? null } : {})
    };

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const request = await prisma.serviceRequest.update({ where: { id }, data });
    return NextResponse.json(request);
  } catch (error) {
    console.error('Error updating service request:', error);
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

    const existing = await prisma.serviceRequest.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true }
    });
    if (!existing) return NextResponse.json({ error: 'Service request not found' }, { status: 404 });

    await prisma.serviceRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
