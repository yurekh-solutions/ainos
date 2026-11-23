// Payslip PDF, bank salary sheet and payroll register.
//
// All three are built from the stored Payslip rows, never from a fresh
// calculation: the figures an employee received last month must still print the
// same way after their salary changes or they leave, which is exactly why the
// payslip table keeps a snapshot of every component.
//
// jsPDF is used on the server, the same way the bulk invoice export does it, so
// nothing depends on a browser, a headless renderer or a paid API.

import jsPDF from 'jspdf';
import { NextResponse } from 'next/server';
import { amountInWords } from '@/lib/finance/gst';

/** The payslip fields these documents need. A Prisma Payslip row satisfies it. */
export interface PayslipDocRow {
  id: string;
  period: string;
  startDate: Date;
  endDate: Date;
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
  pfEmployer: number;
  esiEmployer: number;
  employerTotal: number;
  totalWorkingDays: number;
  daysPresent: number;
  status: string;
  paidAt: Date | null;
}

export interface PayslipDocContext {
  companyName: string;
  address?: string | null;
  gstNumber?: string | null;
  state?: string | null;
  email?: string | null;
  phone?: string | null;
  pfNumber?: string | null;
  esiNumber?: string | null;
  companyCode?: string | null;
  footerNote?: string | null;
}

