import { describe, it, expect } from 'vitest';
import {
  gstinCheckChar, validateGstin, getDueDates, daysPast, computeFeeExposure,
  utiliseItc, validateForFiling, buildPortalGstr1, buildGstr3bTables,
  buildFilingPack, buildSheetRows, resolvePlaceOfSupply,
  type ReportInvoice, type ItcSplit,
} from '@/lib/finance/gstnFiling';

// Build GSTINs through the module's own check-digit function so the fixtures
// stay correct even if the mod-36 series is revised.
const mkGstin = (first14: string) => first14 + (gstinCheckChar(first14) || 'Z');
const MAH_BUYER = mkGstin('27AAAAA1234A1Z');
const KAR_BUYER = mkGstin('29BBBBB5678B1Z');

const zeroItc = (): ItcSplit => ({ igst: 0, cgst: 0, sgst: 0, cess: 0 });

const intra = (): ReportInvoice => ({
  invoiceNumber: 'AIN-001', invoiceDate: '2026-09-04',
  customerName: 'Sunil Traders', customerGstNumber: MAH_BUYER,
  customerState: null, placeOfSupply: '27',
  totalAmount: 2385, cgstAmount: 192.5, sgstAmount: 192.5, igstAmount: 0, utgstAmount: null,
  items: [{ hsnCode: '6109', description: 'T-shirt', unit: 'PCS', quantity: 10, price: 200, gstRate: 18, taxAmount: 385 }],
  supplyType: 'intra', status: 'sent',
});

const inter = (): ReportInvoice => ({
  invoiceNumber: 'AIN-002', invoiceDate: '2026-09-06',
  customerName: 'Kerala Retail', customerGstNumber: KAR_BUYER,
  customerState: null, placeOfSupply: '29',
  totalAmount: 11800, cgstAmount: 0, sgstAmount: 0, igstAmount: 1800, utgstAmount: null,
  items: [{ hsnCode: '61091000', description: 'Shirt', unit: 'PCS', quantity: 20, price: 500, gstRate: 18, taxAmount: 1800 }],
  supplyType: 'inter', status: 'paid',
});

describe('validateGstin', () => {
  it('accepts a well-formed GSTIN and reports its state code', () => {
    const v = validateGstin(MAH_BUYER);
    expect(v.valid).toBe(true);
    expect(v.stateCode).toBe('27');
    expect(v.checkDigitMismatch).toBeFalsy();
  });

  // Pinned against GSTINs that independent validators publish as valid, not
  // against this module's own output. Every other fixture here is built through
  // gstinCheckChar(), so it agrees with any rule, right or wrong - which is how
  // a weighted-prime series that matched none of these numbers got shipped.
  it('reproduces the check character of GSTINs published elsewhere as valid', () => {
    expect(gstinCheckChar('09AAAUP8175A1Z')).toBe('G');
    expect(validateGstin('09AAAUP8175A1ZG').checkDigitMismatch).toBeFalsy();
    expect(validateGstin('12AAACI1681G1Z0').checkDigitMismatch).toBeFalsy();
  });

  it('a single misread character breaks the check character', () => {
    // What the check character is for: one slipped digit anywhere in the
    // fourteen meaningful positions changes the expected fifteenth.
    const misread = MAH_BUYER.slice(0, 8) + '5' + MAH_BUYER.slice(9);
    expect(misread).not.toBe(MAH_BUYER);
    expect(validateGstin(misread).valid).toBe(true);
    expect(validateGstin(misread).checkDigitMismatch).toBe(true);
  });

  it('rejects wrong length, broken PAN slot and a non-Z 14th character', () => {
    expect(validateGstin('27AAA').valid).toBe(false);
    expect(validateGstin('2711111111111ZZ').valid).toBe(false);   // PAN pattern broken
    expect(validateGstin('27AAAAA1234A1YZ').valid).toBe(false);   // char 14 must be Z
    expect(validateGstin('98AAAAA1234A1ZZ').valid).toBe(false);   // unknown state code
    expect(validateGstin('').valid).toBe(false);
    expect(validateGstin(null).valid).toBe(false);
  });

  it('accepts the reserved 99 Other Territory code', () => {
    expect(validateGstin(mkGstin('99AAAAA1234A1Z')).valid).toBe(true);
  });

  it('treats a check-digit mismatch as advisory, never as invalid', () => {
    const broken = MAH_BUYER.slice(0, 14) + (MAH_BUYER[14] === 'Z' ? 'Q' : 'Z');
    const v = validateGstin(broken);
    expect(v.valid).toBe(true);
    expect(v.checkDigitMismatch).toBe(true);
  });
});

