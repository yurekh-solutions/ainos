// Payslip calculation for the HR & Payroll module.
//
// Why this lives in its own file: a payslip is a statutory document. The rules
// below are the ones an Indian payroll uses every month - basic/HRA split, EPF
// on basic up to the wage ceiling, ESIC on gross up to ₹21,000, professional tax
// and loss of pay from attendance - and they must be applied identically by the
// generate API, the payslip PDF, the bank salary file and the on-screen preview.
//
// Nothing here is a hard requirement to configure. Every default is the national
// statutory number, so a company that has never opened the settings still gets a
// correct payslip on its first run. Values are monthly rupees, rounded to paise.

import { amountInWords } from '@/lib/finance/gst';

export interface PayrollSettings {
  basicPercentage: number;
  hraPercentage: number;
  pfEnabled: boolean;
  pfEmployeePercentage: number;
  pfEmployerPercentage: number;
  pfWageCeiling: number;
  esiEnabled: boolean;
  esiEmployeePercentage: number;
  esiEmployerPercentage: number;
  esiWageCeiling: number;
  professionalTax: number;
  workingDaysPerMonth: number;
}

// EPF 12% of basic (both sides, ₹15,000 wage ceiling) and ESIC 0.75% / 3.25%
// while gross is ₹21,000 or less are the standing statutory rates.
export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  basicPercentage: 50,
  hraPercentage: 40,
  pfEnabled: true,
  pfEmployeePercentage: 12,
  pfEmployerPercentage: 12,
  pfWageCeiling: 15000,
  esiEnabled: true,
  esiEmployeePercentage: 0.75,
  esiEmployerPercentage: 3.25,
  esiWageCeiling: 21000,
  professionalTax: 0,
  workingDaysPerMonth: 26,
};

// Anything the person running payroll can change for one employee in one month.
// Absent means "use the statutory default", so the common case needs no typing.
export interface PayslipAdjustments {
  basic?: number;
  hra?: number;
  specialAllowance?: number;
  conveyance?: number;
  overtime?: number;
  bonus?: number;
  arrears?: number;
  otherEarnings?: number;
  pfEmployee?: number;
  esiEmployee?: number;
  professionalTax?: number;
  incomeTax?: number;
  loanDeduction?: number;
  advanceDeduction?: number;
  lossOfPay?: number;
  otherDeductions?: number;
  daysPresent?: number;
  totalWorkingDays?: number;
}

export interface PayslipInput {
  gross: number;
  settings: PayrollSettings;
  adjustments?: PayslipAdjustments;
}

export interface PayslipBreakdown {
  basic: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  overtime: number;
  bonus: number;
  arrears: number;
  otherEarnings: number;
  grossEarnings: number;

  pfEmployee: number;
  esiEmployee: number;
  professionalTax: number;
  incomeTax: number;
  loanDeduction: number;
  advanceDeduction: number;
  lossOfPay: number;
  otherDeductions: number;
  totalDeductions: number;

  netPay: number;
  netPayWords: string;

  pfEmployer: number;
  esiEmployer: number;
  employerTotal: number;
  totalCostToCompany: number;

  totalWorkingDays: number;
  daysPresent: number;
  perDayRate: number;

  // Which numbers came from the statutory defaults and which were typed in.
  // The UI shows this so a reviewer can see at a glance what was overridden.
  overridden: string[];
}

