import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const timesheets = await prisma.timesheet.findMany({
      where: { companyId: user.companyId },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(timesheets);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
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
    const toMinutes = (t: unknown) => {
      const m = typeof t === 'string' ? t.trim().match(/^(\d{1,2}):(\d{2})$/) : null;
      return m ? Number(m[1]) * 60 + Number(m[2]) : null;
    };
    let hours = Number(body.hours);
    if (!Number.isFinite(hours) || hours <= 0) hours = Number(body.duration);
    if (!Number.isFinite(hours) || hours <= 0) {
      const start = toMinutes(body.startTime);
      const end = toMinutes(body.endTime);
      if (start !== null && end !== null && end > start) hours = Math.round(((end - start) / 60) * 100) / 100;
    }
    const timesheet = await prisma.timesheet.create({
      data: {
        employeeId: body.employeeId || null,
        employeeName: body.employeeName || body.employee || null,
        date: body.date ? new Date(body.date) : new Date(),
        hours: hours && hours > 0 ? hours : 0,
        project: body.project || null,
        task: body.task || null,
        notes: body.notes || null,
        status: body.status || 'draft',
        companyId: user.companyId,
      }
    });
    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const timesheet = await prisma.timesheet.update({ where: { id }, data });
    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('Error updating timesheet:', error);
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

    await prisma.timesheet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
