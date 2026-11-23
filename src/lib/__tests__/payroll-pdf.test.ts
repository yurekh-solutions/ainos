import { describe, expect, it } from 'vitest';
import {
  bankTransferCsv,
  buildPayslipPdf,
  payrollRegisterCsv,
  type PayslipDocContext,
  type PayslipDocRow,
} from '@/lib/payroll-pdf';

// The payslip is the document an employee keeps, so a render error is as bad as
// a wrong number. These tests draw the real PDF and the real spreadsheets.

const CONTEXT: PayslipDocContext = {
  companyName: 'Sky Vision Traders Pvt Ltd',
  address: 'Andheri East, Mumbai',
  state: 'Maharashtra',
  pfNumber: 'MH/00/1234/5678',
  footerNote: 'For salary queries write to hr@skyvision.example',
};

const slip = (over: Partial<PayslipDocRow> = {}): PayslipDocRow => ({
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  period: 'November 2026',
  startDate: new Date('2026-11-01'),
  endDate: new Date('2026-11-30'),
  employeeName: 'Rahul Sharma',
  designatory: 'Warehouse Executive',
  department: 'Operations',
  employeeCode: 'SVT-014',
  uanNumber: '100234567890',
  esiNumber: '9200123456789',
  bankAccountNumber: '50100234567890',
  bankIfscCode: 'HDFC0001234',
  bankName: 'HDFC Bank',
  joinedAt: new Date('2023-06-01'),
  basic: 13000,
  hra: 5200,
  specialAllowance: 7800,
  conveyance: 0,
  overtime: 1500,
  bonus: 0,
  arrears: 0,
  otherEarnings: 0,
  grossEarnings: 27500,
  pfEmployee: 1560,
  esiEmployee: 0,
  professionalTax: 0,
  incomeTax: 0,
  loanDeduction: 0,
  advanceDeduction: 0,
  lossOfPay: 1000,
  otherDeductions: 0,
  totalDeductions: 2560,
  netPay: 24940,
  pfEmployer: 1560,
  esiEmployer: 0,
  employerTotal: 1560,
  totalWorkingDays: 26,
  daysPresent: 24,
  status: 'paid',
  paidAt: new Date('2026-11-30'),
  ...over,
});

describe('payslip PDF', () => {
  it('draws one A4 page per employee', () => {
    const doc = buildPayslipPdf([slip(), slip({ employeeName: 'Priya Nair', employeeCode: 'SVT-015' })], CONTEXT);
    expect(doc.getNumberOfPages()).toBe(2);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(3000);
  });

  it('does not throw when an employee has no bank or statutory details', () => {
    const bare = slip({
      bankAccountNumber: null,
      bankIfscCode: null,
      bankName: null,
      uanNumber: null,
      esiNumber: null,
      employeeCode: null,
      joinedAt: null,
      designatory: null,
      department: null,
      status: 'pending',
      paidAt: null,
      pfEmployee: 0,
      lossOfPay: 0,
      totalDeductions: 0,
      netPay: 27500,
    });
    expect(() => buildPayslipPdf([bare], { companyName: 'Alpha Traders' })).not.toThrow();
  });
});

describe('bank salary transfer sheet', () => {
  it('lists every employee and totals the net pay', () => {
    const csv = bankTransferCsv([slip(), slip({ employeeName: 'Amrit Das', netPay: 30000 })]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toContain('Account Number');
    expect(lines.filter((l) => l.startsWith('"1"') || l.startsWith('"2"')).length).toBe(2);
    expect(csv).toContain('54,940.00'); // 24,940 + 30,000
    expect(csv).toContain('2 of 2 payable');
    // A plain number must stay a number: a stray apostrophe makes the bank
    // read the amount as text and the whole upload fails.
    expect(csv).not.toContain("'24,940.00");
    expect(lines[1]).toContain('"24,940.00"');
    expect(lines[1]).toContain('"50100234567890"');
  });

  it('marks a row that cannot be paid instead of dropping it', () => {
    const csv = bankTransferCsv([slip({ bankAccountNumber: null, bankIfscCode: null })]);
    expect(csv).toContain('Add account number and IFSC');
    expect(csv).toContain('0 of 1 payable');
  });

  it('neutralises a formula that starts with = or +', () => {
    const csv = bankTransferCsv([slip({ employeeName: '=SUM(A1:A9)' })]);
    expect(csv).toContain('"\'=SUM(A1:A9)"');
  });
});

describe('payroll register', () => {
  it('carries every component for the accountant', () => {
    const csv = payrollRegisterCsv([slip()]);
    const header = csv.split('\r\n')[0];
    for (const column of ['Basic', 'Special Allowance', 'EPF (Employee)', 'Loss of Pay', 'Total Cost to Company']) {
      expect(header).toContain(`"${column}"`);
    }
    // Cost to company = gross + employer contributions.
    expect(csv).toContain('29,060.00');
  });
});
