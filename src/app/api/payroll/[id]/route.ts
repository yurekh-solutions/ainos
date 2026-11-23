import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PayrollError, findRun, markRunPaid, resolvePayrollCompany } from '@/lib/payroll-run';

// One payroll run: its payslips for the detail screen, the paid/unpaid switch,
// and removal. Everything is scoped by company, because the only thing a caller
// supplies is the run id.

type Context = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  try {
    const user = await resolvePayrollCompany(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const run = await findRun(user.companyId, id);
    if (!run) return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    return NextResponse.json(run);
  } catch (error) {
    console.error('Error fetching payroll run:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Marks the run paid (default) or puts it back to pending when a mistake was made. */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const user = await resolvePayrollCompany(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const paid = body?.status === 'pending' ? false : true;

    const owned = await prisma.payrollRun.findFirst({ where: { id, companyId: user.companyId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });

    const run = await markRunPaid(user.companyId, id, paid);
    return NextResponse.json(run);
  } catch (error) {
    if (error instanceof PayrollError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Error updating payroll run:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  try {
    const user = await resolvePayrollCompany(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const owned = await prisma.payrollRun.findFirst({ where: { id, companyId: user.companyId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });

    // Payslips fall away with the run through the cascade on their relation.
    await prisma.payrollRun.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payroll run:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
