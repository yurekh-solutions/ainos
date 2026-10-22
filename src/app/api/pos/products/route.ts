import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    const where: Record<string, string> = { companyId: user.companyId };
    if (categoryId) where.categoryId = categoryId;

    const products = await prisma.pOSProduct.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(products);
  } catch (e) {
    console.error('GET /api/pos/products error:', e);
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
    const product = await prisma.pOSProduct.create({
      data: {
        name: body.name,
        sku: body.sku || null,
        barcode: body.barcode || null,
        price: body.price,
        categoryId: body.categoryId || null,
        imageUrl: body.imageUrl || null,
        isInStock: body.isInStock !== false,
        quickKey: body.quickKey || null,
        companyId: user.companyId,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    console.error('POST /api/pos/products error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json();
    const product = await prisma.pOSProduct.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.sku !== undefined && { sku: body.sku }),
        ...(body.barcode !== undefined && { barcode: body.barcode }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.isInStock !== undefined && { isInStock: body.isInStock }),
        ...(body.quickKey !== undefined && { quickKey: body.quickKey }),
      },
    });
    return NextResponse.json(product);
  } catch (e) {
    console.error('PUT /api/pos/products error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.pOSProduct.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/pos/products error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
