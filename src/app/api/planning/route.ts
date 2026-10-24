import { NextResponse, type NextRequest } from 'next/server';
import { Prisma, type Shift } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/permissions';
import { diffFields, recordAudit } from '@/lib/audit';

const STATUSES = ['planned', 'confirmed', 'done', 'absent', 'cancelled'];
const INACTIVE = ['cancelled', 'absent'];

const AUDITED_FIELDS = ['employeeName', 'role', 'startAt', 'endAt', 'location', 'status', 'notes'];

function cleanDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hours(startAt: Date, endAt: Date): number {
  return Math.round(((endAt.getTime() - startAt.getTime()) / 3600000) * 100) / 100;
}

function present(shift: Shift) {
  return { ...shift, hours: hours(shift.startAt, shift.endAt) };
}

/**
 * Odoo blocks overlapping allocations for the same resource; so do we. Any shift
 * that is not cancelled/absent and whose window intersects the candidate counts
 * as a clash.
 */
async function findClash(
  companyId: string,
  employeeName: string,
  startAt: Date,
  endAt: Date,
  excludeId?: string,
) {
  return prisma.shift.findFirst({
    where: {
      companyId,
      employeeName: { equals: employeeName, mode: 'insensitive' },
      status: { notIn: INACTIVE },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true, startAt: true, endAt: true },
  });
}

