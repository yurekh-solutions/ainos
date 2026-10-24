import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const where: Record<string, unknown> = { companyId: user.companyId };
    if (status) where.status = status;

    const leaves = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
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
    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: emp?.id || body.employeeId || null,
        employeeName: body.employeeName || emp?.name || body.employee || null,
        leaveType: body.leaveType || 'casual',
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : new Date(),
        reason: body.reason || null,
        status: body.status || 'pending',
        companyId: user.companyId,
      }
    });
    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error('Error creating leave:', error);
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
    if (!id) return NextResponse.json({ error: 'Leave request ID is required' }, { status: 400 });

    // Tenant isolation: only leave requests owned by the caller's company can be edited.
    const existing = await prisma.leaveRequest.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });

    const data: Prisma.LeaveRequestUncheckedUpdateInput = {};

    // Status drives the approve / reject workflow, so it is validated explicitly.
    if (body.status !== undefined) {
      const status = asText(body.status)?.toLowerCase();
      if (!status || !LEAVE_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Expected one of: ${LEAVE_STATUSES.join(', ')}` },
          { status: 400 },
        );
      }
      data.status = status;
    }

    if (body.approvedBy !== undefined) {
      data.approvedBy = asText(body.approvedBy);
    } else if (data.status === 'approved' && !existing.approvedBy) {
      data.approvedBy = session.user.name || session.user.email;
    } else if (data.status && data.status !== 'approved' && existing.approvedBy) {
      data.approvedBy = null;
    }

    const employeeId = asText(body.employeeId ?? body.employee);
    if (employeeId) {
      const employee = await prisma.employee.findFirst({ where: { id: employeeId, companyId: user.companyId } });
      if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 400 });
      data.employeeId = employee.id;
      if (body.employeeName === undefined) data.employeeName = employee.name;
    }
    if (body.employeeName !== undefined) data.employeeName = asText(body.employeeName);

    if (body.leaveType !== undefined) {
      const leaveType = asText(body.leaveType);
      if (!leaveType) return NextResponse.json({ error: 'Leave type cannot be empty' }, { status: 400 });
      data.leaveType = leaveType.toLowerCase();
    }

    let startDate = existing.startDate;
    let endDate = existing.endDate;
    if (body.startDate !== undefined) {
      const parsed = asDate(body.startDate);
      if (!parsed) return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
      data.startDate = parsed;
      startDate = parsed;
    }
    if (body.endDate !== undefined) {
      const parsed = asDate(body.endDate);
      if (!parsed) return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
      data.endDate = parsed;
      endDate = parsed;
    }
    if (endDate.getTime() < startDate.getTime()) {
      return NextResponse.json({ error: 'End date cannot be earlier than start date' }, { status: 400 });
    }

    if (body.reason !== undefined) data.reason = asText(body.reason);

    if (Object.keys(data).length === 0) return NextResponse.json(existing);

    const leave = await prisma.leaveRequest.update({ where: { id }, data });
    return NextResponse.json(leave);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }
    console.error('Error updating leave:', error);
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
    if (!id) return NextResponse.json({ error: 'Leave request ID is required' }, { status: 400 });

    const existing = await prisma.leaveRequest.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });

    await prisma.leaveRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }
    console.error('Error deleting leave:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