describe('getDueDates', () => {
  it('monthly scheme: GSTR-1 on the 11th and GSTR-3B on the 20th of the next month', () => {
    const d = getDueDates('092026', 'monthly');
    expect(d.returns.map(r => r.form)).toEqual(['GSTR-1', 'GSTR-3B']);
    expect(d.returns[0].dueDate).toBe('2026-10-11');
    expect(d.returns[1].dueDate).toBe('2026-10-20');
  });

  it('rolls a December period into January of the next year', () => {
    const d = getDueDates('122026', 'monthly');
    expect(d.returns[0].dueDate).toBe('2027-01-11');
    expect(d.returns[1].dueDate).toBe('2027-01-20');
  });

  it('quarterly scheme files GSTR-1 and 3B after the quarter closes, not the month', () => {
    // January is month 1 of Q4 (Jan-Mar 2027), so the quarterly returns are due
    // in April 2027. Deriving them from the viewed month was off by two months
    // and made taxpayers look late when they were not.
    const d = getDueDates('012027', 'qrmp');
    expect(d.returns.map(r => r.form)).toEqual(['IFF', 'GSTR-1', 'GSTR-3B']);
    expect(d.returns[0].dueDate).toBe('2027-02-11');   // IFF is monthly
    expect(d.returns[1].dueDate).toBe('2027-04-13');
    expect(d.returns[2].dueDate).toBe('2027-04-22');
    expect(d.returns[1].note).toContain('Q4 FY27');
  });

  it('drops IFF for the third month of a quarter', () => {
    const d = getDueDates('062026', 'qrmp');
    expect(d.returns.map(r => r.form)).toEqual(['GSTR-1', 'GSTR-3B']);
    expect(d.returns[0].dueDate).toBe('2026-07-13');
  });

  it('keeps a first-month quarter on the July deadlines', () => {
    const d = getDueDates('042026', 'qrmp');
    expect(d.returns.map(r => `${r.form}:${r.dueDate}`)).toEqual(['IFF:2026-05-11', 'GSTR-1:2026-07-13', 'GSTR-3B:2026-07-22']);
  });

  it('composition files CMP-08 quarterly plus the annual statement', () => {
    const d = getDueDates('062026', 'composition');
    expect(d.returns.map(r => r.form)).toEqual(['CMP-08', 'GSTR-4']);
    expect(d.returns[0].dueDate).toBe('2026-07-22');
    expect(d.returns[1].dueDate).toBe('2027-04-30');
  });

  it('rolls a January composition period onto the April statement deadline', () => {
    const d = getDueDates('012027', 'composition');
    expect(d.returns[0].dueDate).toBe('2027-04-22');
    expect(d.returns[1].dueDate).toBe('2027-04-30');
  });
});

