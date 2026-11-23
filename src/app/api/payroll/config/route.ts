import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_PAYROLL_SETTINGS, settingsFromConfig } from '@/lib/payroll';
import { resolvePayrollCompany } from '@/lib/payroll-run';

// Payroll settings for the company: how a gross salary is split and which
// statutory contributions apply.
//
// Nothing here is required. A company that never opens this screen keeps the
// national statutory defaults, so the first payroll run already produces a
// correct payslip. This screen exists for the cases where those defaults need
// changing - a wage-only team with no PF, a different working-days month, or the
// professional tax slab of the state the shop is registered in.
//
// Ratios are validated rather than trusted: a payslip is a statutory document,
// and "basic = 900% of gross" would print nonsense that an employee then has to
// explain to an auditor.

/** Inclusive range check. Returns the number, or an error string. */
function within(value: unknown, min: number, max: number, label: string): number | string {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${label} must be a number`;
  if (n < min || n > max) return `${label} must be between ${min} and ${max}`;
  return n;
}

function text(value: unknown, max: number): string | null {
  if (value === null || value === undefined) return null;
  const t = String(value).trim();
  return t.length ? t.slice(0, max) : null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await resolvePayrollCompany(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const config = await prisma.payrollConfig.findUnique({ where: { companyId: user.companyId } });

    return NextResponse.json({
      // `settings` is what the calculator will actually use - the saved values
      // with any gap filled by the statutory default.
      settings: settingsFromConfig(config),
      configured: Boolean(config),
      defaults: DEFAULT_PAYROLL_SETTINGS,
      identity: {
        pfNumber: config?.pfNumber ?? null,
        esiNumber: config?.esiNumber ?? null,
        companyCode: config?.companyCode ?? null,
        footerNote: config?.payslipFooterNote ?? null,
      },
    });
  } catch (error) {
    console.error('Error fetching payroll config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Saves the settings. Only fields that were sent are written. */
export async function PUT(req: NextRequest) {
  try {
    const user = await resolvePayrollCompany(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'A settings object is required' }, { status: 400 });
    }

    const data: Record<string, string | number | boolean | null> = {};
    const errors: string[] = [];

    const ratio = (key: string, label: string, max = 100) => {
      if (body[key] === undefined) return;
      const result = within(body[key], 0, max, label);
      if (typeof result === 'string') errors.push(result);
      else data[key] = result;
    };

    ratio('basicPercentage', 'Basic (% of gross)');
    ratio('hraPercentage', 'HRA (% of basic)');
    ratio('pfEmployeePercentage', 'PF employee rate (%)');
    ratio('pfEmployerPercentage', 'PF employer rate (%)');
    ratio('esiEmployeePercentage', 'ESI employee rate (%)');
    ratio('esiEmployerPercentage', 'ESI employer rate (%)');

    // Ceilings are rupee amounts, so they get a generous but finite bound.
    const money = (key: string, label: string, max = 10_000_000) => {
      if (body[key] === undefined) return;
      const result = within(body[key], 0, max, label);
      if (typeof result === 'string') errors.push(result);
      else data[key] = result;
    };

    money('pfWageCeiling', 'PF wage ceiling');
    money('esiWageCeiling', 'ESI wage ceiling');
    money('professionalTax', 'Professional tax (monthly)', 100_000);

    if (body.pfEnabled !== undefined) data.pfEnabled = Boolean(body.pfEnabled);
    if (body.esiEnabled !== undefined) data.esiEnabled = Boolean(body.esiEnabled);

    if (body.workingDaysPerMonth !== undefined) {
      const result = within(body.workingDaysPerMonth, 1, 31, 'Working days per month');
      if (typeof result === 'string') errors.push(result);
      else data.workingDaysPerMonth = Math.round(result);
    }

    if (body.pfNumber !== undefined) data.pfNumber = text(body.pfNumber, 40);
    if (body.esiNumber !== undefined) data.esiNumber = text(body.esiNumber, 40);
    if (body.companyCode !== undefined) data.companyCode = text(body.companyCode, 30);
    if (body.footerNote !== undefined) data.payslipFooterNote = text(body.footerNote, 500);

    if (errors.length) return NextResponse.json({ error: errors[0] }, { status: 400 });

    const config = await prisma.payrollConfig.upsert({
      where: { companyId: user.companyId },
      create: { ...data, companyId: user.companyId },
      update: data,
    });

    return NextResponse.json({
      settings: settingsFromConfig(config),
      configured: true,
      identity: {
        pfNumber: config.pfNumber,
        esiNumber: config.esiNumber,
        companyCode: config.companyCode,
        footerNote: config.payslipFooterNote,
      },
    });
  } catch (error) {
    console.error('Error saving payroll config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
