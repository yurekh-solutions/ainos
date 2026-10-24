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

const asNullableInt = (value: unknown): number | null | undefined => {
  if (value === undefined || value === '') return undefined;
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

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

    const warehouses = await prisma.warehouse.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
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
    const warehouse = await prisma.warehouse.create({
      data: { ...body, companyId: user.companyId }
    });
    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
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

    const existing = await prisma.warehouse.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true }
    });
    if (!existing) return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });

    // Whitelisted Warehouse columns only. `address` maps to location, `isActive` maps to status.
    const name = asText(body.name);
    const location = body.location !== undefined ? body.location : body.address;
    const manager = body.manager;
    const capacity = asNullableInt(body.capacity);
    const status =
      asText(body.status) ??
      (typeof body.isActive === 'boolean' ? (body.isActive ? 'active' : 'inactive') : undefined);

    const data: Prisma.WarehouseUncheckedUpdateInput = {
      ...(name ? { name } : {}),
      ...(location !== undefined ? { location: asNullableText(location) ?? null } : {}),
      ...(manager !== undefined ? { manager: asNullableText(manager) ?? null } : {}),
      ...(capacity !== undefined ? { capacity } : {}),
      ...(status ? { status } : {})
    };

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const warehouse = await prisma.warehouse.update({ where: { id }, data });
    return NextResponse.json(warehouse);
  } catch (error) {
    console.error('Error updating warehouse:', error);
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

    const existing = await prisma.warehouse.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true }
    });
    if (!existing) return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });

    await prisma.warehouse.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
