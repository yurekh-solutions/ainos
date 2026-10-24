import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const STATUSES = ['active', 'in_service', 'retired'] as const;
const TYPES = ['car', 'van', 'truck', 'bike'] as const;

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

export async function GET(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const { searchParams } = new URL(req.url);

    const singleId = searchParams.get('id');
    if (singleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: singleId, companyId: context.companyId },
        include: { logs: { orderBy: { date: 'desc' }, take: 25 } },
      });
      if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      return NextResponse.json({ vehicle });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const vehicles = await prisma.vehicle.findMany({
      where: { companyId: context.companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        logs: {
          where: { date: { gte: monthStart } },
          select: { type: true, cost: true, litres: true, date: true },
        },
      },
    });

    const rows = vehicles.map((vehicle) => {
      const fuel = vehicle.logs.filter((log) => log.type === 'fuel');
      return {
        id: vehicle.id,
        name: vehicle.name,
        registration: vehicle.registration,
        type: vehicle.type,
        driver: vehicle.driver,
        odometer: vehicle.odometer,
        insuranceUntil: vehicle.insuranceUntil,
        fitnessUntil: vehicle.fitnessUntil,
        status: vehicle.status,
        notes: vehicle.notes,
        fuelMonth: fuel.reduce((sum, log) => sum + (log.cost || 0), 0),
        litresMonth: fuel.reduce((sum, log) => sum + (log.litres || 0), 0),
        otherMonth: vehicle.logs
          .filter((log) => log.type !== 'fuel')
          .reduce((sum, log) => sum + (log.cost || 0), 0),
      };
    });

    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiring = (value: Date | null) => Boolean(value && value <= soon);

    return NextResponse.json({
      vehicles: rows,
      summary: {
        total: rows.length,
        inService: rows.filter((vehicle) => vehicle.status === 'in_service').length,
        fuelMonth: rows.reduce((sum, vehicle) => sum + vehicle.fuelMonth, 0),
        serviceMonth: rows.reduce((sum, vehicle) => sum + vehicle.otherMonth, 0),
        docsExpiring: rows.filter((vehicle) => expiring(vehicle.insuranceUntil) || expiring(vehicle.fitnessUntil)).length,
      },
      canManage: context.canManage,
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const context = await getContext(req);
  if (context instanceof NextResponse) return context;

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Vehicle name is required' }, { status: 400 });

    const vehicle = await prisma.vehicle.create({
      data: {
        name,
        registration: body.registration ? String(body.registration).trim().toUpperCase() : null,
        type: TYPES.includes(body.type) ? body.type : 'car',
        driver: body.driver ? String(body.driver).trim() : null,
        odometer: optionalNumber(body.odometer),
        insuranceUntil: optionalDate(body.insuranceUntil),
        fitnessUntil: optionalDate(body.fitnessUntil),
        status: STATUSES.includes(body.status) ? body.status : 'active',
        notes: body.notes ? String(body.notes).trim() : null,
        companyId: context.companyId,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
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

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    if (!context.canManage) {
      return NextResponse.json({ error: 'Only an owner or admin can edit vehicles' }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: 'Vehicle name cannot be empty' }, { status: 400 });
      data.name = name;
    }
    if (body.registration !== undefined) {
      data.registration = body.registration ? String(body.registration).trim().toUpperCase() : null;
    }
    if (body.type !== undefined) data.type = TYPES.includes(body.type) ? body.type : 'car';
    if (body.driver !== undefined) data.driver = body.driver ? String(body.driver).trim() : null;
    if (body.odometer !== undefined) data.odometer = optionalNumber(body.odometer);
    if (body.insuranceUntil !== undefined) data.insuranceUntil = optionalDate(body.insuranceUntil);
    if (body.fitnessUntil !== undefined) data.fitnessUntil = optionalDate(body.fitnessUntil);
    if (body.status !== undefined) data.status = STATUSES.includes(body.status) ? body.status : 'active';
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;

    const vehicle = await prisma.vehicle.update({ where: { id }, data });
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
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

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.companyId !== context.companyId) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    if (!context.canManage) {
      return NextResponse.json({ error: 'Only an owner or admin can delete vehicles' }, { status: 403 });
    }

    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