describe('daysPast and fee exposure', () => {
  const asOf = new Date('2026-11-04T23:59:59');   // due 2026-10-20 -> exactly 15 days

  it('counts whole days after the due date and zero before it', () => {
    expect(daysPast('2026-10-20', asOf)).toBe(15);
    expect(daysPast('2026-11-20', asOf)).toBe(0);
  });

  it('charges ₹50/day, caps GSTR-1 at ₹500 and applies the turnover ceiling on 3B', () => {
    const f = computeFeeExposure({
      netTaxPayable: 100000, gstr1Due: '2026-10-11', gstr3bDue: '2026-10-20', asOf,
    });
    expect(f.daysLate).toBe(15);
    expect(f.daysGstr1Late).toBe(24);
    expect(f.gstr1LateFee).toBe(500);   // 24 days × 50 = 1200, capped
    expect(f.gstr3bLateFee).toBe(750);  // 15 days × 50, under the ₹1000 default ceiling
    expect(f.interestOnNetTax).toBe(739.73);   // 100000 × 18% × 15 / 365
    expect(f.total).toBe(1989.73);
  });

  it('uses the nil-return rates when there were no supplies', () => {
    const f = computeFeeExposure({
      netTaxPayable: 0, gstr1Due: '2026-10-11', gstr3bDue: '2026-10-20', isNil: true, asOf,
    });
    expect(f.gstr1LateFee).toBe(200);   // nil cap
    expect(f.gstr3bLateFee).toBe(150);  // 15 × 10
    expect(f.interestOnNetTax).toBe(0);
  });

  it('raises the 3B ceiling with last year turnover', () => {
    const asOfFar = new Date('2027-06-30T23:59:59');
    const small = computeFeeExposure({ netTaxPayable: 0, gstr1Due: '2026-10-11', gstr3bDue: '2026-10-20', taxableTurnoverPriorFy: 10_00_000, asOf: asOfFar });
    const large = computeFeeExposure({ netTaxPayable: 0, gstr1Due: '2026-10-11', gstr3bDue: '2026-10-20', taxableTurnoverPriorFy: 20_00_00_000, asOf: asOfFar });
    expect(small.gstr3bLateFee).toBe(1000);
    expect(large.gstr3bLateFee).toBe(5000);
  });
});

describe('utiliseItc', () => {
  it('spends IGST credit on IGST, then CGST, before asking for cash', () => {
    const u = utiliseItc({ igst: 100, cgst: 500, sgst: 300, cess: 0 }, { igst: 400, cgst: 0, sgst: 0, cess: 0 });
    expect(u.itcUsed).toEqual({ igst: 100, cgst: 300, sgst: 0, cess: 0 });
    expect(u.cashPaid).toEqual({ igst: 0, cgst: 200, sgst: 300, cess: 0 });
  });

  it('never lets SGST credit pay an IGST liability', () => {
    const u = utiliseItc({ igst: 500, cgst: 0, sgst: 0, cess: 0 }, { igst: 0, cgst: 0, sgst: 500, cess: 0 });
    expect(u.itcUsed.igst).toBe(0);
    expect(u.cashPaid.igst).toBe(500);
  });

  it('always pays cess in cash', () => {
    const u = utiliseItc({ igst: 0, cgst: 0, sgst: 0, cess: 250 }, { igst: 1000, cgst: 1000, sgst: 1000, cess: 0 });
    expect(u.cashPaid.cess).toBe(250);
  });

  it('does not over-claim credit beyond the liability', () => {
    const u = utiliseItc({ igst: 50, cgst: 0, sgst: 0, cess: 0 }, { igst: 900, cgst: 900, sgst: 900, cess: 0 });
    expect(u.itcUsed.igst).toBe(50);
    expect(u.cashPaid.igst).toBe(0);
  });
});