const rupee = (value: number) =>
  (Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const shortDate = (value: Date | null | undefined) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

/** 0-valued rows are left out of the printed slip, as any payroll system does. */
function pairs(items: Array<[string, number]>): Array<[string, string]> {
  return items.filter(([, value]) => (Number(value) || 0) > 0).map(([label, value]) => [label, rupee(value)]);
}

const MARGIN = 12;
const RIGHT = 198;

export function addPayslipPage(doc: jsPDF, slip: PayslipDocRow, ctx: PayslipDocContext): void {
  // Outer frame
  doc.setDrawColor(190);
  doc.setLineWidth(0.3);
  doc.rect(8, 8, 194, 281);

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(25);
  doc.text(ctx.companyName.slice(0, 48), MARGIN, 19);

  doc.setFontSize(12);
  doc.setTextColor(90);
  doc.text('Payslip', RIGHT, 19, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110);
  let y = 24;
  const companyLine = [ctx.address, ctx.state ? `State: ${ctx.state}` : null, ctx.phone, ctx.email]
    .filter(Boolean)
    .join('  |  ');
  if (companyLine) {
    doc.text(doc.splitTextToSize(companyLine, RIGHT - MARGIN), MARGIN, y);
    y += 4;
  }
  doc.text(`Period: ${slip.period}`, MARGIN, y);
  doc.text(
    `Payslip No: ${slip.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`,
    RIGHT, y, { align: 'right' },
  );
  y += 4;
  const regn = [ctx.pfNumber ? `PF No: ${ctx.pfNumber}` : null, ctx.esiNumber ? `ESI No: ${ctx.esiNumber}` : null]
    .filter(Boolean)
    .join('   ');
  doc.text(`Salary for ${shortDate(slip.startDate)} to ${shortDate(slip.endDate)}${regn ? `   ${regn}` : ''}`, MARGIN, y);
  y += 3;

  doc.setDrawColor(200);
  doc.line(MARGIN, y, RIGHT, y);
  y += 6;

  // ── Employee details ──────────────────────────────────────────────────────
  const detailRows: Array<[string, string | null]> = [
    ['Employee Name', slip.employeeName],
    ['Designation', slip.designatory],
    ['Department', slip.department],
    ['Employee Code', slip.employeeCode],
    ['UAN / PF No.', slip.uanNumber],
    ['ESI No.', slip.esiNumber],
    ['Bank Account', slip.bankAccountNumber],
    ['IFSC Code', slip.bankIfscCode],
    ['Bank Name', slip.bankName],
    ['Date of Joining', slip.joinedAt ? shortDate(slip.joinedAt) : null],
    ['Paid Days', `${Math.round(slip.daysPresent)} of ${Math.round(slip.totalWorkingDays)}`],
    ['Payment Status', slip.status === 'paid' ? `Paid on ${shortDate(slip.paidAt)}` : 'Pending'],
  ];

  const labelGap = 34;
  const colX = [MARGIN, 106];
  doc.setFontSize(8);
  detailRows.forEach(([label, value], i) => {
    const col = i % 2;
    const x = colX[col];
    if (col === 0 && i > 0) y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(115);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25);
    doc.text(String(value ?? '-').slice(0, 34), x + labelGap, y);
  });

  y += 7;

  // ── Earnings / deductions table ───────────────────────────────────────────
  const earnings = pairs([
    ['Basic', slip.basic],
    ['HRA', slip.hra],
    ['Special Allowance', slip.specialAllowance],
    ['Conveyance', slip.conveyance],
    ['Overtime', slip.overtime],
    ['Bonus', slip.bonus],
    ['Arrears', slip.arrears],
    ['Other Earnings', slip.otherEarnings],
  ]);
  const deductions = pairs([
    ['EPF', slip.pfEmployee],
    ['ESI', slip.esiEmployee],
    ['Professional Tax', slip.professionalTax],
    ['Income Tax (TDS)', slip.incomeTax],
    ['Loan / Advance', slip.loanDeduction + slip.advanceDeduction],
    ['Loss of Pay', slip.lossOfPay],
    ['Other Deductions', slip.otherDeductions],
  ]);

  const amountX = [100, RIGHT];
  const labelX = [MARGIN, 106];

  doc.setFillColor(240, 241, 245);
  doc.rect(MARGIN, y - 4, RIGHT - MARGIN, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60);
  doc.text('EARNINGS', labelX[0] + 1, y);
  doc.text('AMOUNT (Rs.)', amountX[0], y, { align: 'right' });
  doc.text('DEDUCTIONS', labelX[1] + 1, y);
  doc.text('AMOUNT (Rs.)', amountX[1], y, { align: 'right' });
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(35);
  const rowCount = Math.max(earnings.length, deductions.length);
  for (let i = 0; i < rowCount; i += 1) {
    if (earnings[i]) {
      doc.text(earnings[i][0], labelX[0] + 1, y);
      doc.text(earnings[i][1], amountX[0], y, { align: 'right' });
    }
    if (deductions[i]) {
      doc.text(deductions[i][0], labelX[1] + 1, y);
      doc.text(deductions[i][1], amountX[1], y, { align: 'right' });
    }
    doc.setDrawColor(232);
    doc.line(MARGIN, y + 1.5, RIGHT, y + 1.5);
    y += 6;
  }

  // Totals of both sides
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(25);
  doc.text('GROSS EARNINGS', labelX[0] + 1, y);
  doc.text(rupee(slip.grossEarnings), amountX[0], y, { align: 'right' });
  doc.text('TOTAL DEDUCTIONS', labelX[1] + 1, y);
  doc.text(rupee(slip.totalDeductions), amountX[1], y, { align: 'right' });
  y += 4;
  doc.setDrawColor(150);
  doc.line(MARGIN, y, RIGHT, y);
  y += 8;

  // ── Net pay ───────────────────────────────────────────────────────────────
  doc.setFillColor(246, 243, 255);
  doc.setDrawColor(150, 130, 220);
  doc.rect(MARGIN, y - 5, RIGHT - MARGIN, 17, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(60, 40, 140);
  doc.text('NET PAY  Rs.', MARGIN + 4, y + 2);
  doc.setFontSize(13);
  doc.text(rupee(slip.netPay), MARGIN + 44, y + 2);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(80, 60, 150);
  doc.text(doc.splitTextToSize(amountInWords(slip.netPay, 'INR'), RIGHT - MARGIN - 4 - 130), MARGIN + 130, y + 2);
  y += 18;

  // ── Employer side + footer ────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110);
  doc.text(
    `Employer's contribution: PF Rs.${rupee(slip.pfEmployer)}  |  ESI Rs.${rupee(slip.esiEmployer)}`
    + `  |  Total cost to company Rs.${rupee(slip.grossEarnings + slip.employerTotal)}`,
    MARGIN, y,
  );
  y += 5;
  if (ctx.footerNote) {
    doc.text(doc.splitTextToSize(ctx.footerNote, RIGHT - MARGIN), MARGIN, y);
    y += 5;
  }

  doc.setFontSize(7);
  doc.setTextColor(140);
  doc.text(
    `Generated by AINOS Business Suite on ${shortDate(new Date())}. System-generated payslip, no signature required.`,
    MARGIN, 283,
  );
  doc.text(`For ${ctx.companyName.slice(0, 30)}`, RIGHT - 40, 272);
  doc.setDrawColor(180);
  doc.line(RIGHT - 40, 280, RIGHT, 280);
  doc.text('Authorised Signatory', RIGHT - 20, 283, { align: 'center' });
}

/** Builds one A4 page per payslip. */
export function buildPayslipPdf(slips: PayslipDocRow[], ctx: PayslipDocContext): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  slips.forEach((slip, index) => {
    if (index > 0) doc.addPage();
    addPayslipPage(doc, slip, ctx);
  });
  return doc;
}

