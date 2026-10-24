import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const TYPES = ['fuel', 'service', 'repair', 'insurance', 'other'] as const;

async function getContext(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const role = (user.role || '').toLowerCase();

  return {
    companyId: user.companyId,
    canManage: user.isAdmin || role === 'owner' || role === 'admin' || adminEmails.includes(user.email.toLowerCase()),
  };
}

function optionalDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Keep the vehicle odometer in step with the highest reading ever logged. */
async function syncOdometer(vehicleId: string, reading: number | null) {
  if (!reading) return;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { odometer: true } });
  if (!vehicle) return;
  if (vehicle.odometer === null || reading > vehicle.odometer) {
    await prisma.vehicle.update({ where: { id: vehicleId }, data: { odometer: reading } });
  }
}

export async function GET(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const { searchParams } = new URL(req.url);

    const singleId = searchParams.get('id');
    if (singleId) {
      const log = await prisma.vehicleLog.findFirst({
        where: { id: singleId, companyId: context.companyId },
        include: { vehicle: { select: { id: true, name: true, registration: true } } },
      });
      if (!log) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      return NextResponse.json({ log });
    }

    const vehicleId = searchParams.get('vehicleId');
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: Record<string, unknown> = { companyId: context.companyId };
    if (vehicleId) where.vehicleId = vehicleId;
    if (type && type !== 'all') where.type = type;
    if (from || to) {
      const range: Record<string, Date> = {};
      const fromDate = optionalDate(from);
      const toDate = optionalDate(to);
      if (fromDate) range.gte = fromDate;
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        range.lte = toDate;
      }
      where.date = range;
    }

    const logs = await prisma.vehicleLog.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { vehicle: { select: { id: true, name: true, registration: true } } },
    });

    const fuel = logs.filter((log) => log.type === 'fuel');

    return NextResponse.json({
      logs,
      summary: {
        entries: logs.length,
        fuelCost: fuel.reduce((sum, log) => sum + (log.cost || 0), 0),
        litres: fuel.reduce((sum, log) => sum + (log.litres || 0), 0),
        serviceCost: logs.filter((log) => log.type !== 'fuel').reduce((sum, log) => sum + (log.cost || 0), 0),
        totalCost: logs.reduce((sum, log) => sum + (log.cost || 0), 0),
      },
      canManage: context.canManage,
    });
  } catch (error) {
    console.error('Error fetching vehicle logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const body = await req.json();
    const vehicleId = String(body.vehicleId || '');
    if (!vehicleId) return NextResponse.json({ error: 'Pick a vehicle for this entry' }, { status: 400 });

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, companyId: context.companyId } });
    if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });

    const date = optionalDate(body.date) || new Date();
    const cost = Number(body.cost) || 0;
    if (cost < 0) return NextResponse.json({ error: 'Cost cannot be negative' }, { status: 400 });

    const odometer = optionalNumber(body.odometer);

    const log = await prisma.vehicleLog.create({
      data: {
        vehicleId,
        type: TYPES.includes(body.type) ? body.type : 'fuel',
        date,
        litres: optionalNumber(body.litres),
        cost,
        odometer,
        vendor: body.vendor ? String(body.vendor).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
        companyId: context.companyId,
      },
      include: { vehicle: { select: { id: true, name: true, registration: true } } },
    });

    await syncOdometer(vehicleId, odometer);
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.vehicleLog.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.vehicleId !== undefined) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: String(body.vehicleId), companyId: context.companyId },
      });
      if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      data.vehicleId = vehicle.id;
    }
    if (body.type !== undefined) data.type = TYPES.includes(body.type) ? body.type : 'fuel';
    if (body.date !== undefined) data.date = optionalDate(body.date) || existing.date;
    if (body.cost !== undefined) {
      const cost = Number(body.cost) || 0;
      if (cost < 0) return NextResponse.json({ error: 'Cost cannot be negative' }, { status: 400 });
      data.cost = cost;
    }
    if (body.litres !== undefined) data.litres = optionalNumber(body.litres);
    if (body.odometer !== undefined) data.odometer = optionalNumber(body.odometer);
    if (body.vendor !== undefined) data.vendor = body.vendor ? String(body.vendor).trim() : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;

    const log = await prisma.vehicleLog.update({
      where: { id },
      data,
      include: { vehicle: { select: { id: true, name: true, registration: true } } },
    });

    await syncOdometer(log.vehicleId, optionalNumber(body.odometer));
    return NextResponse.json(log);
  } catch (error) {
    console.error('Error updating vehicle log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const existing = await prisma.vehicleLog.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    await prisma.vehicleLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
