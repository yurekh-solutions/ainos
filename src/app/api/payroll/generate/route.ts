import { NextRequest, NextResponse } from 'next/server';
import {
  PayrollError,
  buildPayslipRows,
  createPayrollRun,
  employeesForRun,
  loadAbsentDays,
  loadPayrollSetup,
  resolvePayrollCompany,
} from '@/lib/payroll-run';
import type { PayslipAdjustments } from '@/lib/payroll';

// Runs payroll for a month.
//
//   dryRun: true  -> nothing is saved; the screen uses this to show the split
//                    and to let a person adjust one employee's figures.
//   dryRun: false -> the run and one payslip per employee are written.
//
// Keeping both on one endpoint means the number on screen is produced by the
// same code as the number in the database, so a preview can never disagree with
// the payslip that gets downloaded.
export async function POST(req: NextRequest) {
  try {
    const user = await resolvePayrollCompany(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const period = typeof body.period === 'string' ? body.period.trim().slice(0, 40) : '';
    if (!period) return NextResponse.json({ error: 'Period is required, e.g. "November 2026"' }, { status: 400 });

    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;
    if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'A valid start date and end date are required' }, { status: 400 });
    }
    if (endDate < startDate) return NextResponse.json({ error: 'End date cannot be before start date' }, { status: 400 });

    const employeeIds = Array.isArray(body.employeeIds)
      ? body.employeeIds.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0).slice(0, 500)
      : undefined;

    // Only numbers reach the calculator; anything else is ignored rather than
    // trusted, so a stray string from the browser cannot poison a payslip.
    const overrides: Record<string, PayslipAdjustments> = {};
    if (body.overrides && typeof body.overrides === 'object') {
      for (const [employeeId, raw] of Object.entries(body.overrides as Record<string, unknown>)) {
        if (!raw || typeof raw !== 'object') continue;
        const clean: Record<string, number> = {};
        for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
          const n = Number(value);
          if (Number.isFinite(n) && n >= 0 && n < 100_000_000) clean[key] = n;
        }
        if (Object.keys(clean).length) overrides[employeeId] = clean as PayslipAdjustments;
      }
    }

    const dryRun = body.dryRun === true;
    const { settings, company } = await loadPayrollSetup(user.companyId);
    const employees = await employeesForRun(user.companyId, employeeIds);

    const absentDays = await loadAbsentDays(
      user.companyId,
      employees.map((e) => e.id),
      startDate,
      endDate,
    );

    const rows = buildPayslipRows(employees, settings, absentDays, overrides);
    if (!rows.length) {
      return NextResponse.json({
        error: 'No employee with a monthly salary was found. Add salaries on the Employees page first.',
      }, { status: 400 });
    }

    const totals = {
      employees: rows.length,
      earnings: Math.round(rows.reduce((s, r) => s + r.breakdown.grossEarnings, 0) * 100) / 100,
      deductions: Math.round(rows.reduce((s, r) => s + r.breakdown.totalDeductions, 0) * 100) / 100,
      netPay: Math.round(rows.reduce((s, r) => s + r.breakdown.netPay, 0) * 100) / 100,
      employerContributions: Math.round(rows.reduce((s, r) => s + r.breakdown.employerTotal, 0) * 100) / 100,
      costToCompany: Math.round(rows.reduce((s, r) => s + r.breakdown.totalCostToCompany, 0) * 100) / 100,
    };

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        period,
        startDate,
        endDate,
        settings,
        companyName: company.name,
        totals,
        payslips: rows,
        // Employees in the company but skipped, so the screen can say why the
        // count is lower than the team size instead of looking like a bug.
        skipped: employees.length - rows.length,
      });
    }

    const run = await createPayrollRun({
      companyId: user.companyId,
      processedBy: user.userId,
      period,
      startDate,
      endDate,
      rows,
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 2000) : null,
    });

    return NextResponse.json({ run, totals }, { status: 201 });
  } catch (error) {
    if (error instanceof PayrollError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error generating payroll:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