/** Sends a finished document as a download, the same way the invoice export does. */
export function pdfResponse(doc: jsPDF, filename: string): NextResponse {
  return new NextResponse(Buffer.from(doc.output('arraybuffer')), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
    },
  });
}

/** Keeps a file name on one line and free of characters Windows rejects. */
export function safeName(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'payslip';
}

// A cell that starts with one of these is treated as a formula by Excel, so the
// value is neutralised below. The dash must stay escaped: written as `+-@` inside
// a character class it becomes the range 0x2B-0x40, which also matches every
// digit and would turn all plain amounts into text.
const FORMULA_START = /^[=+\-@]/;

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const safe = FORMULA_START.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',');
}

/**
 * Salary transfer sheet for net-banking bulk payment.
 *
 * Rows without account details are kept and marked instead of being dropped -
 * a silent shortfall would make the bank file disagree with the payslips.
 */
export function bankTransferCsv(slips: PayslipDocRow[]): string {
  const header = [
    'Item No', 'Employee Code', 'Beneficiary Name', 'Bank Name', 'Account Number', 'IFSC Code',
    'Amount (INR)', 'Remarks',
  ];
  let ready = 0;
  const body = slips.map((slip, index) => {
    const complete = Boolean(slip.bankAccountNumber && slip.bankIfscCode);
    if (complete) ready += 1;
    return [
      index + 1,
      slip.employeeCode || '',
      slip.employeeName,
      slip.bankName || '',
      slip.bankAccountNumber || '',
      slip.bankIfscCode || '',
      rupee(slip.netPay),
      complete ? slip.period : 'Add account number and IFSC on the Employees page',
    ];
  });

  const total = slips.reduce((sum, slip) => sum + (Number(slip.netPay) || 0), 0);
  const lines = [csvRow(header), ...body.map(csvRow), '', csvRow(['', '', 'TOTAL', '', '', '', rupee(total), `${ready} of ${slips.length} payable`])];
  // BOM so Excel opens ₹ and Indian names correctly.
  return `\uFEFF${lines.join('\r\n')}`;
}

/** Full payroll register - the sheet a CA asks for at year end. */
export function payrollRegisterCsv(slips: PayslipDocRow[]): string {
  const header = [
    'Period', 'Employee Code', 'Employee Name', 'Designation', 'Department', 'Date of Joining',
    'Paid Days', 'Total Days', 'Basic', 'HRA', 'Special Allowance', 'Conveyance', 'Overtime', 'Bonus',
    'Arrears', 'Other Earnings', 'Gross Earnings', 'EPF (Employee)', 'ESI (Employee)', 'Professional Tax',
    'Income Tax (TDS)', 'Loan Deduction', 'Advance Deduction', 'Loss of Pay', 'Other Deductions',
    'Total Deductions', 'Net Pay', 'EPF (Employer)', 'ESI (Employer)', 'Total Cost to Company', 'Status',
  ];
  const body = slips.map((s) => [
    s.period, s.employeeCode || '', s.employeeName, s.designatory || '', s.department || '',
    s.joinedAt ? shortDate(s.joinedAt) : '', Math.round(s.daysPresent), Math.round(s.totalWorkingDays),
    rupee(s.basic), rupee(s.hra), rupee(s.specialAllowance), rupee(s.conveyance), rupee(s.overtime),
    rupee(s.bonus), rupee(s.arrears), rupee(s.otherEarnings), rupee(s.grossEarnings),
    rupee(s.pfEmployee), rupee(s.esiEmployee), rupee(s.professionalTax), rupee(s.incomeTax),
    rupee(s.loanDeduction), rupee(s.advanceDeduction), rupee(s.lossOfPay), rupee(s.otherDeductions),
    rupee(s.totalDeductions), rupee(s.netPay), rupee(s.pfEmployer), rupee(s.esiEmployer),
    rupee(s.grossEarnings + s.employerTotal), s.status,
  ]);
  return `\uFEFF${[csvRow(header), ...body.map(csvRow)].join('\r\n')}`;
}