/** Rupees to two decimals. Float money is exact enough below 2^53 paise. */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function num(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Reads one adjustment: when the caller supplied it, the value wins and the
 * field is recorded as overridden; otherwise the statutory default is used.
 */
function pickAdjustment(
  key: keyof PayslipAdjustments,
  adj: PayslipAdjustments,
  fallback: number,
  overridden: string[],
): number {
  const provided = adj[key] !== undefined && adj[key] !== null;
  if (provided) overridden.push(key);
  return provided ? round2(num(adj[key])) : round2(fallback);
}

/**
 * Splits a monthly gross into a statutory payslip.
 *
 * Earnings always add back up to the gross (plus any extra paid items), so the
 * only way an amount can change is through an explicit adjustment.
 */
export function computePayslip({ gross, settings, adjustments = {} }: PayslipInput): PayslipBreakdown {
  const adj = adjustments || {};
  const overridden: string[] = [];
  const monthlyGross = round2(num(gross));

  // ── Earnings ───────────────────────────────────────────────────────────────
  // Basic is a percentage of gross; HRA is a percentage of basic; whatever is
  // left becomes a special allowance so the three parts equal the gross exactly.
  const basic = pickAdjustment('basic', adj, monthlyGross * (settings.basicPercentage / 100), overridden);
  const hra = pickAdjustment('hra', adj, basic * (settings.hraPercentage / 100), overridden);
  const specialAllowance = pickAdjustment(
    'specialAllowance', adj, Math.max(0, monthlyGross - basic - hra), overridden,
  );

  const conveyance = pickAdjustment('conveyance', adj, 0, overridden);
  const overtime = pickAdjustment('overtime', adj, 0, overridden);
  const bonus = pickAdjustment('bonus', adj, 0, overridden);
  const arrears = pickAdjustment('arrears', adj, 0, overridden);
  const otherEarnings = pickAdjustment('otherEarnings', adj, 0, overridden);

  const grossEarnings = round2(
    basic + hra + specialAllowance + conveyance + overtime + bonus + arrears + otherEarnings,
  );

  // ── Attendance and loss of pay ─────────────────────────────────────────────
  let totalWorkingDays = settings.workingDaysPerMonth;
  if (adj.totalWorkingDays !== undefined && adj.totalWorkingDays !== null) {
    overridden.push('totalWorkingDays');
    totalWorkingDays = num(adj.totalWorkingDays) || settings.workingDaysPerMonth;
  }
  let daysPresent = totalWorkingDays;
  if (adj.daysPresent !== undefined && adj.daysPresent !== null) {
    overridden.push('daysPresent');
    daysPresent = Math.min(num(adj.daysPresent), totalWorkingDays);
  }

  // Per-day rate uses the gross, which is how LOP is normally recovered.
  const perDayRate = totalWorkingDays > 0 ? round2(monthlyGross / totalWorkingDays) : 0;
  const absentDays = Math.max(0, totalWorkingDays - daysPresent);
  const lossOfPay = pickAdjustment('lossOfPay', adj, perDayRate * absentDays, overridden);

  // ── Statutory deductions ───────────────────────────────────────────────────
  // EPF is charged on basic only, and only up to the wage ceiling.
  const pfBase = Math.min(basic, settings.pfWageCeiling);
  const pfEmployee = pickAdjustment(
    'pfEmployee', adj,
    settings.pfEnabled ? pfBase * (settings.pfEmployeePercentage / 100) : 0,
    overridden,
  );
  const pfEmployer = settings.pfEnabled ? round2(pfBase * (settings.pfEmployerPercentage / 100)) : 0;

  // ESIC is charged on gross wages and overtime is excluded from them. An
  // employee above the ceiling is simply not insured, so both sides are zero.
  const esiWages = Math.max(0, grossEarnings - overtime);
  const esiEligible = settings.esiEnabled && esiWages <= settings.esiWageCeiling;
  const esiEmployee = pickAdjustment(
    'esiEmployee', adj,
    esiEligible ? esiWages * (settings.esiEmployeePercentage / 100) : 0,
    overridden,
  );
  const esiEmployer = esiEligible ? round2(esiWages * (settings.esiEmployerPercentage / 100)) : 0;

  // Professional tax is a state subject, so the company's own value is used as
  // entered and nothing is invented for it.
  const professionalTax = pickAdjustment('professionalTax', adj, settings.professionalTax, overridden);

  // TDS stays manual on purpose: the correct figure depends on the employee's
  // other income, investments and regime, which AINOS does not have. Guessing
  // it would print a wrong statutory document.
  const incomeTax = pickAdjustment('incomeTax', adj, 0, overridden);
  const loanDeduction = pickAdjustment('loanDeduction', adj, 0, overridden);
  const advanceDeduction = pickAdjustment('advanceDeduction', adj, 0, overridden);
  const otherDeductions = pickAdjustment('otherDeductions', adj, 0, overridden);

  const totalDeductions = round2(
    pfEmployee + esiEmployee + professionalTax + incomeTax + loanDeduction + advanceDeduction + lossOfPay + otherDeductions,
  );

  const netPay = round2(grossEarnings - totalDeductions);
  const employerTotal = round2(pfEmployer + esiEmployer);

  return {
    basic, hra, specialAllowance, conveyance, overtime, bonus, arrears, otherEarnings, grossEarnings,
    pfEmployee, esiEmployee, professionalTax, incomeTax, loanDeduction, advanceDeduction, lossOfPay, otherDeductions, totalDeductions,
    netPay,
    netPayWords: amountInWords(netPay, 'INR'),
    pfEmployer, esiEmployer, employerTotal,
    totalCostToCompany: round2(grossEarnings + employerTotal),
    totalWorkingDays, daysPresent, perDayRate,
    overridden,
  };
}

/**
 * Reads the per-employee JSON overrides stored on Employee.salaryStructure.
 * Unknown keys are dropped so a stale note field cannot break a run.
 */
export function parseSalaryStructure(raw: unknown): PayslipAdjustments {
  if (!raw || typeof raw !== 'object') return {};
  const src = raw as Record<string, unknown>;
  const out: PayslipAdjustments = {};
  const moneyKeys = [
    'basic', 'hra', 'specialAllowance', 'conveyance', 'overtime', 'bonus', 'arrears', 'otherEarnings',
    'pfEmployee', 'esiEmployee', 'professionalTax', 'incomeTax', 'loanDeduction', 'advanceDeduction',
    'lossOfPay', 'otherDeductions',
  ] as const;
  for (const key of moneyKeys) {
    const value = src[key];
    if (value !== undefined && value !== null && value !== '') {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) (out as Record<string, number>)[key] = n;
    }
  }
  for (const key of ['daysPresent', 'totalWorkingDays'] as const) {
    const value = src[key];
    if (value !== undefined && value !== null && value !== '') {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) (out as Record<string, number>)[key] = n;
    }
  }
  return out;
}

