import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePayrollCompany } from '@/lib/payroll-run';

// The payroll run list. One row per month, newest first.
//
// Everything to do with a single run - its payslips, marking it paid, deleting
// it, and the PDF / CSV exports - lives on /api/payroll/[id], so this handler
// stays a plain list that the screen and any saved bookmark can rely on.
export async function GET(req: NextRequest) {
  try {
    const user = await resolvePayrollCompany(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const runs = await prisma.payrollRun.findMany({
      where: { companyId: user.companyId },
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { payslips: true } } },
    });
    return NextResponse.json(runs);
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Legacy single-row create, kept so anything that still posts a bare total here
// keeps working. Only known fields are read: the body used to be spread
// straight into the database, which let a caller set its own id, status or
// processedBy. Real payroll goes through /api/payroll/generate.
export async function POST(req: NextRequest) {
  try {
    const user = await resolvePayrollCompany(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const period = typeof body.period === 'string' ? body.period.trim() : '';
    if (!period) return NextResponse.json({ error: 'Period is required' }, { status: 400 });

    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const endDate = body.endDate ? new Date(body.endDate) : new Date();
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid start or end date' }, { status: 400 });
    }

    const totalAmount = Number(body.totalAmount);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 });
    }

    const run = await prisma.payrollRun.create({
      data: {
        companyId: user.companyId,
        period,
        startDate,
        endDate,
        totalAmount,
        totalNet: totalAmount,
        status: body.status === 'paid' ? 'paid' : 'pending',
        notes: typeof body.notes === 'string' ? body.notes.slice(0, 2000) : null,
        processedBy: user.userId,
      },
    });
    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error('Error creating payroll:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
