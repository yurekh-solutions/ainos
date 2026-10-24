import { NextResponse, type NextRequest } from 'next/server';
import { Prisma, type RentalOrder } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/permissions';
import { diffFields, recordAudit } from '@/lib/audit';
import { money, num } from '@/lib/money';

const PERIODS = ['hour', 'day', 'week', 'month'];
const STATUSES = ['draft', 'confirmed', 'out', 'returned', 'cancelled'];
const LIVE = ['confirmed', 'out'];

const AUDITED_FIELDS = [
  'customerName',
  'customerEmail',
  'customerPhone',
  'itemName',
  'itemRef',
  'quantity',
  'period',
  'unitPrice',
  'startDate',
  'endDate',
  'rentalFee',
  'deposit',
  'lateFee',
  'total',
  'status',
  'returnedAt',
  'notes',
];

function cleanDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function countPeriods(start: Date, end: Date, period: string): number {
  const hours = Math.max(end.getTime() - start.getTime(), 0) / 3600000;
  if (period === 'hour') return Math.max(1, Math.ceil(hours));
  if (period === 'week') return Math.max(1, Math.ceil(hours / 168));
  if (period === 'month') return Math.max(1, Math.ceil(hours / 720));
  return Math.max(1, Math.ceil(hours / 24));
}

function priceOrder(input: {
  quantity: unknown;
  unitPrice: unknown;
  period: string;
  startDate: Date;
  endDate: Date;
  deposit: unknown;
  lateFee: unknown;
}) {
  const quantity = num(input.quantity, 1) || 1;
  const unitPrice = num(input.unitPrice);
  const periods = countPeriods(input.startDate, input.endDate, input.period);
  const rentalFee = Math.round(quantity * unitPrice * periods * 100) / 100;
  const deposit = num(input.deposit);
  const lateFee = num(input.lateFee);
  return { quantity, unitPrice, rentalFee, deposit, lateFee, total: Math.round((rentalFee + deposit + lateFee) * 100) / 100, periods };
}

/**
 * Allocation is serialised with a Postgres advisory lock keyed on the tenant, so two
 * concurrent creates can never compute the same candidate number. The probe loop is
 * still needed because the column is globally unique (probe-and-increment pattern).
 */
async function nextOrderNumber(client: Prisma.TransactionClient, companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  let counter = (await client.rentalOrder.count({ where: { companyId } })) + 1;
  let candidate = `RNT-${String(counter).padStart(4, '0')}-${year}`;
  while (await client.rentalOrder.findUnique({ where: { orderNumber: candidate }, select: { id: true } })) {
    counter += 1;
    candidate = `RNT-${String(counter).padStart(4, '0')}-${year}`;
  }
  return candidate;
}

function present(order: RentalOrder) {
  return {
    ...order,
    quantity: money(order.quantity),
    unitPrice: money(order.unitPrice),
    rentalFee: money(order.rentalFee),
    deposit: money(order.deposit),
    lateFee: money(order.lateFee),
    total: money(order.total),
    isOverdue: LIVE.includes(order.status) && order.endDate.getTime() < Date.now(),
  };
}

