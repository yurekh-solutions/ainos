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

const asInt = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

const asNullableInt = (value: unknown): number | null | undefined => {
  if (value === null) return null;
  return asInt(value);
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

    const items = await prisma.stockItem.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });

    const lowStockItems = items.filter(i => i.quantity <= i.minStock);

    return NextResponse.json({ items, lowStockItems, lowStockCount: lowStockItems.length });
  } catch (error) {
    console.error('Error fetching stock:', error);
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
    const item = await prisma.stockItem.create({
      data: { ...body, companyId: user.companyId }
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating stock item:', error);
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

    const existing = await prisma.stockItem.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true }
    });
    if (!existing) return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });

    // Whitelisted StockItem columns only; the client may send productName instead of name.
    const name = asText(body.productName) ?? asText(body.name);
    const quantity = asInt(body.quantity);
    const minStock = asInt(body.minStock);
    const maxStock = asNullableInt(body.maxStock);
    const reorderLevel = asInt(body.reorderLevel);
    const status = asText(body.status);

    const data: Prisma.StockItemUncheckedUpdateInput = {
      ...(name ? { name } : {}),
      ...(body.sku !== undefined ? { sku: asNullableText(body.sku) ?? null } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
      ...(body.unit !== undefined ? { unit: asNullableText(body.unit) ?? null } : {}),
      ...(minStock !== undefined ? { minStock } : {}),
      ...(maxStock !== undefined ? { maxStock } : {}),
      ...(reorderLevel !== undefined ? { reorderLevel } : {}),
      ...(body.location !== undefined ? { location: asNullableText(body.location) ?? null } : {}),
      ...(status ? { status } : {})
    };

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const item = await prisma.stockItem.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating stock item:', error);
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

    const existing = await prisma.stockItem.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true }
    });
    if (!existing) return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });

    await prisma.stockItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stock item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
