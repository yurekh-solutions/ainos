import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function asDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Accepts either "HH:MM" (anchored to the attendance date) or a full timestamp.
function asTimestamp(value: unknown, base: Date): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.trim();
  const timeOnly = text.match(/^(\d{1,2}):(\d{2})$/);
  if (timeOnly) {
    const date = new Date(base);
    date.setHours(Number(timeOnly[1]), Number(timeOnly[2]), 0, 0);
    return date;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const employee = searchParams.get('employee');
    const month = searchParams.get('month');

    const where: Record<string, unknown> = { companyId: user.companyId };
    if (employee) where.employeeId = employee;
    if (month) {
      const [year, m] = month.split('-');
      where.date = {
        gte: new Date(Number(year), Number(m) - 1, 1),
        lt: new Date(Number(year), Number(m), 1)
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
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
    const emp = body.employee ? await prisma.employee.findUnique({ where: { id: body.employee } }) : null;
    const baseDate = body.date ? new Date(body.date) : new Date();
    const parseTime = (t: unknown) => {
      if (typeof t !== 'string' || !t.trim()) return null;
      const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
      if (m) {
        const d = new Date(baseDate);
        d.setHours(Number(m[1]), Number(m[2]), 0, 0);
        return d;
      }
      const d = new Date(t);
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const record = await prisma.attendance.create({
      data: {
        employeeId: emp?.id || body.employeeId || null,
        employeeName: body.employeeName || emp?.name || body.employee || null,
        date: baseDate,
        checkIn: parseTime(body.checkIn),
        checkOut: parseTime(body.checkOut),
        status: body.status || 'present',
        notes: body.notes || null,
        companyId: user.companyId,
      }
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const id = asText(body.id);
    if (!id) return NextResponse.json({ error: 'Attendance ID is required' }, { status: 400 });

    // Tenant isolation: only records owned by the caller's company can be edited.
    const existing = await prisma.attendance.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });

    const data: Prisma.AttendanceUncheckedUpdateInput = {};

    let baseDate = existing.date;
    if (body.date !== undefined) {
      const date = asDate(body.date);
      if (!date) return NextResponse.json({ error: 'Invalid attendance date' }, { status: 400 });
      data.date = date;
      baseDate = date;
    }

    const employeeId = asText(body.employeeId ?? body.employee);
    if (employeeId) {
      const employee = await prisma.employee.findFirst({ where: { id: employeeId, companyId: user.companyId } });
      if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 400 });
      data.employeeId = employee.id;
      if (body.employeeName === undefined) data.employeeName = employee.name;
    }
    if (body.employeeName !== undefined) data.employeeName = asText(body.employeeName);

    for (const field of ['checkIn', 'checkOut'] as const) {
      if (body[field] === undefined) continue;
      const raw = body[field];
      if (raw === null || (typeof raw === 'string' && !raw.trim())) {
        data[field] = null;
        continue;
      }
      const value = asTimestamp(raw, baseDate);
      if (!value) {
        const label = field === 'checkIn' ? 'check-in' : 'check-out';
        return NextResponse.json({ error: `Invalid ${label} time` }, { status: 400 });
      }
      data[field] = value;
    }

    if (body.status !== undefined) {
      const status = asText(body.status);
      if (!status) return NextResponse.json({ error: 'Status cannot be empty' }, { status: 400 });
      data.status = status.toLowerCase();
    }
    if (body.notes !== undefined) data.notes = asText(body.notes);

    // The attendance table stores timestamps only, so a submitted `hours` value is
    // not persisted; worked hours stay derived from checkIn/checkOut.

    if (Object.keys(data).length === 0) return NextResponse.json(existing);

    const record = await prisma.attendance.update({ where: { id }, data });
    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const id = asText(new URL(req.url).searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'Attendance ID is required' }, { status: 400 });

    const existing = await prisma.attendance.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });

    await prisma.attendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }
    console.error('Error deleting attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