describe('validateForFiling', () => {
  it('passes a clean period', () => {
    const v = validateForFiling([intra(), inter()], { sellerGstin: MAH_BUYER });
    expect(v.blocking).toEqual([]);
    expect(v.clean).toBe(true);
    expect(v.checked).toBe(2);
  });

  it('takes place of supply from the recipient GSTIN when the field is blank', () => {
    // AINOS only persists placeOfSupply when the invoice form sends one, so a
    // blank field with a valid GSTIN is normal data, not a defect.
    expect(resolvePlaceOfSupply({ customerGstNumber: KAR_BUYER })).toBe('29');
    const v = validateForFiling([{ ...inter(), placeOfSupply: null }], { sellerGstin: MAH_BUYER });
    expect(v.blocking).toEqual([]);
    expect(v.clean).toBe(true);
  });

  it('blocks a row with neither place of supply nor a recipient GSTIN', () => {
    const retail = { ...intra(), customerGstNumber: null, placeOfSupply: null };
    const v = validateForFiling([retail], { sellerGstin: MAH_BUYER });
    expect(v.blocking.map(b => b.field)).toContain('placeOfSupply');
  });

  it('blocks a malformed recipient GSTIN', () => {
    const bad = { ...inter(), placeOfSupply: null, customerGstNumber: '29BBBBB5678B1' };
    const v = validateForFiling([bad], { sellerGstin: MAH_BUYER });
    expect(v.blocking.map(b => b.field)).toContain('customerGstNumber');
    expect(v.clean).toBe(false);
  });

  it('blocks CGST on an inter-state supply and IGST on an intra-state one', () => {
    const wrongInter = { ...inter(), cgstAmount: 100 };
    const wrongIntra = { ...intra(), igstAmount: 100 };
    const v = validateForFiling([wrongInter, wrongIntra], { sellerGstin: MAH_BUYER });
    expect(v.blocking.some(b => b.field === 'cgstAmount')).toBe(true);
    expect(v.blocking.some(b => b.field === 'igstAmount')).toBe(true);
  });

  it('blocks duplicate serials and missing invoice dates', () => {
    const dup = { ...intra(), invoiceDate: null };
    const v = validateForFiling([intra(), dup], { sellerGstin: MAH_BUYER });
    expect(v.blocking.filter(b => b.field === 'invoiceNumber').length).toBe(1);
    expect(v.blocking.some(b => b.field === 'invoiceDate')).toBe(true);
  });

  it('warns instead of blocking when a HSN code is absent', () => {
    const noHsn = { ...intra(), items: [{ price: 100, quantity: 1, gstRate: 18 }] };
    const v = validateForFiling([noHsn], { sellerGstin: MAH_BUYER });
    expect(v.blocking).toEqual([]);
    expect(v.warnings.some(w => w.field === 'hsnCode')).toBe(true);
  });
});

describe('buildPortalGstr1', () => {
  interface SheetItem { txval: number; rt: number; iamt: number; camt: number; samt: number; kamt: number }
  interface SheetB2b { pos: string; inum: string; itms: SheetItem[] }
  const b2bRows = (p: ReturnType<typeof buildPortalGstr1>) => p.docdata.b2b as SheetB2b[];
  const built = () => buildPortalGstr1([intra(), inter()], MAH_BUYER, '092026', { sellerStateCode: '27' });

  it('emits the portal envelope and section keys', () => {
    const p = built();
    expect(p.version).toBe('GSTR1V1.0');
    expect(p.fp).toBe('092026');
    expect(p.gt).toBe('R3.1');
    expect(Object.keys(p.docdata)).toEqual(
      expect.arrayContaining(['b2b', 'b2cl', 'b2c', 'cdnrp', 'nil', 'noinv', 'at', 'exp', 'hsn4', 'hsn6']),
    );
  });

  it('puts registered buyers in B2B with the statutory tax-head keys', () => {
    const b2b = b2bRows(built());
    expect(b2b).toHaveLength(2);
    const first = b2b[0].itms[0];
    expect(Object.keys(first)).toEqual(expect.arrayContaining(['txval', 'rt', 'iamt', 'camt', 'samt', 'kamt']));
    expect(first.camt).toBe(192.5);
    expect(first.samt).toBe(192.5);
    expect(first.iamt).toBe(0);
  });

  it('splits IGST and CGST by place of supply and fills the HSN buckets', () => {
    const p = built();
    const kerala = b2bRows(p).find(r => r.pos === '29');
    expect(kerala?.itms[0].iamt).toBe(1800);
    expect(kerala?.itms[0].camt).toBe(0);
    const hsn6 = p.docdata.hsn6 as Array<Record<string, unknown>>;
    expect(hsn6.length).toBeGreaterThan(0);
    expect(hsn6[0]).toHaveProperty('txval');
  });

  it('never uploads a blank place of supply for a registered buyer', () => {
    const p = buildPortalGstr1([{ ...intra(), placeOfSupply: null }, { ...inter(), placeOfSupply: null }], MAH_BUYER, '092026', { sellerStateCode: '27' });
    const rows = b2bRows(p);
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.pos)).toEqual(['27', '29']);
  });

  it('aggregates unregistered sales into B2C by rate and state', () => {
    const retail = { ...intra(), invoiceNumber: 'AIN-002', customerGstNumber: null, placeOfSupply: '27' };
    const p = buildPortalGstr1([retail], MAH_BUYER, '092026', {});
    const b2c = p.docdata.b2c as Array<Record<string, unknown>>;
    expect(b2c).toHaveLength(1);
    expect(b2c[0]).toMatchObject({ ctid: 'B2C', sply: 'INTRA', pos: '27', txp: 18 });
  });
});