/** Turns a PayrollConfig row (or nothing) into settings with safe fallbacks. */
export function settingsFromConfig(config: Partial<PayrollSettings> | null | undefined): PayrollSettings {
  const D = DEFAULT_PAYROLL_SETTINGS;
  // A config row only exists once the company has saved one, and the settings API
  // refuses negative numbers, so a stored 0 is a deliberate "charge nothing here".
  // Honouring it is what keeps the printed payslip equal to what was configured -
  // silently replacing 0 with the statutory 12% would deduct money nobody agreed to.
  // A company that never configured payroll has no row at all and still gets the
  // statutory defaults below.
  const nonNegative = (value: unknown, fallback: number): number => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  // Working days must never be 0: the per-day rate divides by it, and 0 present
  // days would zero out somebody's salary.
  const atLeastOne = (value: unknown, fallback: number): number => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 1 ? Math.round(n) : fallback;
  };

  return {
    basicPercentage: nonNegative(config?.basicPercentage, D.basicPercentage),
    hraPercentage: nonNegative(config?.hraPercentage, D.hraPercentage),
    pfEnabled: typeof config?.pfEnabled === 'boolean' ? config.pfEnabled : D.pfEnabled,
    pfEmployeePercentage: nonNegative(config?.pfEmployeePercentage, D.pfEmployeePercentage),
    pfEmployerPercentage: nonNegative(config?.pfEmployerPercentage, D.pfEmployerPercentage),
    pfWageCeiling: nonNegative(config?.pfWageCeiling, D.pfWageCeiling),
    esiEnabled: typeof config?.esiEnabled === 'boolean' ? config.esiEnabled : D.esiEnabled,
    esiEmployeePercentage: nonNegative(config?.esiEmployeePercentage, D.esiEmployeePercentage),
    esiEmployerPercentage: nonNegative(config?.esiEmployerPercentage, D.esiEmployerPercentage),
    esiWageCeiling: nonNegative(config?.esiWageCeiling, D.esiWageCeiling),
    professionalTax: nonNegative(config?.professionalTax, D.professionalTax),
    workingDaysPerMonth: atLeastOne(config?.workingDaysPerMonth, D.workingDaysPerMonth),
  };
}

/** ₹1,23,456.00 - every payslip screen and PDF uses the same shape. */
export function formatRupees(value: number): string {
  return `Rs. ${(Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
