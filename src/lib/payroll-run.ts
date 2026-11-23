// Server-side payroll orchestration.
//
// The generate endpoint, the payslip PDF, the combined payslip file and the bank
// salary transfer sheet all need exactly the same rows, so the tenant lookup,
// the statutory settings, the attendance-to-loss-of-pay step and the run write
// live here once instead of being copied into every route.

import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { PayslipDocContext } from '@/lib/payroll-pdf';
import {
  computePayslip,
  parseSalaryStructure,
  round2,
  settingsFromConfig,
  type PayrollSettings,
  type PayslipAdjustments,
  type PayslipBreakdown,
} from '@/lib/payroll';

/** Session + owning company, the same way every other money route resolves it. */
export async function resolvePayrollCompany(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return null;
  return { userId: user.id, companyId: user.companyId };
}

export interface PayrollSetup {
  companyId: string;
  settings: PayrollSettings;
  company: {
    id: string;
    name: string;
    address: string | null;
    gstNumber: string | null;
    state: string | null;
    email: string | null;
    phone: string | null;
  };
  config: {
    pfNumber: string | null;
    esiNumber: string | null;
    companyCode: string | null;
    footerNote: string | null;
  } | null;
}

export async function loadPayrollSetup(companyId: string): Promise<PayrollSetup> {
  const [company, config] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, address: true, gstNumber: true, state: true, email: true, phone: true },
    }),
    prisma.payrollConfig.findUnique({ where: { companyId } }),
  ]);

  if (!company) throw new PayrollError('Company not found', 404);

  return {
    companyId,
    settings: settingsFromConfig(config),
    company,
    config: config
      ? {
        pfNumber: config.pfNumber,
        esiNumber: config.esiNumber,
        companyCode: config.companyCode,
        footerNote: config.payslipFooterNote,
      }
      : null,
  };
}

export class PayrollError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PayrollError';
    this.status = status;
  }
}

/**
 * Absent days per employee inside the pay period.
 *
 * Only `absent` reduces pay: `leave` is paid leave and `holiday` is a working
 * day the shop was shut. When an employee has no attendance rows at all for the
 * period - the common case for a company that does not mark attendance - they
 * are paid in full, so payroll never depends on attendance being maintained.
 */
export async function loadAbsentDays(
  companyId: string,
  employeeIds: string[],
  startDate: Date,
  endDate: Date,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!employeeIds.length) return out;
  try {
    const grouped = await prisma.attendance.groupBy({
      by: ['employeeId', 'status'],
      where: { companyId, employeeId: { in: employeeIds }, date: { gte: startDate, lte: endDate } },
      _count: { _all: true },
    });
    for (const row of grouped) {
      if (!row.employeeId) continue;
      const count = row._count?._all ?? 0;
      if (row.status === 'absent') out.set(row.employeeId, (out.get(row.employeeId) ?? 0) + count);
    }
  } catch (error) {
    // Attendance is an enhancement, never a blocker for paying people.
    console.error('[Payroll] Attendance summary failed:', error);
  }
  return out;
}

export interface PayslipRow {
  employeeId: string;
  employeeName: string;
  designatory: string | null;
  department: string | null;
  employeeCode: string | null;
  uanNumber: string | null;
  esiNumber: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  bankName: string | null;
  joinedAt: Date | null;
  gross: number;
  absentDays: number;
  breakdown: PayslipBreakdown;
}

interface EmployeeRecord {
  id: string;
  name: string;
  position: string | null;
  department: string | null;
  salary: number | null;
  joinDate: Date | null;
  employeeCode: string | null;
  pfNumber: string | null;
  esiNumber: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  salaryStructure: unknown;
}

/**
 * Builds one payslip per employee.
 *
 * Precedence, lowest to highest: statutory company defaults → the employee's
 * saved salary structure → a value typed in for this run. The last one wins so a
 * person running payroll can fix a single month without editing master data.
 */
export function buildPayslipRows(
  employees: EmployeeRecord[],
  settings: PayrollSettings,
  absentDays: Map<string, number>,
  overrides: Record<string, PayslipAdjustments> = {},
): PayslipRow[] {
  const rows: PayslipRow[] = [];

  for (const emp of employees) {
    const gross = round2(Number(emp.salary) || 0);
    if (gross <= 0) continue;

    const adjustment: PayslipAdjustments = {
      ...parseSalaryStructure(emp.salaryStructure),
      ...(overrides[emp.id] || {}),
    };

    // Attendance only speaks when the caller has not already fixed the days.
    if (adjustment.daysPresent === undefined) {
      const absent = absentDays.get(emp.id) ?? 0;
      if (absent > 0) adjustment.daysPresent = Math.max(0, settings.workingDaysPerMonth - absent);
    }

    const breakdown = computePayslip({ gross, settings, adjustments: adjustment });
    const absentDaysForRun = Math.max(0, breakdown.totalWorkingDays - breakdown.daysPresent);

    rows.push({
      employeeId: emp.id,
      employeeName: emp.name,
      designatory: emp.position,
      department: emp.department,
      employeeCode: emp.employeeCode,
      uanNumber: emp.pfNumber,
      esiNumber: emp.esiNumber,
      bankAccountNumber: emp.bankAccountNumber,
      bankIfscCode: emp.bankIfscCode,
      bankName: emp.bankName,
      joinedAt: emp.joinDate,
      gross,
      absentDays: absentDaysForRun,
      breakdown,
    });
  }

  return rows;
}

/** Every active employee of the company, or only the requested ones. */
export async function employeesForRun(companyId: string, employeeIds?: string[]) {
  const where: Record<string, unknown> = { companyId, status: 'active' };
  if (Array.isArray(employeeIds) && employeeIds.length) where.id = { in: employeeIds };
  return prisma.employee.findMany({ where, orderBy: { name: 'asc' } });
}

