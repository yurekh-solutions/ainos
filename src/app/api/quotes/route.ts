import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const quotes = await prisma.quote.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
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
    const quoteNumber = body.quoteNumber || `QT-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId: body.customerId || null,
        customerName: body.customerName || body.clientName || 'Customer',
        items: body.items || [],
        subtotal: Number(body.subtotal ?? 0) || 0,
        tax: Number(body.tax ?? 0) || 0,
        discount: Number(body.discount ?? 0) || 0,
        total: Number(body.total ?? body.totalAmount ?? 0) || 0,
        status: body.status || 'draft',
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        notes: body.notes || null,
        companyId: user.companyId,
      }
    });
    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
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

    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (rest.status !== undefined) data.status = rest.status;
    if (rest.items !== undefined) data.items = rest.items;
    if (rest.notes !== undefined) data.notes = rest.notes;
    if (rest.customerName !== undefined) data.customerName = rest.customerName;
    if (rest.validUntil !== undefined) data.validUntil = rest.validUntil ? new Date(rest.validUntil) : null;
    if (rest.subtotal !== undefined) data.subtotal = Number(rest.subtotal);
    if (rest.tax !== undefined) data.tax = Number(rest.tax);
    if (rest.discount !== undefined) data.discount = Number(rest.discount);
    if (rest.total !== undefined || rest.totalAmount !== undefined) data.total = Number(rest.total ?? rest.totalAmount);

    const quote = await prisma.quote.update({ where: { id }, data });
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error updating quote:', error);
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

    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing || existing.companyId !== user.companyId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
