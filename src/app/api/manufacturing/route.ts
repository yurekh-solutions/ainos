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
    const type = searchParams.get('type'); // boms, orders, workcenters, quality, scrap

    if (type === 'workcenters') {
      const data = await prisma.workCenter.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } });
      return NextResponse.json(data);
    }
    if (type === 'orders') {
      const data = await prisma.manufacturingOrder.findMany({ where: { companyId: user.companyId }, include: { bom: true }, orderBy: { createdAt: 'desc' } });
      return NextResponse.json(data);
    }
    if (type === 'quality') {
      const data = await prisma.qualityCheck.findMany({ where: { companyId: user.companyId }, orderBy: { createdAt: 'desc' } });
      return NextResponse.json(data);
    }
    if (type === 'scrap') {
      const data = await prisma.scrapOrder.findMany({ where: { companyId: user.companyId }, orderBy: { createdAt: 'desc' } });
      return NextResponse.json(data);
    }

    // Default: BOMs
    const data = await prisma.bOM.findMany({ where: { companyId: user.companyId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(data);
  } catch (e) {
    console.error('GET /api/manufacturing error:', e);
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
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'workcenters') {
      const data = await prisma.workCenter.create({ data: { name: body.name, capacity: body.capacity || 0, costPerHour: body.costPerHour || 0, status: body.status || 'active', companyId: user.companyId } });
      return NextResponse.json(data, { status: 201 });
    }
    if (type === 'orders') {
      const count = await prisma.manufacturingOrder.count({ where: { companyId: user.companyId } });
      const moNumber = `MO-${String(count + 1).padStart(5, '0')}`;
      const planned = body.scheduledStart || body.plannedDate;
      const data = await prisma.manufacturingOrder.create({ data: { moNumber, product: body.productName || body.product, quantity: body.quantity || 0, bomId: body.bomId || null, status: body.status || 'draft', plannedDate: planned ? new Date(planned) : null, companyId: user.companyId } });
      return NextResponse.json(data, { status: 201 });
    }
    if (type === 'quality') {
      const data = await prisma.qualityCheck.create({ data: { title: body.productName || body.title || 'Quality Check', type: body.checkType || body.type || 'inspection', status: body.result || body.status || 'pending', notes: body.notes || null, companyId: user.companyId } });
      return NextResponse.json(data, { status: 201 });
    }
    if (type === 'scrap') {
      const data = await prisma.scrapOrder.create({ data: { product: body.productName || body.product, quantity: body.quantity || 0, reason: body.reason || null, disposedAt: new Date(), companyId: user.companyId } });
      return NextResponse.json(data, { status: 201 });
    }

    // Default: BOM
    const data = await prisma.bOM.create({ data: { name: body.name, product: body.productName || body.product || body.name, quantity: body.quantity || 1, components: body.components || [], companyId: user.companyId } });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('POST /api/manufacturing error:', e);
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
    const type = searchParams.get('type');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json();

    // Verify the record belongs to this company before modifying it
    const owned = async (model: 'workCenter' | 'manufacturingOrder' | 'qualityCheck' | 'scrapOrder' | 'bOM') => {
      const record = await (prisma[model] as typeof prisma.workCenter).findUnique({ where: { id } });
      return record && record.companyId === user.companyId;
    };

    if (type === 'workcenters') {
      if (!(await owned('workCenter'))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const data = await prisma.workCenter.update({ where: { id }, data: { ...(body.name && { name: body.name }), ...(body.capacity !== undefined && { capacity: body.capacity }), ...(body.costPerHour !== undefined && { costPerHour: body.costPerHour }), ...(body.status && { status: body.status }) } });
      return NextResponse.json(data);
    }
    if (type === 'orders') {
      if (!(await owned('manufacturingOrder'))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const data = await prisma.manufacturingOrder.update({ where: { id }, data: { ...(body.status && { status: body.status }), ...(body.quantity !== undefined && { quantity: body.quantity }), ...(body.notes && { notes: body.notes }) } });
      return NextResponse.json(data);
    }
    if (type === 'quality') {
      if (!(await owned('qualityCheck'))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const data = await prisma.qualityCheck.update({ where: { id }, data: { ...(body.result && { status: body.result }), ...(body.status && { status: body.status }), ...(body.notes && { notes: body.notes }) } });
      return NextResponse.json(data);
    }

    // Default: BOM
    if (!(await owned('bOM'))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = await prisma.bOM.update({ where: { id }, data: { ...(body.name && { name: body.name }), ...(body.product && { product: body.product }), ...(body.quantity !== undefined && { quantity: body.quantity }), ...(body.components !== undefined && { components: body.components }) } });
    return NextResponse.json(data);
  } catch (e) {
    console.error('PUT /api/manufacturing error:', e);
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
    const type = searchParams.get('type');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Verify the record belongs to this company before deleting it
    const owned = async (model: 'workCenter' | 'manufacturingOrder' | 'qualityCheck' | 'scrapOrder' | 'bOM') => {
      const record = await (prisma[model] as typeof prisma.workCenter).findUnique({ where: { id } });
      return record && record.companyId === user.companyId;
    };

    if (type === 'workcenters') { if (!(await owned('workCenter'))) return NextResponse.json({ error: 'Not found' }, { status: 404 }); await prisma.workCenter.delete({ where: { id } }); }
    else if (type === 'orders') { if (!(await owned('manufacturingOrder'))) return NextResponse.json({ error: 'Not found' }, { status: 404 }); await prisma.manufacturingOrder.delete({ where: { id } }); }
    else if (type === 'quality') { if (!(await owned('qualityCheck'))) return NextResponse.json({ error: 'Not found' }, { status: 404 }); await prisma.qualityCheck.delete({ where: { id } }); }
    else if (type === 'scrap') { if (!(await owned('scrapOrder'))) return NextResponse.json({ error: 'Not found' }, { status: 404 }); await prisma.scrapOrder.delete({ where: { id } }); }
    else { if (!(await owned('bOM'))) return NextResponse.json({ error: 'Not found' }, { status: 404 }); await prisma.bOM.delete({ where: { id } }); }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/manufacturing error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
