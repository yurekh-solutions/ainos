import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const customers = await prisma.customer.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
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
    const customer = await prisma.customer.create({
      data: { ...body, companyId: user.companyId }
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
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

    const existing = await prisma.customer.findUnique({ where: { id: String(id) } });
    if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    if (existing.companyId !== user.companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data: Record<string, unknown> = {};
    if (rest.name !== undefined) {
      const name = String(rest.name || '').trim();
      if (!name) return NextResponse.json({ error: 'Customer name cannot be empty' }, { status: 400 });
      data.name = name;
    }
    if (rest.email !== undefined) data.email = rest.email ? String(rest.email).trim() : null;
    if (rest.phone !== undefined) data.phone = rest.phone ? String(rest.phone).trim() : null;
    if (rest.company !== undefined) data.company = rest.company ? String(rest.company).trim() : null;
    if (rest.gstNumber !== undefined) data.gstNumber = rest.gstNumber ? String(rest.gstNumber).trim().toUpperCase() : null;
    if (rest.panNumber !== undefined) data.panNumber = rest.panNumber ? String(rest.panNumber).trim().toUpperCase() : null;
    if (rest.state !== undefined) data.state = rest.state ? String(rest.state).trim() : null;
    if (rest.pincode !== undefined) data.pincode = rest.pincode ? String(rest.pincode).trim() : null;
    if (rest.address !== undefined) data.address = rest.address ? String(rest.address).trim() : null;
    if (rest.notes !== undefined) data.notes = rest.notes ? String(rest.notes).trim() : null;
    if (rest.status !== undefined) {
      const status = String(rest.status || '').trim();
      if (status) data.status = status;
    }

    const customer = await prisma.customer.update({ where: { id: existing.id }, data });
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id ? String(body.id) : null;
      } catch {
        // DELETE without a body is fine - the id can come from the query string.
      }
    }
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    if (existing.companyId !== user.companyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
