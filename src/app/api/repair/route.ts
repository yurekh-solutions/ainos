import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const STATUSES = ['received', 'diagnosed', 'in_progress', 'awaiting_parts', 'ready', 'delivered', 'cancelled'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const LINE_KINDS = ['part', 'labor', 'service'];

interface LineInput {
  kind: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

async function context(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, companyId: true, role: true, isAdmin: true, email: true },
  });
  if (!user?.companyId) return { error: NextResponse.json({ error: 'Company not found' }, { status: 404 }) };

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const canManage = Boolean(
    user.isAdmin || ['owner', 'admin'].includes((user.role || '').toLowerCase()) || adminEmails.includes((user.email || '').toLowerCase()),
  );

  return { user, companyId: user.companyId, canManage };
}

function cleanDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function cleanLines(value: unknown): LineInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const item = (row || {}) as Record<string, unknown>;
      const description = String(item.description || '').trim();
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
      const safePrice = Number.isFinite(unitPrice) ? unitPrice : 0;
      return {
        kind: LINE_KINDS.includes(String(item.kind)) ? String(item.kind) : 'part',
        description,
        quantity: safeQuantity,
        unitPrice: safePrice,
        amount: Math.round(safeQuantity * safePrice * 100) / 100,
      };
    })
    .filter((row) => row.description);
}

function costTotals(lines: LineInput[], fallbackLabor: number, fallbackParts: number) {
  if (lines.length === 0) {
    return {
      laborCost: Math.round(fallbackLabor * 100) / 100,
      partsCost: Math.round(fallbackParts * 100) / 100,
      totalCost: Math.round((fallbackLabor + fallbackParts) * 100) / 100,
    };
  }
  const parts = lines.filter((line) => line.kind === 'part').reduce((sum, line) => sum + line.amount, 0);
  const labor = lines.filter((line) => line.kind !== 'part').reduce((sum, line) => sum + line.amount, 0);
  return {
    partsCost: Math.round(parts * 100) / 100,
    laborCost: Math.round(labor * 100) / 100,
    totalCost: Math.round((parts + labor) * 100) / 100,
  };
}

async function nextOrderNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  let counter = (await prisma.repairOrder.count({ where: { companyId } })) + 1;
  let candidate = `RO-${String(counter).padStart(4, '0')}-${year}`;
  while (await prisma.repairOrder.findUnique({ where: { orderNumber: candidate }, select: { id: true } })) {
    counter += 1;
    candidate = `RO-${String(counter).padStart(4, '0')}-${year}`;
  }
  return candidate;
}