describe('buildGstr3bTables', () => {
  it('separates inter and intra supplies and nets the credit', () => {
    const t = buildGstr3bTables([intra(), inter()], {
      companyGstin: MAH_BUYER, period: '092026',
      itcRaw: { igst: 0, cgst: 100, sgst: 100, cess: 0 },
    });
    expect(t.table3.t313.igst).toBe(1800);
    expect(t.table3.t313.taxable).toBe(10000);
    expect(t.table3.t314.cgst).toBe(192.5);
    expect(t.table3.t314.sgst).toBe(192.5);
    expect(t.summary.outputTax).toBe(2185);
    expect(t.summary.itcEligible).toBe(200);
    expect(t.summary.netTaxPayable).toBe(1985);
    expect(t.isNil).toBe(false);
  });

  it('routes exports to the zero-rated line and nil-rated sales to exempt', () => {
    const exp = { ...inter(), invoiceNumber: 'EXP-1', isExport: true };
    const exempt = {
      ...intra(), invoiceNumber: 'NIL-1', customerGstNumber: null,
      cgstAmount: 0, sgstAmount: 0, totalAmount: 5000,
      items: [{ hsnCode: '1001', price: 5000, quantity: 1, gstRate: 0 }],
    };
    const t = buildGstr3bTables([exp, exempt], { companyGstin: MAH_BUYER, period: '092026', itcRaw: zeroItc() });
    expect(t.table3.t316.igst).toBe(1800);
    expect(t.table3.t312.exempt).toBe(5000);
    expect(t.table3.t314.taxable).toBe(0);
  });

  it('pulls credit notes into the downward adjustment line', () => {
    const t = buildGstr3bTables([intra()], {
      companyGstin: MAH_BUYER, period: '092026', itcRaw: zeroItc(), creditNoteTax: 385,
    });
    expect(t.table3.t315.downward).toBe(385);
  });

  it('nets credit notes off what is owed and adds debit notes back on', () => {
    // Returns must reduce the payable, or the taxpayer pays tax on goods they took back.
    const withCredit = buildGstr3bTables([intra(), inter()], {
      companyGstin: MAH_BUYER, period: '092026', itcRaw: zeroItc(), creditNoteTax: 385,
    });
    expect(withCredit.summary.outputTax).toBe(2185);
    expect(withCredit.summary.netTaxPayable).toBe(2185 - 385);
    const withDebit = buildGstr3bTables([intra(), inter()], {
      companyGstin: MAH_BUYER, period: '092026', itcRaw: zeroItc(), debitNoteTax: 385,
    });
    expect(withDebit.summary.netTaxPayable).toBe(2185 + 385);
  });

  it('nets the note tax on the head it was actually issued on', () => {
    const t = buildGstr3bTables([inter()], {
      companyGstin: MAH_BUYER, period: '092026', itcRaw: zeroItc(),
      creditNoteTax: 800, creditNoteSplit: { igst: 800, cgst: 0, sgst: 0, cess: 0 },
    });
    expect(t.utilisation.totalPayable.igst).toBe(1000);   // 1800 IGST less the 800 note
    expect(t.summary.netTaxPayable).toBe(1000);
  });

  it('never lets notes push the payable below zero', () => {
    const t = buildGstr3bTables([intra()], {
      companyGstin: MAH_BUYER, period: '092026', itcRaw: zeroItc(), creditNoteTax: 99999,
    });
    expect(t.summary.netTaxPayable).toBe(0);
    expect(t.summary.itcUsed).toBe(0);              // negative heads are not credit used up
    expect(t.summary.creditCarriedForward).toBe(0);
  });

  it('counts only usable credit when working out the cash to arrange', () => {
    // All-IGST month with CGST/SGST credit on hand. That credit cannot pay IGST,
    // so telling the seller they owe 1800 - 1000 would send them short by 1000.
    const t = buildGstr3bTables([inter()], {
      companyGstin: MAH_BUYER, period: '092026', itcRaw: { igst: 0, cgst: 500, sgst: 500, cess: 0 },
    });
    expect(t.summary.outputTax).toBe(1800);
    expect(t.summary.itcEligible).toBe(1000);
    expect(t.summary.itcUsed).toBe(0);
    expect(t.summary.netTaxPayable).toBe(1800);      // the full IGST in cash
    expect(t.summary.creditCarriedForward).toBe(1000);
  });

  it('spends IGST credit on IGST liability so cash falls', () => {
    const t = buildGstr3bTables([inter()], {
      companyGstin: MAH_BUYER, period: '092026', itcRaw: { igst: 700, cgst: 0, sgst: 0, cess: 0 },
    });
    expect(t.summary.itcUsed).toBe(700);
    expect(t.summary.netTaxPayable).toBe(1100);
    expect(t.summary.creditCarriedForward).toBe(0);
  });
});