function clashMessage(clash: { startAt: Date; endAt: Date }) {
  return `This person is already booked ${clash.startAt.toISOString()} → ${clash.endAt.toISOString()}`;
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
      const shift = await prisma.shift.findFirst({ where: { id, companyId: ctx.companyId } });
      if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
      return NextResponse.json({ shift: present(shift), canManage: ctx.canManage });
    }

    const where: Prisma.ShiftWhereInput = { companyId: ctx.companyId };
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { employeeName: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const shifts = await prisma.shift.findMany({ where, orderBy: { startAt: 'asc' }, take: 300 });

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const weekStart = new Date(dayStart);
    const weekday = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - weekday);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const inSevenDays = new Date(dayStart);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const [today, upcoming, planned, weekShifts] = await Promise.all([
      prisma.shift.count({ where: { companyId: ctx.companyId, startAt: { gte: dayStart, lt: dayEnd } } }),
      prisma.shift.count({
        where: { companyId: ctx.companyId, startAt: { gte: new Date(), lt: inSevenDays }, status: { in: ['planned', 'confirmed'] } },
      }),
      prisma.shift.count({ where: { companyId: ctx.companyId, status: 'planned', startAt: { gte: new Date() } } }),
      prisma.shift.findMany({
        where: { companyId: ctx.companyId, startAt: { gte: weekStart, lt: weekEnd }, status: { not: 'cancelled' } },
        select: { startAt: true, endAt: true },
      }),
    ]);

    const weekHours = Math.round(weekShifts.reduce((total, row) => total + Math.max(0, (row.endAt.getTime() - row.startAt.getTime()) / 3600000), 0) * 100) / 100;

    return NextResponse.json({
      shifts: shifts.map(present),
      summary: { today, upcoming, planned, weekHours },
      canManage: ctx.canManage,
    });
  } catch (error) {
    console.error('Planning GET failed', error);
    return NextResponse.json({ error: 'Could not load the shift plan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const employeeName = String(body.employeeName || '').trim();
    const startAt = cleanDate(body.startAt);
    const endAt = cleanDate(body.endAt);

    if (!employeeName) return NextResponse.json({ error: 'Employee name is required' }, { status: 400 });
    if (!startAt || !endAt) return NextResponse.json({ error: 'Shift start and end are required' }, { status: 400 });
    if (endAt.getTime() <= startAt.getTime()) {
      return NextResponse.json({ error: 'Shift end must be after the start' }, { status: 400 });
    }

    const status = STATUSES.includes(body.status) ? body.status : 'planned';

    if (!INACTIVE.includes(status)) {
      const clash = await findClash(ctx.companyId, employeeName, startAt, endAt);
      if (clash) return NextResponse.json({ error: clashMessage(clash) }, { status: 409 });
    }

    const shift = await prisma.shift.create({
      data: {
        employeeName,
        role: body.role ? String(body.role).trim() : null,
        startAt,
        endAt,
        location: body.location ? String(body.location).trim() : null,
        status,
        notes: body.notes ? String(body.notes) : null,
        companyId: ctx.companyId,
      },
    });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'shift',
      entityId: shift.id,
      action: 'created',
      actor: ctx.user,
      summary: `${employeeName} · ${startAt.toISOString()} · ${hours(startAt, endAt)}h`,
    });

    return NextResponse.json({ shift: present(shift) }, { status: 201 });
  } catch (error) {
    console.error('Planning POST failed', error);
    return NextResponse.json({ error: 'Could not create this shift' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Shift id is required' }, { status: 400 });

    const existing = await prisma.shift.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Shift not found' }, { status: 404 });

    const data: Prisma.ShiftUpdateInput = {};
    if (typeof body.employeeName === 'string' && body.employeeName.trim()) data.employeeName = body.employeeName.trim();
    if (body.role !== undefined) data.role = body.role ? String(body.role).trim() : null;
    if (body.location !== undefined) data.location = body.location ? String(body.location).trim() : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      data.status = body.status;
    }

    const startAt = cleanDate(body.startAt) || existing.startAt;
    const endAt = cleanDate(body.endAt) || existing.endAt;
    if (endAt.getTime() <= startAt.getTime()) {
      return NextResponse.json({ error: 'Shift end must be after the start' }, { status: 400 });
    }
    if (body.startAt !== undefined) data.startAt = startAt;
    if (body.endAt !== undefined) data.endAt = endAt;

    const nextStatus = (data.status as string) || existing.status;
    if (!INACTIVE.includes(nextStatus)) {
      const employeeName = (data.employeeName as string) || existing.employeeName;
      const clash = await findClash(ctx.companyId, employeeName, startAt, endAt, id);
      if (clash) return NextResponse.json({ error: clashMessage(clash) }, { status: 409 });
    }

    const shift = await prisma.shift.update({ where: { id }, data });

    const statusChanged = shift.status !== existing.status;
    await recordAudit({
      companyId: ctx.companyId,
      entity: 'shift',
      entityId: shift.id,
      action: statusChanged ? 'status_changed' : 'updated',
      actor: ctx.user,
      summary: statusChanged
        ? `${shift.employeeName}: ${existing.status} → ${shift.status}`
        : `${shift.employeeName} shift updated`,
      changes: diffFields(
        existing as unknown as Record<string, unknown>,
        shift as unknown as Record<string, unknown>,
        AUDITED_FIELDS,
      ),
    });

    return NextResponse.json({ shift: present(shift) });
  } catch (error) {
    console.error('Planning PUT failed', error);
    return NextResponse.json({ error: 'Could not update this shift' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireSession(req);
  if (ctx.error) return ctx.error;
  if (!ctx.permissions.canDelete) return NextResponse.json({ error: 'Only an owner or admin can delete shifts' }, { status: 403 });

  try {
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: 'Shift id is required' }, { status: 400 });

    const existing = await prisma.shift.findFirst({ where: { id, companyId: ctx.companyId } });
    if (!existing) return NextResponse.json({ error: 'Shift not found' }, { status: 404 });

    await recordAudit({
      companyId: ctx.companyId,
      entity: 'shift',
      entityId: existing.id,
      action: 'deleted',
      actor: ctx.user,
      summary: `${existing.employeeName} shift deleted`,
      changes: diffFields(existing as unknown as Record<string, unknown>, {}, AUDITED_FIELDS),
    });

    await prisma.shift.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Planning DELETE failed', error);
    return NextResponse.json({ error: 'Could not delete this shift' }, { status: 500 });
  }
}