export async function GET(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const search = (searchParams.get('q') || '').trim();
  const id = searchParams.get('id');

  try {
    const where: Record<string, unknown> = { companyId: ctx.companyId };
    if (id) where.id = id;
    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { deviceName: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.repairOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        lines: {
          select: { id: true, kind: true, description: true, quantity: true, unitPrice: true, amount: true },
        },
      },
    });

    if (id) {
      if (orders.length === 0) return NextResponse.json({ error: 'Repair order not found' }, { status: 404 });
      return NextResponse.json({ order: orders[0], canManage: ctx.canManage });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const open = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status));

    return NextResponse.json({
      orders,
      summary: {
        open: open.length,
        inProgress: orders.filter((order) => order.status === 'in_progress').length,
        awaitingParts: orders.filter((order) => order.status === 'awaiting_parts').length,
        ready: orders.filter((order) => order.status === 'ready').length,
        deliveredMonth: orders.filter(
          (order) => order.status === 'delivered' && order.deliveredAt && order.deliveredAt >= monthStart,
        ).length,
        revenueMonth: Math.round(
          orders
            .filter((order) => order.status === 'delivered' && order.deliveredAt && order.deliveredAt >= monthStart)
            .reduce((sum, order) => sum + order.totalCost, 0) * 100,
        ) / 100,
      },
      canManage: ctx.canManage,
    });
  } catch (error) {
    console.error('Error fetching repair orders:', error);
    return NextResponse.json({ error: 'Could not load repair orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const customerName = String(body.customerName || '').trim();
    const deviceName = String(body.deviceName || '').trim();
    if (!customerName) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    if (!deviceName) return NextResponse.json({ error: 'Device or item is required' }, { status: 400 });

    const lines = cleanLines(body.lines);
    const costs = costTotals(lines, Number(body.laborCost) || 0, Number(body.partsCost) || 0);
    const status = STATUSES.includes(body.status) ? body.status : 'received';
    const priority = PRIORITIES.includes(body.priority) ? body.priority : 'normal';
    const receivedAt = cleanDate(body.receivedAt) || new Date();

    const order = await prisma.repairOrder.create({
      data: {
        orderNumber: await nextOrderNumber(ctx.companyId),
        customerName,
        customerPhone: body.customerPhone ? String(body.customerPhone).trim() : null,
        customerEmail: body.customerEmail ? String(body.customerEmail).trim() : null,
        deviceName,
        serialNumber: body.serialNumber ? String(body.serialNumber).trim() : null,
        underWarranty: Boolean(body.underWarranty),
        issue: body.issue ? String(body.issue).trim() : null,
        diagnosis: body.diagnosis ? String(body.diagnosis).trim() : null,
        resolution: body.resolution ? String(body.resolution).trim() : null,
        status,
        priority,
        technician: body.technician ? String(body.technician).trim() : null,
        laborCost: costs.laborCost,
        partsCost: costs.partsCost,
        totalCost: costs.totalCost,
        receivedAt,
        promisedAt: cleanDate(body.promisedAt),
        completedAt: ['ready', 'delivered'].includes(status) ? new Date() : null,
        deliveredAt: status === 'delivered' ? new Date() : null,
        notes: body.notes ? String(body.notes).trim() : null,
        companyId: ctx.companyId,
        lines: lines.length
          ? { create: lines.map((line) => ({ kind: line.kind, description: line.description, quantity: line.quantity, unitPrice: line.unitPrice, amount: line.amount })) }
          : undefined,
      },
      include: { lines: true },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating repair order:', error);
    return NextResponse.json({ error: 'Could not create repair order' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Repair order id is required' }, { status: 400 });

    const existing = await prisma.repairOrder.findFirst({
      where: { id, companyId: ctx.companyId },
      include: { lines: true },
    });
    if (!existing) return NextResponse.json({ error: 'Repair order not found' }, { status: 404 });

    const data: Record<string, unknown> = {};

    if (body.customerName !== undefined) {
      const customerName = String(body.customerName || '').trim();
      if (!customerName) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
      data.customerName = customerName;
    }
    if (body.deviceName !== undefined) {
      const deviceName = String(body.deviceName || '').trim();
      if (!deviceName) return NextResponse.json({ error: 'Device or item is required' }, { status: 400 });
      data.deviceName = deviceName;
    }

    if (body.customerPhone !== undefined) data.customerPhone = body.customerPhone ? String(body.customerPhone).trim() : null;
    if (body.customerEmail !== undefined) data.customerEmail = body.customerEmail ? String(body.customerEmail).trim() : null;
    if (body.serialNumber !== undefined) data.serialNumber = body.serialNumber ? String(body.serialNumber).trim() : null;
    if (body.underWarranty !== undefined) data.underWarranty = Boolean(body.underWarranty);
    if (body.issue !== undefined) data.issue = body.issue ? String(body.issue).trim() : null;
    if (body.diagnosis !== undefined) data.diagnosis = body.diagnosis ? String(body.diagnosis).trim() : null;
    if (body.resolution !== undefined) data.resolution = body.resolution ? String(body.resolution).trim() : null;
    if (body.technician !== undefined) data.technician = body.technician ? String(body.technician).trim() : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
    if (body.priority !== undefined && PRIORITIES.includes(body.priority)) data.priority = body.priority;
    if (body.receivedAt !== undefined) {
      const received = cleanDate(body.receivedAt);
      if (received) data.receivedAt = received;
    }
    if (body.promisedAt !== undefined) data.promisedAt = cleanDate(body.promisedAt);

    let lines: LineInput[] | null = null;
    if (Array.isArray(body.lines)) {
      lines = cleanLines(body.lines);
      const fallbackLabor = body.laborCost !== undefined ? Number(body.laborCost) || 0 : existing.laborCost;
      const fallbackParts = body.partsCost !== undefined ? Number(body.partsCost) || 0 : existing.partsCost;
      const costs = costTotals(lines, fallbackLabor, fallbackParts);
      data.laborCost = costs.laborCost;
      data.partsCost = costs.partsCost;
      data.totalCost = costs.totalCost;
    } else {
      if (body.laborCost !== undefined || body.partsCost !== undefined) {
        const labor = body.laborCost !== undefined ? Number(body.laborCost) || 0 : existing.laborCost;
        const parts = body.partsCost !== undefined ? Number(body.partsCost) || 0 : existing.partsCost;
        data.laborCost = Math.round(labor * 100) / 100;
        data.partsCost = Math.round(parts * 100) / 100;
        data.totalCost = Math.round((labor + parts) * 100) / 100;
      }
    }

    if (body.status !== undefined) {
      const status = STATUSES.includes(body.status) ? body.status : existing.status;
      data.status = status;
      if (['ready', 'delivered'].includes(status)) {
        data.completedAt = existing.completedAt || new Date();
      } else {
        data.completedAt = null;
      }
      data.deliveredAt = status === 'delivered' ? existing.deliveredAt || new Date() : null;
    }

    const order = await prisma.$transaction(async (tx) => {
      if (lines) {
        await tx.repairLine.deleteMany({ where: { repairId: id } });
        if (lines.length) {
          await tx.repairLine.createMany({
            data: lines.map((line) => ({
              repairId: id,
              kind: line.kind,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              amount: line.amount,
            })),
          });
        }
      }
      return tx.repairOrder.update({ where: { id }, data, include: { lines: true } });
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating repair order:', error);
    return NextResponse.json({ error: 'Could not update repair order' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;
  if (!ctx.canManage) return NextResponse.json({ error: 'Only an owner or admin can delete repair orders' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Repair order id is required' }, { status: 400 });

  try {
    const existing = await prisma.repairOrder.findFirst({ where: { id, companyId: ctx.companyId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Repair order not found' }, { status: 404 });

    await prisma.repairOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting repair order:', error);
    return NextResponse.json({ error: 'Could not delete repair order' }, { status: 500 });
  }
}