describe('buildFilingPack', () => {
  const base = {
    expenses: [{ title: 'Courier', vendor: 'Delhivery', date: '2026-09-10', amount: 1180, taxAmount: 180 }],
    creditNotes: [],
    company: { gstin: MAH_BUYER, name: 'Acme Pvt', state: 'Maharashtra', gstinStateCode: '27' },
    period: '092026',
    asOf: new Date('2026-10-01T23:59:59'),
  };

  it('produces a clean, dated, checklist-bearing pack for a good period', () => {
    const p = buildFilingPack({ ...base, invoices: [intra(), inter()] });
    expect(p.validation.clean).toBe(true);
    expect(p.summary.outputTax).toBe(2185);
    expect(p.due.returns[1].dueDate).toBe('2026-10-20');
    expect(p.fees.daysLate).toBe(0);
    expect(p.checklist.length).toBeGreaterThanOrEqual(9);
    expect(p.checklist.some(s => /gst\.gov\.in/i.test(s.detail) || /portal/i.test(s.title))).toBe(true);
    expect(p.marketplaceSources.length).toBeGreaterThan(0);
  });

  it('assumes nothing is owed when there are no invoices and flags a nil period', () => {
    const p = buildFilingPack({ ...base, invoices: [], asOf: new Date('2026-11-04T23:59:59') });
    expect(p.summary.isNil).toBe(true);
    expect(p.summary.netTaxPayable).toBe(0);
    expect(p.fees.isNil).toBe(true);
    expect(p.fees.gstr1LateFee).toBe(200);
    expect(p.gstr3b.isNil).toBe(true);
  });

  it('surfaces the expense tax as credit and reduces what is owed', () => {
    const p = buildFilingPack({ ...base, invoices: [intra()] });
    expect(p.gstr3b.table4.net.cgst).toBe(90);      // 180 split 50/50
    expect(p.gstr3b.table4.net.sgst).toBe(90);
    expect(p.summary.itcEligible).toBe(180);
    expect(p.summary.netTaxPayable).toBe(385 - 180);
  });

  it('honours ineligible credit under section 17(5)', () => {
    const p = buildFilingPack({
      ...base, invoices: [intra()],
      ineligibleItc: { igst: 0, cgst: 40, sgst: 40, cess: 0 },
    });
    expect(p.gstr3b.table4.net.cgst).toBe(90 - 40);
    expect(p.summary.itcEligible).toBe(180 - 80);
  });

  it('carries a real credit note through to a lower payable', () => {
    const p = buildFilingPack({
      ...base, invoices: [intra(), inter()],
      creditNotes: [{ noteNumber: 'CN-0001-2026', customerGstNumber: KAR_BUYER, total: 5900, igstAmount: 900, createdAt: new Date('2026-09-20') }],
    });
    expect(p.gstr3b.table3.t315.downward).toBe(900);
    expect(p.gstr3b.utilisation.totalPayable.igst).toBe(1800 - 900);
    expect(p.summary.netTaxPayable).toBe(2185 - 180 - 900);
    const igstRow = (p.gstr1.docdata.cdnrp as Array<Record<string, unknown>>)[0];
    expect(igstRow.rchgs).toBe(KAR_BUYER);
    expect(igstRow.pos).toBe('29');   // from the recipient GSTIN, not a blank
  });

  it('keeps a credit note out of a period it was not issued in', () => {
    const p = buildFilingPack({
      ...base, period: '082026', invoices: [intra(), inter()],
      startDate: '2026-08-01', endDate: '2026-08-31',
      creditNotes: [{ noteNumber: 'CN-NOV', customerGstNumber: KAR_BUYER, total: 5900, igstAmount: 900, createdAt: new Date('2026-11-20') }],
    });
    expect(p.gstr3b.table3.t315.downward).toBe(0);
    expect(p.gstr1.docdata.cdnrp).toEqual([]);
    expect(p.summary.netTaxPayable).toBe(2185 - 180);
  });

  it('nets a credit note issued inside the requested window', () => {
    const p = buildFilingPack({
      ...base, invoices: [intra(), inter()],
      startDate: '2026-09-01', endDate: '2026-09-30',
      creditNotes: [{ noteNumber: 'CN-SEP', customerGstNumber: KAR_BUYER, total: 5900, igstAmount: 900, createdAt: new Date('2026-09-20') }],
    });
    expect(p.gstr3b.table3.t315.downward).toBe(900);
    expect(p.summary.netTaxPayable).toBe(2185 - 180 - 900);
  });

  it('warns without blocking when the range spans two tax periods', () => {
    const straddle = buildFilingPack({ ...base, invoices: [intra()], startDate: '2026-08-20', endDate: '2026-09-20' });
    const note = straddle.validation.warnings.find((w) => w.field === 'period');
    expect(note?.message).toMatch(/more than one tax period/);
    expect(straddle.validation.clean).toBe(true);   // never stops a filing
    const single = buildFilingPack({ ...base, invoices: [intra()], startDate: '2026-09-01', endDate: '2026-09-30' });
    expect(single.validation.warnings.some((w) => w.field === 'period')).toBe(false);
  });
});