export async function GET(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');
  const search = (searchParams.get('q') || '').trim();

  try {
    if (id) {
      const order = await prisma.rentalOrder.findFirst({ where: { id, companyId: ctx.companyId } });
      if (!order) return NextResponse.json({ error: 'Rental order not found' }, { status: 404 });
      return NextResponse.json({ order: present(order), canManage: ctx.canManage });
    }

    const where: Prisma.RentalOrderWhereInput = { companyId: ctx.companyId };
    if (status === 'overdue') {
      where.status = { in: LIVE };
      where.endDate = { lt: new Date() };
    } else if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { itemName: { contains: search, mode: 'insensitive' } },
        { itemRef: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.rentalOrder.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const monthStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1);

    const [active, dueToday, overdue, returnedMonth, revenue] = await Promise.all([
      prisma.rentalOrder.count({ where: { companyId: ctx.companyId, status: { in: LIVE } } }),
      prisma.rentalOrder.count({
        where: { companyId: ctx.companyId, status: { in: LIVE }, endDate: { gte: dayStart, lt: dayEnd } },
      }),
      prisma.rentalOrder.count({ where: { companyId: ctx.companyId, status: { in: LIVE }, endDate: { lt: new Date() } } }),
      prisma.rentalOrder.count({ where: { companyId: ctx.companyId, status: 'returned', returnedAt: { gte: monthStart } } }),
      prisma.rentalOrder.aggregate({
        where: { companyId: ctx.companyId, createdAt: { gte: monthStart } },
        _sum: { total: true },
      }),
    ]);

    return NextResponse.json({
      orders: orders.map(present),
      summary: {
        active,
        dueToday,
        overdue,
        returnedMonth,
        revenueMonth: money(revenue._sum.total),
      },
      canManage: ctx.canManage,
    });
  } catch (error) {
    console.error('Rental GET failed', error);
    return NextResponse.json({ error: 'Could not load rental orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const customerName = String(body.customerName || '').trim();
    const itemName = String(body.itemName || '').trim();
    const startDate = cleanDate(body.startDate);
    const endDate = cleanDate(body.endDate);
    const period = PERIODS.includes(body.period) ? body.period : 'day';
    const status = STATUSES.includes(body.status) ? body.status : 'draft';

    if (!customerName) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    if (!itemName) return NextResponse.json({ error: 'Rental item is required' }, { status: 400 });
    if (!startDate || !endDate) return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    if (endDate.getTime() <= startDate.getTime()) {
      return NextResponse.json({ error: 'Return date must be after the pickup date' }, { status: 400 });
    }

    const priced = priceOrder({ ...body, period, startDate, endDate });

    const order = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ctx.companyId})::bigint)`;
      return tx.rentalOrder.create({
        data: {
          orderNumber: await nextOrderNumber(tx, ctx.companyId),
          customerName,
          customerEmail: body.customerEmail ? String(body.customerEmail).trim() : null,
          customerPhone: body.customerPhone ? String(body.customerPhone).trim() : null,
          itemName,
          itemRef: body.itemRef ? String(body.itemRef).trim() : null,
          quantity: priced.quantity,
          period,
          unitPrice: priced.unitPrice,
          startDate,
          endDate,
          rentalFee: priced.rentalFee,
          deposit: priced.deposit,
          lateFee: priced.lateFee,
          total: priced.total,
          status,
          returnedAt: status === 'returned' ? new Date() : null,
          notes: body.notes ? String(body.notes) : null,
          companyId: ctx.companyId,
        },
      });
    });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'rental',
      entityId: order.id,
      action: 'created',
      actor: ctx.user,
      summary: `${order.orderNumber} · ${customerName} · ${money(order.total)}`,
    });

    return NextResponse.json({ order: present(order), periods: priced.periods }, { status: 201 });
  } catch (error) {
    console.error('Rental POST failed', error);
    return NextResponse.json({ error: 'Could not create this rental order' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Rental order id is required' }, { status: 400 });

    const existing = await prisma.rentalOrder.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Rental order not found' }, { status: 404 });

    const data: Prisma.RentalOrderUpdateInput = {};

    if (typeof body.customerName === 'string' && body.customerName.trim()) data.customerName = body.customerName.trim();
    if (body.customerEmail !== undefined) data.customerEmail = body.customerEmail ? String(body.customerEmail).trim() : null;
    if (body.customerPhone !== undefined) data.customerPhone = body.customerPhone ? String(body.customerPhone).trim() : null;
    if (typeof body.itemName === 'string' && body.itemName.trim()) data.itemName = body.itemName.trim();
    if (body.itemRef !== undefined) data.itemRef = body.itemRef ? String(body.itemRef).trim() : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;

    if (body.period !== undefined) {
      if (!PERIODS.includes(body.period)) return NextResponse.json({ error: 'Invalid rental period' }, { status: 400 });
      data.period = body.period;
    }
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      data.status = body.status;
      if (body.status === 'returned') data.returnedAt = existing.returnedAt || new Date();
      else data.returnedAt = null;
    }

    const startDate = cleanDate(body.startDate) || existing.startDate;
    const endDate = cleanDate(body.endDate) || existing.endDate;
    if (endDate.getTime() <= startDate.getTime()) {
      return NextResponse.json({ error: 'Return date must be after the pickup date' }, { status: 400 });
    }
    if (body.startDate !== undefined) data.startDate = startDate;
    if (body.endDate !== undefined) data.endDate = endDate;

    const priced = priceOrder({
      quantity: body.quantity !== undefined ? body.quantity : existing.quantity,
      unitPrice: body.unitPrice !== undefined ? body.unitPrice : existing.unitPrice,
      period: (data.period as string) || existing.period,
      startDate,
      endDate,
      deposit: body.deposit !== undefined ? body.deposit : existing.deposit,
      lateFee: body.lateFee !== undefined ? body.lateFee : existing.lateFee,
    });

    data.quantity = priced.quantity;
    data.unitPrice = priced.unitPrice;
    data.rentalFee = priced.rentalFee;
    data.deposit = priced.deposit;
    data.lateFee = priced.lateFee;
    data.total = priced.total;

    const order = await prisma.rentalOrder.update({ where: { id }, data });
    const statusChanged = existing.status !== order.status;

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'rental',
      entityId: order.id,
      action: statusChanged ? 'status_changed' : 'updated',
      actor: ctx.user,
      summary: statusChanged
        ? `${order.orderNumber}: ${existing.status} → ${order.status}`
        : `${order.orderNumber} updated`,
      changes: diffFields(
        existing as unknown as Record<string, unknown>,
        order as unknown as Record<string, unknown>,
        AUDITED_FIELDS,
      ),
    });

    return NextResponse.json({ order: present(order), periods: priced.periods });
  } catch (error) {
    console.error('Rental PUT failed', error);
    return NextResponse.json({ error: 'Could not update this rental order' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;
  if (!ctx.permissions.canDelete) return NextResponse.json({ error: 'Only an owner or admin can delete rental orders' }, { status: 403 });

  try {
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'Rental order id is required' }, { status: 400 });

    const existing = await prisma.rentalOrder.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Rental order not found' }, { status: 404 });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'rental',
      entityId: existing.id,
      action: 'deleted',
      actor: ctx.user,
      summary: `${existing.orderNumber} deleted`,
      changes: diffFields(existing as unknown as Record<string, unknown>, {}, AUDITED_FIELDS),
    });

    await prisma.rentalOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rental DELETE failed', error);
    return NextResponse.json({ error: 'Could not delete this rental order' }, { status: 500 });
  }
}
