import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAYROLL_SETTINGS,
  computePayslip,
  parseSalaryStructure,
  round2,
  settingsFromConfig,
  type PayrollSettings,
} from '@/lib/payroll';

// A payslip is a statutory document, so these tests pin the numbers the EPFO
// rate tables imply, not the implementation. If a future refactor changes what
// an employee is deducted, one of these should fail here rather than on a
// salary slip.

const S = DEFAULT_PAYROLL_SETTINGS;

describe('statutory salary split', () => {
  it('divides gross into basic, HRA and special allowance', () => {
    const b = computePayslip({ gross: 40000, settings: S });
    expect(b.basic).toBe(20000);
    expect(b.hra).toBe(8000);
    expect(b.specialAllowance).toBe(12000);
    expect(b.grossEarnings).toBe(40000);
  });

  it('keeps the parts equal to the gross even on a non-round salary', () => {
    const b = computePayslip({ gross: 33333.33, settings: S });
    // Components are printed in paise, so they must add up once rounded.
    expect(round2(b.basic + b.hra + b.specialAllowance)).toBe(b.grossEarnings);
    expect(b.grossEarnings).toBe(33333.33);
  });

  it('charges EPF at 12% of basic, capped at the wage ceiling', () => {
    const above = computePayslip({ gross: 40000, settings: S });   // basic 20,000
    expect(above.pfEmployee).toBe(1800);   // 12% of 15,000, not of 20,000
    expect(above.pfEmployer).toBe(1800);

    const below = computePayslip({ gross: 18000, settings: S });   // basic 9,000
    expect(below.pfEmployee).toBe(1080);
  });

  it('charges ESIC only while gross wages are within the ceiling', () => {
    const insured = computePayslip({ gross: 18000, settings: S });
    expect(insured.esiEmployee).toBe(135);  // 0.75%
    expect(insured.esiEmployer).toBe(585);  // 3.25%

    const aboveCeiling = computePayslip({ gross: 40000, settings: S });
    expect(aboveCeiling.esiEmployee).toBe(0);
    expect(aboveCeiling.esiEmployer).toBe(0);
  });

  it('excludes overtime from ESI wages so it cannot break insurance cover', () => {
    const b = computePayslip({ gross: 20000, settings: S, adjustments: { overtime: 1500 } });
    expect(b.grossEarnings).toBe(21500);       // above 21,000...
    expect(b.esiEmployee).toBe(150);           // ...but 20,000 is insured wages
  });

  it('nets pay as earnings minus deductions, with words for the slip', () => {
    const b = computePayslip({ gross: 18000, settings: S });
    expect(b.totalDeductions).toBe(1215);
    expect(b.netPay).toBe(16785);
    expect(b.netPayWords).toContain('Rupees');
    expect(b.netPayWords.endsWith('Only')).toBe(true);
  });

  it('shows employer contributions separately from what the employee loses', () => {
    const b = computePayslip({ gross: 18000, settings: S });
    expect(b.employerTotal).toBe(585 + 1080);
    expect(b.totalCostToCompany).toBe(18000 + 1665);
  });
});

describe('attendance and loss of pay', () => {
  it('recovers absent days at the per-day gross rate', () => {
    const b = computePayslip({ gross: 26000, settings: S, adjustments: { daysPresent: 24 } });
    expect(b.perDayRate).toBe(1000);
    expect(b.lossOfPay).toBe(2000);
    expect(b.netPay).toBe(26000 - 1560 - 2000);
  });

  it('pays in full when no days were entered', () => {
    const b = computePayslip({ gross: 26000, settings: S });
    expect(b.daysPresent).toBe(26);
    expect(b.lossOfPay).toBe(0);
  });
});

describe('overrides', () => {
  it('lets a typed basic drive HRA and the allowance, and records the override', () => {
    const b = computePayslip({ gross: 40000, settings: S, adjustments: { basic: 25000 } });
    expect(b.basic).toBe(25000);
    expect(b.hra).toBe(10000);              // 40% of the overridden basic
    expect(b.specialAllowance).toBe(5000);  // still adds back up to the gross
    expect(b.grossEarnings).toBe(40000);
    expect(b.overridden).toContain('basic');
    expect(b.overridden).not.toContain('pfEmployee');
  });

  it('accepts a typed statutory figure, for a notified PF or TDS', () => {
    const b = computePayslip({ gross: 40000, settings: S, adjustments: { pfEmployee: 2000, incomeTax: 3500 } });
    expect(b.pfEmployee).toBe(2000);
    expect(b.totalDeductions).toBe(5500);
    expect(b.overridden).toContain('incomeTax');
  });

  it('never guesses TDS or professional tax for a company that has not set them', () => {
    const b = computePayslip({ gross: 60000, settings: S });
    expect(b.incomeTax).toBe(0);
    expect(b.professionalTax).toBe(0);
  });
});

describe('settings resolution', () => {
  it('uses the statutory defaults when nothing was configured', () => {
    expect(settingsFromConfig(null)).toEqual(DEFAULT_PAYROLL_SETTINGS);
  });

  it('honours a deliberate zero rate instead of replacing it', () => {
    const settings = settingsFromConfig({ pfEmployeePercentage: 0, pfEmployerPercentage: 0, hraPercentage: 0 });
    expect(settings.pfEmployeePercentage).toBe(0);
    const b = computePayslip({ gross: 40000, settings });
    expect(b.pfEmployee).toBe(0);
    expect(b.hra).toBe(0);
    expect(b.specialAllowance).toBe(20000); // allowance absorbs the removed HRA
  });

  it('falls back when a stored value is unusable', () => {
    const settings = settingsFromConfig({ workingDaysPerMonth: 0, basicPercentage: -5 } as Partial<PayrollSettings>);
    expect(settings.workingDaysPerMonth).toBe(26);
    expect(settings.basicPercentage).toBe(50);
  });

  it('switches a statute off by flag, leaving the employer side off too', () => {
    const settings = settingsFromConfig({ pfEnabled: false, esiEnabled: false });
    const b = computePayslip({ gross: 18000, settings });
    expect(b.pfEmployee).toBe(0);
    expect(b.pfEmployer).toBe(0);
    expect(b.esiEmployee).toBe(0);
    expect(b.esiEmployer).toBe(0);
    expect(b.netPay).toBe(18000);
  });
});

describe('stored salary structures', () => {
  it('reads numbers and drops junk, so an old note cannot break a run', () => {
    const parsed = parseSalaryStructure({
      basic: '15000', overtime: 2000, daysPresent: 24, hra: -1, remark: 'Diwali', esiEmployee: '',
    });
    expect(parsed).toEqual({ basic: 15000, overtime: 2000, daysPresent: 24 });
  });

  it('tolerates a missing or malformed structure', () => {
    expect(parseSalaryStructure(null)).toEqual({});
    expect(parseSalaryStructure('nope')).toEqual({});
  });
});