describe('buildSheetRows', () => {
  const pack = () => buildFilingPack({ ...({
    expenses: [{ title: 'Courier', vendor: 'Delhivery', date: '2026-09-10', amount: 1180, taxAmount: 180 }],
    creditNotes: [],
    company: { gstin: MAH_BUYER, name: 'Acme Pvt', state: 'Maharashtra', gstinStateCode: '27' },
    period: '092026', asOf: new Date('2026-10-01T23:59:59'),
  }), invoices: [intra(), inter()] });

  it('flattens B2B into one row per invoice with the tax heads summed', () => {
    const rows = buildSheetRows('b2b', { portal: pack().gstr1 }) as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ invoice_no: 'AIN-001', place_of_supply: '27', igst: 0, cgst: 192.5, sgst: 192.5 });
    expect(rows[1]).toMatchObject({ invoice_no: 'AIN-002', igst: 1800, cgst: 0 });
  });

  it('lists every statutory table line so a taxpayer can type them in order', () => {
    const rows = buildSheetRows('3b-tables', { tables: pack().gstr3b }) as Array<Record<string, unknown>>;
    const tables = rows.map(r => r.table);
    expect(tables).toEqual(expect.arrayContaining(['3.1.0', '3.1.2', '3.1.3 (A)', '3.1.4 (B)', '4.18', '5', '6.1']));
  });

  it('turns the issue list into a downloadable fix sheet', () => {
    const p = pack();
    const rows = buildSheetRows('issues', { issues: [...p.validation.blocking, ...p.validation.warnings] });
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(0);   // clean period has nothing to fix
  });

  it('exports the credit rows from the expense register', () => {
    const rows = buildSheetRows('itc', {
      expenses: [{ title: 'Courier', vendor: 'Delhivery', date: '2026-09-10', amount: 1180, taxAmount: 180 }],
    }) as Array<Record<string, unknown>>;
    expect(rows[0]).toMatchObject({ vendor: 'Delhivery', tax_amount: 180, cgst_eligible: 90, sgst_eligible: 90 });
  });
});