/** Payslip fields straight off a computed row - one mapping, used twice. */
function payslipData(row: PayslipRow, companyId: string, payrollRunId: string, period: string, startDate: Date, endDate: Date) {
  const b = row.breakdown;
  return {
    payrollRunId,
    employeeId: row.employeeId,
    companyId,
    period,
    startDate,
    endDate,
    employeeName: row.employeeName,
    designatory: row.designatory,
    department: row.department,
    employeeCode: row.employeeCode,
    uanNumber: row.uanNumber,
    esiNumber: row.esiNumber,
    bankAccountNumber: row.bankAccountNumber,
    bankIfscCode: row.bankIfscCode,
    bankName: row.bankName,
    joinedAt: row.joinedAt,
    basic: b.basic,
    hra: b.hra,
    specialAllowance: b.specialAllowance,
    conveyance: b.conveyance,
    overtime: b.overtime,
    bonus: b.bonus,
    arrears: b.arrears,
    otherEarnings: b.otherEarnings,
    grossEarnings: b.grossEarnings,
    pfEmployee: b.pfEmployee,
    esiEmployee: b.esiEmployee,
    professionalTax: b.professionalTax,
    incomeTax: b.incomeTax,
    loanDeduction: b.loanDeduction,
    advanceDeduction: b.advanceDeduction,
    lossOfPay: b.lossOfPay,
    otherDeductions: b.otherDeductions,
    totalDeductions: b.totalDeductions,
    netPay: b.netPay,
    pfEmployer: b.pfEmployer,
    esiEmployer: b.esiEmployer,
    employerTotal: b.employerTotal,
    totalWorkingDays: b.totalWorkingDays,
    daysPresent: b.daysPresent,
    status: 'pending',
  };
}

export interface CreateRunInput {
  companyId: string;
  processedBy: string | null;
  period: string;
  startDate: Date;
  endDate: Date;
  rows: PayslipRow[];
  notes?: string | null;
}

/**
 * Writes the run and its payslips in one transaction.
 *
 * `totalAmount` keeps its old meaning of "what the company pays out", so the
 * bank sheet and the run list agree; the three new totals make the breakdown
 * readable without adding them up by hand.
 */
export async function createPayrollRun(input: CreateRunInput) {
  const { companyId, processedBy, period, startDate, endDate, rows, notes } = input;
  if (!rows.length) throw new PayrollError('No employee with a salary is selected, so there is nothing to pay.', 400);

  const totalEarnings = round2(rows.reduce((sum, r) => sum + r.breakdown.grossEarnings, 0));
  const totalDeductions = round2(rows.reduce((sum, r) => sum + r.breakdown.totalDeductions, 0));
  const totalNet = round2(rows.reduce((sum, r) => sum + r.breakdown.netPay, 0));

  return prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.create({
      data: {
        companyId,
        period,
        startDate,
        endDate,
        totalAmount: totalNet,
        totalEarnings,
        totalDeductions,
        totalNet,
        employeeCount: rows.length,
        notes: notes ?? null,
        status: 'pending',
        processedBy,
      },
    });

    await tx.payslip.createMany({
      data: rows.map((row) => payslipData(row, companyId, run.id, period, startDate, endDate)),
    });

    return tx.payrollRun.findUniqueOrThrow({
      where: { id: run.id },
      include: { payslips: { orderBy: { employeeName: 'asc' } } },
    });
  });
}

/**
 * Stamps a run paid or back to pending, and every payslip under it at the same
 * moment so the two can never disagree about what has been paid.
 */
export async function markRunPaid(companyId: string, runId: string, paid = true) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.update({ where: { id: runId, companyId }, data: { status: paid ? 'paid' : 'pending' } });
    await tx.payslip.updateMany({
      where: { payrollRunId: runId, companyId },
      data: paid ? { status: 'paid', paidAt: now } : { status: 'pending', paidAt: null },
    });
    return run;
  });
}

/** Reads one run with its payslips, scoped to the caller's company. */
export async function findRun(companyId: string, runId: string) {
  return prisma.payrollRun.findFirst({
    where: { id: runId, companyId },
    include: { payslips: { orderBy: { employeeName: 'asc' } } },
  });
}

/**
 * Payslips of a run, always filtered by company as well as run id.
 *
 * A document download takes only the run id, so the company check is what stops
 * one tenant from printing another tenant's salary slips.
 */
export async function payslipsForRun(companyId: string, runId: string, employeeIds?: string[]) {
  const run = await prisma.payrollRun.findFirst({
    where: { id: runId, companyId },
    select: { id: true, period: true, status: true },
  });
  if (!run) throw new PayrollError('Payroll run not found', 404);

  const where: Record<string, unknown> = { payrollRunId: runId, companyId };
  if (Array.isArray(employeeIds) && employeeIds.length) where.employeeId = { in: employeeIds };

  const payslips = await prisma.payslip.findMany({ where, orderBy: { employeeName: 'asc' } });
  if (!payslips.length) throw new PayrollError('This payroll run has no payslips to export yet', 404);
  return { run, payslips };
}

/** Company letterhead for a payslip, from the same lookup the run used. */
export function payslipDocContext(setup: PayrollSetup): PayslipDocContext {
  return {
    companyName: setup.company.name,
    address: setup.company.address,
    gstNumber: setup.company.gstNumber,
    state: setup.company.state,
    email: setup.company.email,
    phone: setup.company.phone,
    pfNumber: setup.config?.pfNumber ?? null,
    esiNumber: setup.config?.esiNumber ?? null,
    companyCode: setup.config?.companyCode ?? null,
    footerNote: setup.config?.footerNote ?? null,
  };
}
