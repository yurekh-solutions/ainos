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

    const stores = await prisma.onlineStore.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { products: true, orders: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
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
    const store = await prisma.onlineStore.create({
      data: {
        name: body.name || 'New Store',
        description: body.description || null,
        currency: body.currency || 'INR',
        domain: body.domain || null,
        status: body.status || 'active',
        companyId: user.companyId,
      }
    });
    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
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

    const existing = await prisma.onlineStore.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true }
    });
    if (!existing) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    // Whitelisted OnlineStore columns only. `isActive` maps to status.
    const name = asText(body.name);
    const currency = asText(body.currency);
    const theme = asText(body.theme);
    const status =
      asText(body.status) ??
      (typeof body.isActive === 'boolean' ? (body.isActive ? 'active' : 'inactive') : undefined);
    const settings = body.settings;

    const data: Prisma.OnlineStoreUncheckedUpdateInput = {
      ...(name ? { name } : {}),
      ...(body.description !== undefined ? { description: asNullableText(body.description) ?? null } : {}),
      ...(body.domain !== undefined ? { domain: asNullableText(body.domain) ?? null } : {}),
      ...(status ? { status } : {}),
      ...(currency ? { currency } : {}),
      ...(body.logoUrl !== undefined ? { logoUrl: asNullableText(body.logoUrl) ?? null } : {}),
      ...(theme ? { theme } : {}),
      ...(settings !== undefined
        ? { settings: settings === null ? Prisma.DbNull : (settings as Prisma.InputJsonValue) }
        : {})
    };

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const store = await prisma.onlineStore.update({ where: { id }, data });
    return NextResponse.json(store);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A store with this domain already exists' }, { status: 409 });
    }
    console.error('Error updating store:', error);
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

    const existing = await prisma.onlineStore.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true }
    });
    if (!existing) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    await prisma.onlineStore.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2003' || error.code === 'P2014')
    ) {
      return NextResponse.json(
        { error: 'Store still has products, orders or categories attached' },
        { status: 409 }
      );
    }
    console.error('Error deleting store:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
