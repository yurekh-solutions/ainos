// GST return self-filing pack.
//
// AINOS does not submit returns. There is no public GSTN API for that, and the
// portal requires the taxpayer's own DSC / EVC / OTP. What this module does is
// turn the books into the exact numbers and files a taxpayer (or their CA)
// needs to complete the return on gst.gov.in without paying a filing service:
//
//   1. validate      - find the row-level defects that make the portal reject a return
//   2. portal JSON   - GSTN short-key docdata shape for GSTR-1 bulk upload
//   3. statutory tables - GSTR-3B table map with ITC utilisation order
//   4. sheet pack    - CSV per section, for manual entry or a CA handoff
//   5. dates & fees  - due dates, late fee and 18% interest exposure
//   6. checklist     - the portal click-path, step by step
//
// Figures follow the commonly used table numbering. The portal layout is
// revised periodically, so the UI always tells the user to confirm the table
// labels against what they see on screen.

import {
  GST_STATE_CODES, stateCodeFromGstin, gstPeriod, UT_STATE_CODES, type ReportInvoice, type HsnRow,
} from './gst';

const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** stateCodeFromGstin only regex-extracts the first two digits, so membership
 *  of the published code table has to be checked separately. */
export function isKnownStateCode(code?: string | null): boolean {
  if (!code) return false;
  return Object.prototype.hasOwnProperty.call(GST_STATE_CODES, String(code).slice(0, 2));
}

/** Normalise a stored place-of-supply (either "27" or a full GSTIN-ish token) to a 2-digit code. */
function normalisePos(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{2})/);
  return m ? m[1] : null;
}

/**
 * Place of supply for a row.
 *
 * AINOS only stores `placeOfSupply` when the invoice form sends one, so it is
 * routinely null even on perfectly valid invoices. The recipient GSTIN carries
 * the same information in its first two digits — which is exactly how the
 * portal fills it in — so derive it from there rather than reporting a defect
 * the taxpayer cannot fix, and rather than uploading a blank `pos`.
 */
export function resolvePlaceOfSupply(inv: {
  placeOfSupply?: string | null;
  customerGstNumber?: string | null;
}): string | null {
  const stated = normalisePos(inv.placeOfSupply);
  if (stated && isKnownStateCode(stated)) return stated;
  const fromGstin = stateCodeFromGstin(inv.customerGstNumber);
  if (fromGstin && isKnownStateCode(fromGstin)) return fromGstin;
  return stated;   // keep an unrecognised code visible so it can be warned about
}

// ── GSTIN validation ────────────────────────────────────────────────────────
// Format: 2 state digits + 10-char PAN + entity digit + Z + check char.
// The check char is derived from a weighted mod-36 of the first 14 characters,
// which catches transposition and typo errors before the portal rejects them.
const GSTIN_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GSTIN_WEIGHTS = [1, 3, 7, 9, 11, 13, 17, 19, 23, 29, 37, 41, 43, 47];

function gstinCharValue(ch: string): number {
  return GSTIN_ALPHABET.indexOf(ch);
}

export function gstinCheckChar(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = gstinCharValue(first14[i].toUpperCase());
    if (v < 0) return '';
    sum += v * GSTIN_WEIGHTS[i];
  }
  return GSTIN_ALPHABET[(36 - (sum % 36)) % 36] ?? '';
}

export interface GstinVerdict {
  valid: boolean;
  reason?: string;
  stateCode?: string | null;
  /** Format is certain per the GSTIN spec; the check digit uses a mod-36 series
   *  that is advisory only, so a mismatch never blocks a filing. */
  checkDigitMismatch?: boolean;
}

export function validateGstin(raw?: string | null): GstinVerdict {
  const g = (raw || '').trim().toUpperCase();
  if (!g) return { valid: false, reason: 'GSTIN missing' };
  if (g.length !== 15) return { valid: false, reason: `GSTIN must be 15 characters (found ${g.length})` };
  if (!/^\d{2}/.test(g)) return { valid: false, reason: 'First 2 characters must be the state code' };
  const stateCode = g.slice(0, 2);
  if (!isKnownStateCode(stateCode)) return { valid: false, reason: `Unknown state code ${stateCode}`, stateCode };
  // positions 3-12 are the PAN: 5 alpha, 4 digit, 1 alpha
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(g.slice(2, 12))) {
    return { valid: false, reason: 'Characters 3-12 must form a valid PAN', stateCode };
  }
  if (!/^\d$/.test(g[12])) return { valid: false, reason: 'Character 13 must be the entity number (1-9)', stateCode };
  if (g[13] !== 'Z') return { valid: false, reason: 'Character 14 must be Z', stateCode };
  const expected = gstinCheckChar(g.slice(0, 14));
  if (expected && g[14] !== expected) {
    // Advisory only. A wrong algorithm here must never stop someone filing.
    return { valid: true, stateCode, checkDigitMismatch: true, reason: `Check digit looks like it should be ${expected}` };
  }
  return { valid: true, stateCode };
}

// ── Filing scheme & statutory dates ─────────────────────────────────────────
export type FilingScheme = 'monthly' | 'qrmp' | 'composition';

export interface DueDates {
  scheme: FilingScheme;
  period: string;              // MMYYYY
  returns: Array<{ form: string; label: string; dueDate: string; note: string }>;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Next-month date string (YYYY-MM-DD) for a MMYYYY filing period. */
function nextMonthDate(fp: string, day: number): string {
  const mm = Number(fp.slice(0, 2));
  const yy = Number(fp.slice(2, 6));
  const y = mm === 12 ? yy + 1 : yy;
  const m = mm === 12 ? 1 : mm + 1;
  return `${y}-${pad2(m)}-${pad2(day)}`;
}

/** Indian FY quarters: Q1 Apr-Jun, Q2 Jul-Sep, Q3 Oct-Dec, Q4 Jan-Mar. */
function quarterOf(fp: string): { q: 1 | 2 | 3 | 4; label: string; endFp: string; monthInQuarter: number; fyStartYear: number } {
  const mm = Number(fp.slice(0, 2));
  const yy = Number(fp.slice(2, 6));
  const fyMonth = mm >= 4 ? mm - 3 : mm + 9;      // Apr = 1 ... Mar = 12
  const q = Math.ceil(fyMonth / 3) as 1 | 2 | 3 | 4;
  const endMm = ((q * 3 + 2) % 12) + 1;            // 6, 9, 12, 3
  const endYy = endMm >= mm ? yy : yy + 1;
  const fyStartYear = mm >= 4 ? yy : yy - 1;       // FY26 = Apr 2025 - Mar 2026
  return {
    q,
    label: `Q${q} FY${String((fyStartYear + 1) % 100).padStart(2, '0')}`,
    endFp: `${pad2(endMm)}${endYy}`,
    monthInQuarter: ((fyMonth - 1) % 3) + 1,
    fyStartYear,
  };
}

/** Statutory due dates. These are the standing deadlines; the notification
 *  calendar shifts them, so the UI flags them as "confirm on the portal". */
export function getDueDates(fp: string, scheme: FilingScheme = 'monthly'): DueDates {
  if (scheme === 'composition') {
    // CMP-08 is a quarterly statement: the deadline follows the end of the
    // quarter, not the month being viewed.
    const { label, endFp, fyStartYear } = quarterOf(fp);
    return {
      scheme, period: fp,
      returns: [
        { form: 'CMP-08', label: 'Quarterly statement', dueDate: nextMonthDate(endFp, 22), note: `Filed for ${label}; tax paid at 1% / 0.5% slab` },
        { form: 'GSTR-4', label: 'Annual return', dueDate: `${fyStartYear + 1}-04-30`, note: 'Annual statement of the financial year' },
      ],
    };
  }
  if (scheme === 'qrmp') {
    const { label, endFp, monthInQuarter } = quarterOf(fp);
    const returns: DueDates['returns'] = [];
    // IFF covers only the first two months of the quarter; the third month's
    // invoices go straight into the quarterly GSTR-1.
    if (monthInQuarter <= 2) {
      returns.push({ form: 'IFF', label: 'Invoice Furnishing Facility', dueDate: nextMonthDate(fp, 11), note: `Optional monthly B2B upload for month ${monthInQuarter} of ${label}` });
    }
    returns.push(
      { form: 'GSTR-1', label: 'Outward supplies (quarterly)', dueDate: nextMonthDate(endFp, 13), note: `Filed once for ${label}, due after the quarter closes` },
      { form: 'GSTR-3B', label: 'Summary return (quarterly)', dueDate: nextMonthDate(endFp, 22), note: `Filed once for ${label}, due after the quarter closes` },
    );
    return { scheme, period: fp, returns };
  }
  return {
    scheme, period: fp,
    returns: [
      { form: 'GSTR-1', label: 'Outward supplies', dueDate: nextMonthDate(fp, 11), note: 'All sales invoices for the period' },
      { form: 'GSTR-3B', label: 'Summary return', dueDate: nextMonthDate(fp, 20), note: 'Tax payment return; ITC claimed here' },
    ],
  };
}

// ── Late fee & interest ─────────────────────────────────────────────────────
export const LATE_FEE_PER_DAY = 50;          // ₹25 CGST + ₹25 SGST
export const NIL_LATE_FEE_PER_DAY = 10;      // ₹5 + ₹5

/** GSTR-3B late-fee ceiling by preceding-FY turnover, per the standing table. */
export function gstr3bLateFeeCap(taxableTurnoverPriorFy: number, isNil: boolean): number {
  if (isNil) return 500;
  if (taxableTurnoverPriorFy <= 2_50_00_000) return 1_000;
  if (taxableTurnoverPriorFy <= 5_00_00_000) return 2_000;
  if (taxableTurnoverPriorFy <= 10_00_00_000) return 3_000;
  return 5_000;
}

export const GSTR1_LATE_FEE_CAP = 500;       // non-nil, per return per FY
export const GSTR1_NIL_LATE_FEE_CAP = 200;

export interface FeeExposure {
  /** Days late on GSTR-3B, the return that drives interest. */
  daysLate: number;
  daysGstr1Late: number;
  gstr1LateFee: number;
  gstr3bLateFee: number;
  interestOnNetTax: number;
  total: number;
  isNil: boolean;
}

/** Days past a due date, floored at zero. */
export function daysPast(dueDateIso: string, asOf: Date = new Date()): number {
  const due = new Date(`${dueDateIso}T23:59:59`);
  if (asOf <= due) return 0;
  return Math.floor((asOf.getTime() - due.getTime()) / 86_400_000);
}

/**
 * What lateness costs. Interest is 18% p.a. simple on the net tax payable for
 * the days between the due date and payment. Late fee is per day, capped.
 */
export function computeFeeExposure(opts: {
  netTaxPayable: number;
  gstr1Due: string;
  gstr3bDue: string;
  taxableTurnoverPriorFy?: number;
  isNil?: boolean;
  asOf?: Date;
}): FeeExposure {
  const asOf = opts.asOf ?? new Date();
  const isNil = opts.isNil ?? false;
  const turnover = opts.taxableTurnoverPriorFy ?? 0;

  const d1 = daysPast(opts.gstr1Due, asOf);
  const d3 = daysPast(opts.gstr3bDue, asOf);

  const gstr1LateFee = Math.min(d1 * (isNil ? NIL_LATE_FEE_PER_DAY : LATE_FEE_PER_DAY), isNil ? GSTR1_NIL_LATE_FEE_CAP : GSTR1_LATE_FEE_CAP);
  const gstr3bLateFee = Math.min(d3 * (isNil ? NIL_LATE_FEE_PER_DAY : LATE_FEE_PER_DAY), gstr3bLateFeeCap(turnover, isNil));
  const interestOnNetTax = r2((Math.max(0, opts.netTaxPayable) * 18 * d3) / 36500);

  return {
    daysLate: d3,
    daysGstr1Late: d1,
    gstr1LateFee: r2(gstr1LateFee),
    gstr3bLateFee: r2(gstr3bLateFee),
    interestOnNetTax,
    total: r2(gstr1LateFee + gstr3bLateFee + interestOnNetTax),
    isNil,
  };
}

// ── Data validation ─────────────────────────────────────────────────────────
export interface Issue {
  severity: 'blocking' | 'warning';
  invoiceNumber: string;
  field: string;
  message: string;
  fixHref?: string;
}

export interface ValidationReport {
  blocking: Issue[];
  warnings: Issue[];
  checked: number;
  clean: boolean;
}

/**
 * Portal rejections almost always come from row-level data defects, not from
 * the maths. Check them before generating anything.
 */
export function validateForFiling(
  invoices: ReportInvoice[],
  opts: { sellerGstin?: string | null; sellerStateCode?: string | null } = {},
): ValidationReport {
  const blocking: Issue[] = [];
  const warnings: Issue[] = [];
  const sellerState = opts.sellerStateCode || stateCodeFromGstin(opts.sellerGstin);
  const seenNumbers = new Set<string>();

  for (const inv of invoices) {
    const num = inv.invoiceNumber || '(blank)';
    const push = (list: Issue[], field: string, message: string) =>
      list.push({ severity: list === blocking ? 'blocking' : 'warning', invoiceNumber: num, field, message, fixHref: '/invoices' });

    if (!inv.invoiceNumber) push(blocking, 'invoiceNumber', 'Invoice has no number; the portal requires a unique serial');
    if (seenNumbers.has(num)) push(blocking, 'invoiceNumber', `Duplicate invoice number ${num} within the period`);
    seenNumbers.add(num);

    if (!inv.invoiceDate) push(blocking, 'invoiceDate', 'Invoice date missing — cannot be placed in a tax period');

    // Place of supply decides the CGST/SGST vs IGST split. A recipient GSTIN
    // supplies it just as reliably as the dedicated field, so only a row with
    // neither is a genuine blocker.
    const pos = resolvePlaceOfSupply(inv);
    if (!pos) {
      push(blocking, 'placeOfSupply', 'Place of supply is unknown — set the 2-digit state code on the invoice, or add the recipient GSTIN');
    } else if (!isKnownStateCode(pos)) {
      push(warnings, 'placeOfSupply', `Place of supply code ${pos} is not a recognised state code`);
    }

    const recipientGstin = inv.customerGstNumber?.trim();
    if (recipientGstin) {
      const v = validateGstin(recipientGstin);
      if (!v.valid) push(blocking, 'customerGstNumber', `Recipient GSTIN ${recipientGstin} is invalid — ${v.reason}`);
      else {
        if (v.checkDigitMismatch) push(warnings, 'customerGstNumber', `Recipient GSTIN ${recipientGstin} — ${v.reason}`);
        if (pos && v.stateCode && v.stateCode !== pos) {
          push(warnings, 'placeOfSupply', `Recipient GSTIN state ${v.stateCode} differs from place of supply ${pos}`);
        }
      }
    } else if ((inv.totalAmount || 0) > 2_50_000 && inv.supplyType === 'inter') {
      push(warnings, 'customerGstNumber', 'Inter-state invoice above ₹2.5 lakh with no GSTIN — reported as B2C (large)');
    }

    // Supply type must agree with place of supply.
    const derived: 'intra' | 'inter' = sellerState && pos && sellerState !== pos ? 'inter' : 'intra';
    if (inv.supplyType && derived !== inv.supplyType) {
      push(blocking, 'supplyType', `Tagged ${inv.supplyType} but place of supply ${pos || 'not set'} implies ${derived}`);
    }

    // Tax columns must reconcile with the invoice total.
    const tax = r2((inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0) + (inv.utgstAmount || 0));
    const net = r2((inv.totalAmount || 0) - tax);
    if (tax < 0 || net < 0) push(blocking, 'totalAmount', 'Negative taxable value or tax amount');
    if (derived === 'inter' && ((inv.cgstAmount || 0) > 0 || (inv.sgstAmount || 0) > 0)) {
      push(blocking, 'cgstAmount', 'Inter-state supply cannot carry CGST/SGST');
    }
    if (derived === 'intra' && (inv.igstAmount || 0) > 0) {
      push(blocking, 'igstAmount', 'Intra-state supply cannot carry IGST');
    }
    if (derived === 'intra' && sellerState && UT_STATE_CODES.has(sellerState) && (inv.sgstAmount || 0) > 0) {
      push(warnings, 'sgstAmount', 'Union Territory supply should be reported as CGST + UTGST');
    }

    // HSN/SAC is mandatory above the turnover threshold.
    const items = Array.isArray(inv.items) ? inv.items : [];
    for (const it of items) {
      const hsn = String((it as Record<string, unknown>).hsnCode ?? (it as Record<string, unknown>).hsn ?? '');
      if (!hsn || hsn === 'NA') { push(warnings, 'hsnCode', `Line item on ${num} has no HSN/SAC code`); break; }
    }
  }

  return { blocking, warnings, checked: invoices.length, clean: blocking.length === 0 };
}

// ── GSTR-1 portal JSON (GSTN short-key docdata) ─────────────────────────────
export interface PortalGstr1 {
  version: string;
  gstin: string;
  fp: string;
  gt: string;
  trfdt: string;
  supfdt: string;
  docdata: Record<string, unknown>;
  _notes: string[];
}

interface B2bItem {
  num: number; hsn: string; nm: string; uq: string; qty: number;
  /** GSTN item-detail keys: txval taxable, rt rate, iamt/camt/samt/kamt tax heads. */
  txval: number; rt: number; iamt: number; camt: number; samt: number; kamt: number;
}

interface B2bRow {
  ctid: string; inum: string; idt: string | null; val: number; pos: string;
  rchgs: string; rtrd: string;
  itms: B2bItem[];
}

/**
 * GSTN-schema GSTR-1 upload file. Section keys and short field names follow the
 * public portal JSON contract (b2b / b2cl / b2c / cdnrp / nil / noinv / at /
 * hsnsb2c / hsn1..hsn6, with txval / iamt / camt / samt / kamt for tax heads).
 */
export function buildPortalGstr1(
  invoices: ReportInvoice[],
  companyGstin: string,
  period: string,
  opts: { sellerStateCode?: string | null; amendmentNumber?: number; creditNotes?: Array<{ noteNumber: string; customerGstNumber?: string | null; total?: number | null; cgstAmount?: number | null; sgstAmount?: number | null; igstAmount?: number | null; noteDate?: Date | string | null }> } = {},
): PortalGstr1 {
  const b2b: B2bRow[] = [];
  const b2cl: Array<Record<string, unknown>> = [];
  const b2c = new Map<string, { sply: string; pos: string; rate: number; txval: number; iamt: number; camt: number; samt: number; kamt: number }>();
  const nil: Array<Record<string, unknown>> = [];
  const gtPrefix = (opts.amendmentNumber ?? 0) > 0 ? 'A' : 'R';

  for (const inv of invoices) {
    const items = Array.isArray(inv.items) ? inv.items as Array<Record<string, unknown>> : [];
    const gstin = inv.customerGstNumber?.trim().toUpperCase() || '';
    const isB2B = validateGstin(gstin).valid;
    const pos = resolvePlaceOfSupply(inv) || '';
    const taxInv = r2((inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0) + (inv.utgstAmount || 0));
    const txval = r2(items.length
      ? items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0)
      : (inv.totalAmount || 0) - taxInv);
    const idt = inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().slice(0, 10) : null;

    if (isB2B) {
      b2b.push({
        ctid: 'B2B_REG',
        inum: inv.invoiceNumber, idt, val: r2(inv.totalAmount || 0), pos,
        rchgs: gstin, rtrd: inv.customerName || '',
        itms: items.length ? items.map((it, i) => {
          const lineTaxable = r2((Number(it.price) || 0) * (Number(it.quantity) || 0));
          const lineTax = r2(Number(it.taxAmount) || (lineTaxable * (Number(it.gstRate) || 0)) / 100);
          const inter = inv.supplyType === 'inter';
          return {
            num: i + 1, hsn: String(it.hsnCode ?? it.hsn ?? ''), nm: String(it.description ?? it.productName ?? ''),
            uq: String(it.unit ?? 'PCS'), qty: Number(it.quantity) || 0,
            txval: lineTaxable, rt: Number(it.gstRate) || 0,
            iamt: inter ? lineTax : 0,
            camt: inter ? 0 : r2(lineTax / 2),
            samt: inter ? 0 : r2(lineTax - r2(lineTax / 2)),
            kamt: 0,
          };
        }) : [{
          num: 1, hsn: '', nm: '', uq: 'PCS', qty: 0, txval, rt: 0,
          iamt: r2(inv.igstAmount || 0), camt: r2(inv.cgstAmount || 0),
          samt: r2((inv.sgstAmount || 0) + (inv.utgstAmount || 0)), kamt: 0,
        }],
      });
      continue;
    }

    const rate = items.length ? Math.max(0, ...items.map((it) => Number(it.gstRate) || 0)) : 0;
    const inter = inv.supplyType === 'inter';

    if (rate === 0 && taxInv === 0) {
      nil.push({
        ctid: 'NIL', inum: inv.invoiceNumber, idt, invall: r2(inv.totalAmount || 0),
        typr: 'N',       // nil rated
        pos, rchgs: gstin, rtrd: inv.customerName || '',
      });
      continue;
    }

    if (inter && (inv.totalAmount || 0) > 2_50_000) {
      b2cl.push({
        ctid: 'B2CL', inum: inv.invoiceNumber, idt, val: r2(inv.totalAmount || 0),
        pos, txp: rate, igst: r2(inv.igstAmount || 0), cess: 0,
      });
      continue;
    }

    const key = `${inter ? 'INTER' : 'INTRA'}|${pos}|${rate}`;
    const cur = b2c.get(key) || { sply: inter ? 'INTER' : 'INTRA', pos, rate, txval: 0, iamt: 0, camt: 0, samt: 0, kamt: 0 };
    cur.txval = r2(cur.txval + txval);
    cur.iamt = r2(cur.iamt + (inv.igstAmount || 0));
    cur.camt = r2(cur.camt + (inv.cgstAmount || 0));
    cur.samt = r2(cur.samt + (inv.sgstAmount || 0) + (inv.utgstAmount || 0));
    b2c.set(key, cur);
  }

  const cdnrp = (opts.creditNotes || []).map((cn) => ({
    ctid: 'CDNR_REG', num: cn.noteNumber,
    dt: cn.noteDate ? new Date(cn.noteDate).toISOString().slice(0, 10) : null,
    rchgs: cn.customerGstNumber || '', pos: resolvePlaceOfSupply({ customerGstNumber: cn.customerGstNumber }) || '',
    itms: [{
      typr: 'R', num: 1, txval: r2((cn.total || 0) - (cn.cgstAmount || 0) - (cn.sgstAmount || 0) - (cn.igstAmount || 0)),
      iamt: r2(cn.igstAmount || 0), camt: r2(cn.cgstAmount || 0), samt: r2(cn.sgstAmount || 0), kamt: 0, rt: 0,
    }],
  }));

  const hsnRows: HsnRow[] = [];
  const hsnAgg = new Map<string, HsnRow>();
  for (const inv of invoices) {
    for (const it of (Array.isArray(inv.items) ? inv.items as Array<Record<string, unknown>> : [])) {
      const hsn = String(it.hsnCode ?? it.hsn ?? '');
      if (!hsn) continue;
      const taxable = r2((Number(it.price) || 0) * (Number(it.quantity) || 0));
      const tax = r2(Number(it.taxAmount) || (taxable * (Number(it.gstRate) || 0)) / 100);
      const inter = inv.supplyType === 'inter';
      const key = `${hsn}|${inv.supplyType || 'intra'}`;
      const cur = hsnAgg.get(key) || { hsn, description: String(it.description ?? it.productName ?? ''), uqc: String(it.unit ?? 'PCS'), quantity: 0, taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 };
      cur.quantity += Number(it.quantity) || 0;
      cur.taxableValue = r2(cur.taxableValue + taxable);
      if (inter) cur.igst = r2(cur.igst + tax);
      else { cur.cgst = r2(cur.cgst + tax / 2); cur.sgst = r2(cur.sgst + (tax - r2(tax / 2))); }
      hsnAgg.set(key, cur);
    }
  }
  hsnRows.push(...hsnAgg.values());
  const hsnByDigits = new Map<number, Array<Record<string, unknown>>>();
  for (const row of hsnRows) {
    const digits = row.hsn.replace(/\D/g, '').length >= 6 ? 6 : row.hsn.replace(/\D/g, '').length >= 4 ? 4 : 0;
    if (!digits) continue;
    const list = hsnByDigits.get(digits) || [];
    list.push({
      ctid: `HSN_${digits}`, hsn: row.hsn, desc: row.description, uqc: row.uqc,
      qty: row.quantity, txval: row.taxableValue, iamt: row.igst, camt: row.cgst, samt: row.sgst, kamt: row.cess,
    });
    hsnByDigits.set(digits, list);
  }

  return {
    version: 'GSTR1V1.0',
    gstin: companyGstin, fp: period, gt: `${gtPrefix}3.1`,
    trfdt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    supfdt: new Date().toISOString().slice(0, 10),
    docdata: {
      b2b, b2cl: [...b2cl], b2c: [...b2c.values()].map((v) => ({
        ctid: 'B2C', sply: v.sply, pos: v.pos, txp: v.rate, txval: v.txval, iamt: v.iamt, camt: v.camt, samt: v.samt, kamt: v.kamt,
      })),
      cdnrp, nil, noinv: [], at: [], txpd: [], exp: [], boe: [],
      hsnsb2c: [],
      hsn1: [], hsn2: [], hsn3: [], hsn4: hsnByDigits.get(4) || [], hsn5: [], hsn6: hsnByDigits.get(6) || [],
    },
    _notes: [
      'Tax heads map to iamt=IGST, camt=CGST, samt=SGST/UTGST, kamt=Cess.',
      'This is an upload aid, not a submitted return. Submission happens only on gst.gov.in with your own DSC / EVC / OTP.',
      'Section and field names follow the public portal JSON contract. If the portal rejects the file, fall back to manual entry using the CSV sheet pack; the figures are identical.',
    ],
  };
}

// ── GSTR-3B statutory tables ───────────────────────────────────────────────
export interface TaxRow3b { taxable: number; igst: number; cgst: number; sgst: number; cess: number }
const empty3b = (): TaxRow3b => ({ taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });
function addTo(row: TaxRow3b, taxable: number, igst: number, cgst: number, sgst: number, cess = 0) {
  row.taxable = r2(row.taxable + taxable);
  row.igst = r2(row.igst + igst); row.cgst = r2(row.cgst + cgst); row.sgst = r2(row.sgst + sgst); row.cess = r2(row.cess + cess);
}

export interface ItcSplit { igst: number; cgst: number; sgst: number; cess: number }
export interface Utilisation { itcUsed: ItcSplit; cashPaid: ItcSplit; totalPayable: ItcSplit }

/**
 * Statutory set-off order: IGST first against IGST then CGST then SGST,
 * CGST against CGST then SGST, SGST last. UTGST is treated with SGST here.
 */
export function utiliseItc(payable: ItcSplit, itc: ItcSplit): Utilisation {
  // A head that nets below zero (heavy credit notes, for instance) is a refund
  // position, not a liability — clamping here stops the set-off maths from
  // "using" negative credit.
  const need: ItcSplit = {
    igst: r2(Math.max(0, payable.igst)), cgst: r2(Math.max(0, payable.cgst)),
    sgst: r2(Math.max(0, payable.sgst)), cess: r2(Math.max(0, payable.cess)),
  };
  const have: ItcSplit = { igst: r2(itc.igst), cgst: r2(itc.cgst), sgst: r2(itc.sgst), cess: r2(itc.cess) };
  const used: ItcSplit = { igst: 0, cgst: 0, sgst: 0, cess: 0 };

  // IGST credit is the most flexible pool: IGST liability -> CGST -> SGST.
  let igstPool = have.igst;
  used.igst = r2(Math.max(0, Math.min(igstPool, need.igst))); igstPool = r2(igstPool - used.igst);
  used.cgst = r2(Math.max(0, Math.min(igstPool, need.cgst))); igstPool = r2(igstPool - used.cgst);
  used.sgst = r2(Math.max(0, Math.min(igstPool, need.sgst)));

  // CGST credit may cover CGST, then SGST — never IGST.
  let cgstPool = have.cgst;
  const cgstExtra = r2(Math.min(cgstPool, Math.max(0, need.cgst - used.cgst)));
  used.cgst = r2(used.cgst + cgstExtra); cgstPool = r2(cgstPool - cgstExtra);
  const cgstToSgst = r2(Math.min(cgstPool, Math.max(0, need.sgst - used.sgst)));
  used.sgst = r2(used.sgst + cgstToSgst);

  // SGST credit closes only the remaining SGST liability.
  used.sgst = r2(used.sgst + r2(Math.min(have.sgst, Math.max(0, need.sgst - used.sgst))));

  // Cess is always paid in cash; it can never be settled from ITC.
  const cash: ItcSplit = {
    igst: r2(Math.max(0, need.igst - used.igst)),
    cgst: r2(Math.max(0, need.cgst - used.cgst)),
    sgst: r2(Math.max(0, need.sgst - used.sgst)),
    cess: need.cess,
  };
  return { itcUsed: used, cashPaid: cash, totalPayable: need };
}

// ── 3B build ────────────────────────────────────────────────────────────────
export interface Gstr3bTables {
  version: string;
  gstin: string;
  fp: string;
  generatedAt: string;
  isNil: boolean;
  table3: {
    t310: TaxRow3b;   // outward supplies (inter-state, excluding zero-rated & exempt)
    t311: TaxRow3b;   // inward supplies liable to RCM (inter + intra)
    t312: { exempt: number };  // outward nil-rated, exempt & non-GST
    t313: TaxRow3b;   // inter-state supplies (IGST)
    t314: TaxRow3b;   // intra-state supplies (CGST/SGST) + zero-rated
    t315: { upward: number; downward: number };
    t316: TaxRow3b;   // zero-rated on payment of tax (LUT/exp)
  };
  table4: { eligible: ItcSplit; ineligible: ItcSplit; net: ItcSplit };
  table5: { interest: number; lateFee: number; other: number };
  table6: { rcm: ItcSplit; itcOnRcm: ItcSplit };
  summary: { outputTax: number; itcEligible: number; itcUsed: number; netTaxPayable: number; creditCarriedForward: number };
  utilisation: Utilisation;
  notes: string[];
}

/**
 * GSTR-3B summary built from the books. ITC comes from approved expense tax,
 * which AINOS records without a tax-type tag, so it is assumed intra-state
 * (CGST + SGST split 50/50) unless a tag is supplied.
 */
export function buildGstr3bTables(
  invoices: ReportInvoice[],
  opts: {
    companyGstin: string;
    period: string;
    itcRaw?: ItcSplit;
    ineligibleItc?: ItcSplit;
    creditNoteTax?: number;
    debitNoteTax?: number;
    /** Per-head note tax when the caller knows it; otherwise assumed intra-state. */
    creditNoteSplit?: Partial<ItcSplit>;
    debitNoteSplit?: Partial<ItcSplit>;
    fee?: { interest?: number; lateFee?: number; other?: number };
    rcm?: { igst?: number; cgst?: number; sgst?: number };
  },
): Gstr3bTables {
  const t313 = empty3b();  // inter-state
  const t314 = empty3b();  // intra-state
  const t316 = empty3b();  // zero-rated / export
  let exempt = 0;

  for (const inv of invoices) {
    const items = Array.isArray(inv.items) ? inv.items as Array<Record<string, unknown>> : [];
    const taxInv = r2((inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0) + (inv.utgstAmount || 0));
    const taxable = r2(items.length
      ? items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0)
      : (inv.totalAmount || 0) - taxInv);
    const igst = r2(inv.igstAmount || 0);
    const cgst = r2(inv.cgstAmount || 0);
    const sgst = r2((inv.sgstAmount || 0) + (inv.utgstAmount || 0));
    const rate = items.length ? Math.max(0, ...items.map((it) => Number(it.gstRate) || 0)) : 0;

    if (inv.isExport) { addTo(t316, taxable, igst, cgst, sgst); continue; }
    if (rate === 0 && taxInv === 0) { exempt = r2(exempt + (inv.totalAmount || 0)); continue; }
    if (inv.supplyType === 'inter') addTo(t313, taxable, igst, 0, sgst);
    else addTo(t314, taxable, 0, cgst, sgst);
  }

  const itcEligible: ItcSplit = {
    igst: r2(opts.itcRaw?.igst || 0), cgst: r2(opts.itcRaw?.cgst || 0), sgst: r2(opts.itcRaw?.sgst || 0), cess: r2(opts.itcRaw?.cess || 0),
  };
  const ineligible: ItcSplit = {
    igst: r2(opts.ineligibleItc?.igst || 0), cgst: r2(opts.ineligibleItc?.cgst || 0), sgst: r2(opts.ineligibleItc?.sgst || 0), cess: r2(opts.ineligibleItc?.cess || 0),
  };
  const netItc: ItcSplit = {
    igst: r2(Math.max(0, itcEligible.igst - ineligible.igst)),
    cgst: r2(Math.max(0, itcEligible.cgst - ineligible.cgst)),
    sgst: r2(Math.max(0, itcEligible.sgst - ineligible.sgst)),
    cess: r2(Math.max(0, itcEligible.cess - ineligible.cess)),
  };

  const outputTax = r2(t313.igst + t313.cgst + t313.sgst + t314.igst + t314.cgst + t314.sgst + t316.igst + t316.cgst + t316.sgst);
  const rcmTax: ItcSplit = { igst: r2(opts.rcm?.igst || 0), cgst: r2(opts.rcm?.cgst || 0), sgst: r2(opts.rcm?.sgst || 0), cess: 0 };
  const totalItcClaim = r2(netItc.igst + netItc.cgst + netItc.sgst);

  // Credit notes cut the tax you owe and debit notes add to it. The portal draws
  // table 3 with CDNR already netted into it, so each head has to follow or a
  // seller with returns pays tax on goods they took back.
  const cnHeads = noteHeads(opts.creditNoteSplit, opts.creditNoteTax);
  const dnHeads = noteHeads(opts.debitNoteSplit, opts.debitNoteTax);

  const payableHeads: ItcSplit = {
    igst: r2(t313.igst + t314.igst + t316.igst + rcmTax.igst + dnHeads.igst - cnHeads.igst),
    cgst: r2(t313.cgst + t314.cgst + t316.cgst + rcmTax.cgst + dnHeads.cgst - cnHeads.cgst),
    sgst: r2(t313.sgst + t314.sgst + t316.sgst + rcmTax.sgst + dnHeads.sgst - cnHeads.sgst),
    cess: r2(t313.cess + t314.cess + t316.cess),
  };

  // Credit that sits in the wrong head cannot be spent: an IGST liability may not
  // be met with CGST or SGST credit. So the money a seller has to arrange is what
  // stays cash after the set-off, not the liability minus the whole credit balance.
  // Showing the smaller figure sends people to the challan short by the stranded
  // balance, which then attracts 18% interest on the shortfall.
  const utilisation = utiliseItc(payableHeads, netItc);
  const itcUsed = r2(utilisation.itcUsed.igst + utilisation.itcUsed.cgst + utilisation.itcUsed.sgst + utilisation.itcUsed.cess);
  const cashPayable = r2(utilisation.cashPaid.igst + utilisation.cashPaid.cgst + utilisation.cashPaid.sgst + utilisation.cashPaid.cess);
  const creditCarriedForward = r2(Math.max(0, totalItcClaim - itcUsed));
  const netTaxPayable = cashPayable;

  const notes = [
    'ITC is derived from approved expense records. AINOS stores expense tax without a CGST/SGST/IGST tag, so it is assumed intra-state and split 50/50.',
    'Credit notes reduce the payable and debit notes add to it, the way the portal nets CDNR into table 3. When only a total is known the note tax is assumed intra-state too.',
    'Nil return: if there are no supplies, table 3 is zero but the return is still due and ITC can still be claimed.',
    'Set-off follows the IGST -> CGST -> SGST order. CGST and SGST credit cannot meet an IGST liability, so whatever the set-off leaves unpaid becomes a cash payment through challan CSR-0070, and unused credit stays in the Electronic Credit Ledger.',
  ];

  return {
    version: 'AINOS_GSTR3B_TABLES_v1',
    gstin: opts.companyGstin, fp: opts.period, generatedAt: new Date().toISOString(),
    isNil: invoices.length === 0 && exempt === 0,
    table3: {
      t310: empty3b(),
      t311: { taxable: 0, igst: rcmTax.igst, cgst: rcmTax.cgst, sgst: rcmTax.sgst, cess: 0 },
      t312: { exempt },
      t313, t314,
      t315: { upward: r2(opts.debitNoteTax || 0), downward: r2(opts.creditNoteTax || 0) },
      t316,
    },
    table4: { eligible: itcEligible, ineligible, net: netItc },
    table5: {
      interest: r2(opts.fee?.interest || 0),
      lateFee: r2(opts.fee?.lateFee || 0),
      other: r2(opts.fee?.other || 0),
    },
    table6: { rcm: rcmTax, itcOnRcm: emptyItc() },
    summary: { outputTax, itcEligible: totalItcClaim, itcUsed, netTaxPayable, creditCarriedForward },
    utilisation,
    notes,
  };
}

function emptyItc(): ItcSplit { return { igst: 0, cgst: 0, sgst: 0, cess: 0 }; }

/**
 * Note tax per head. Uses the real split when the caller has it; with only a
 * total it falls back to the same 50/50 intra-state assumption used for
 * expense credit, so the set-off heads stay consistent with the bottom line.
 */
function noteHeads(split?: Partial<ItcSplit>, scalarTotal?: number): ItcSplit {
  if (split) {
    return { igst: r2(split.igst || 0), cgst: r2(split.cgst || 0), sgst: r2(split.sgst || 0), cess: r2(split.cess || 0) };
  }
  const total = r2(scalarTotal || 0);
  if (!total) return emptyItc();
  return { igst: 0, cgst: r2(total / 2), sgst: r2(total - r2(total / 2)), cess: 0 };
}

// ── CSV sheet pack ─────────────────────────────────────────────────────────
export type SheetKind = 'b2b' | 'b2c' | 'hsn' | '3b-tables' | 'itc' | 'issues';

export function buildSheetRows(
  kind: SheetKind,
  data: {
    invoices?: ReportInvoice[];
    portal?: PortalGstr1;
    tables?: Gstr3bTables;
    expenses?: Array<{ title: string | null; vendor: string | null; date: Date | string; amount: number; taxAmount: number }>;
    issues?: Issue[];
  },
): Array<Record<string, unknown>> {
  if (kind === 'b2b') {
    return ((data.portal?.docdata?.b2b || []) as B2bRow[]).map((r) => ({
      invoice_no: r.inum, invoice_date: r.idt, invoice_value: r.val, place_of_supply: r.pos,
      recipient_gstin: r.rchgs, recipient_trade_name: r.rtrd,
      taxable_value: r2(r.itms.reduce((s, i) => s + i.txval, 0)),
      igst: r2(r.itms.reduce((s, i) => s + i.iamt, 0)),
      cgst: r2(r.itms.reduce((s, i) => s + i.camt, 0)),
      sgst: r2(r.itms.reduce((s, i) => s + i.samt, 0)),
      cess: r2(r.itms.reduce((s, i) => s + i.kamt, 0)),
    }));
  }
  if (kind === 'b2c') {
    return ((data.portal?.docdata?.b2c || []) as Array<Record<string, unknown>>).map((r) => ({
      supply_type: r.sply, place_of_supply: r.pos, rate: r.txp,
      taxable_value: r.txval, igst: r.iamt, cgst: r.camt, sgst: r.samt, cess: r.kamt,
    }));
  }
  if (kind === 'hsn') {
    const rows: Array<Record<string, unknown>> = [];
    for (const key of ['hsn4', 'hsn6'] as const) {
      for (const r of ((data.portal?.docdata?.[key] || []) as Array<Record<string, unknown>>)) rows.push(r);
    }
    return rows.map((r) => ({
      hsn_sac: r.hsn, description: r.desc, uqc: r.uqc, quantity: r.qty,
      taxable_value: r.txval, igst: r.iamt, cgst: r.camt, sgst: r.samt, cess: r.kamt,
    }));
  }
  if (kind === '3b-tables') {
    const t = data.tables;
    if (!t) return [];
    type Cell = number | TaxRow3b | ItcSplit;
    type SheetCells = { taxable?: number; igst?: number; cgst?: number; sgst?: number; cess?: number };
    const asRow = (v: Cell): SheetCells | null => (typeof v === 'number' ? null : v as SheetCells);
    const line = (table: string, label: string, v: Cell) => ({
      table,
      description: label,
      taxable_value: asRow(v)?.taxable ?? '',
      igst: asRow(v)?.igst ?? '',
      cgst: asRow(v)?.cgst ?? '',
      sgst: asRow(v)?.sgst ?? '',
      cess: asRow(v)?.cess ?? '',
      amount: typeof v === 'number' ? v : '',
    });
    return [
      line('3.1.0', 'Outward supplies (excluding zero rated / exempt)', t.table3.t310),
      line('3.1.1', 'Inward supplies liable to reverse charge', t.table3.t311),
      line('3.1.2', 'Outward nil / exempt / non-GST supplies', t.table3.t312.exempt),
      line('3.1.3 (A)', 'Inter-state supplies (IGST)', t.table3.t313),
      line('3.1.4 (B)', 'Intra-state supplies (CGST / SGST)', t.table3.t314),
      line('3.1.5 (A)', 'Zero rated supplies (export on tax)', t.table3.t316),
      line('3.1.5 (B1)', 'Upward adjustments (debit notes)', t.table3.t315.upward),
      line('3.1.5 (B2)', 'Downward adjustments (credit notes)', t.table3.t315.downward),
      line('4.04', 'ITC available - non blocked (imports / RCM / other)', t.table4.eligible),
      line('4.13-4.17', 'ITC ineligible u/s 17(5)', t.table4.ineligible),
      line('4.18', 'Net ITC available for set off', t.table4.net),
      line('5', 'Interest', t.table5.interest),
      line('5', 'Late fee', t.table5.lateFee),
      line('6.1', 'Tax paid in ITC heads (set off)', t.utilisation.itcUsed),
      line('6.1', 'Tax paid in cash (challan)', t.utilisation.cashPaid),
    ];
  }
  if (kind === 'itc') {
    return (data.expenses || []).map((e) => ({
      date: typeof e.date === 'string' ? e.date.slice(0, 10) : new Date(e.date).toISOString().slice(0, 10),
      vendor: e.vendor || '', title: e.title || '', amount: e.amount, tax_amount: e.taxAmount || 0,
      cgst_eligible: r2((e.taxAmount || 0) / 2), sgst_eligible: r2((e.taxAmount || 0) - r2((e.taxAmount || 0) / 2)),
    }));
  }
  return (data.issues || []).map((i) => ({
    severity: i.severity, invoice_no: i.invoiceNumber, field: i.field, message: i.message,
  }));
}

// ── Portal filing checklist ────────────────────────────────────────────────
export interface ChecklistStep {
  n: number;
  title: string;
  detail: string;
  portalPath?: string;
}

/**
 * The manual path that a filing service charges for. Steps are the standing
 * portal flow; exact menu labels move between portal releases.
 */
export function buildFilingChecklist(opts: {
  gstin: string;
  period: string;
  scheme: FilingScheme;
  netTaxPayable: number;
  hasBlockingIssues: boolean;
  isNil: boolean;
}): ChecklistStep[] {
  const steps: ChecklistStep[] = [
    { n: 1, title: 'Fix the flagged rows before you start', detail: opts.hasBlockingIssues
      ? 'This period still has blocking issues. Open the issues sheet, correct the invoices, then rebuild the pack.'
      : 'No blocking issues found for this period, so the pack is ready to upload.' },
    { n: 2, title: 'Sign in to the GST portal', detail: `Use the login for ${opts.gstin || 'your GSTIN'}. One taxpayer can hold their own EVC and never need an intermediary.`, portalPath: 'gst.gov.in > Login' },
    { n: 3, title: 'Open the Returns Dashboard for this period', detail: 'Select the financial year and the tax period, then continue.', portalPath: 'Services > Returns > Returns Dashboard' },
    { n: 4, title: 'File GSTR-1 (details of outward supplies)', detail: opts.scheme === 'qrmp'
      ? 'Under QRMP-1 you may use IFF monthly for the first two months and file GSTR-1 once for the quarter.'
      : 'Choose Prepare Online, then either upload the portal JSON from this pack or key the B2B / B2C / HSN sections from the CSV sheets.', portalPath: 'Returns Dashboard > GSTR-1 > Prepare New Returns' },
  ];
  if (opts.netTaxPayable > 0) {
    steps.push({
      n: 5, title: 'Pay the tax through challan CSR-0070', detail: `Create the challan for ₹${opts.netTaxPayable.toLocaleString('en-IN')}, pay by net banking / NEFT / UPI, then let it reflect in Cash Ledger.`, portalPath: 'Services > Payments > Create Challan (Offline Payment)' },
    );
  } else {
    steps.push({ n: 5, title: 'No cash payment expected for this period', detail: opts.isNil
      ? 'Nil return: nothing to pay, but the return is still due and late fee applies if you miss the date.'
      : 'Your ITC fully covers the liability, so only the late fee (if any) needs a challan.' });
  }
  steps.push(
    { n: 6, title: 'Verify the auto-drawn GSTR-3B', detail: 'Table 3 pulls from GSTR-1 and Table 4 from your ITC. Compare every number against the 3B sheet in this pack before proceeding.', portalPath: 'Returns Dashboard > GSTR-3B > Prepare New Returns' },
    { n: 7, title: 'Reconcile against GSTR-2B before claiming ITC', detail: 'Only take credit that appears in 2B against a supplier who actually filed. Use the 2B Reconciliation tab; credit taken on unmatched bills is recovered with 18% interest.', portalPath: 'Services > Returns > GSTR-2B' },
    { n: 8, title: 'File with your own signature', detail: 'Preview and RFR, then submit by DSC, EVC (Aadhaar OTP) or OTP on mobile/email. EVC needs no third-party token service.', portalPath: 'GSTR-3B > File with DSC / EVC / OTP' },
    { n: 9, title: 'Save the ARN and the filed PDF', detail: 'Record the 15-character ARN back into AINOS with the challan number so the period is closed and provable.', portalPath: 'Returns > View Filed Returns' },
  );
  return steps;
}

// ── Marketplace seller note ───────────────────────────────────────────────
export interface MarketplaceSource {
  name: string;
  report: string;
  where: string;
  mapsTo: string;
}

/**
 * For a seller whose sales happen on marketplaces, the outward-supply data is
 * not in AINOS yet. These are the reports each marketplace publishes and where
 * each one lands in the return.
 */
export const MARKETPLACE_SOURCES: MarketplaceSource[] = [
  { name: 'Amazon', report: 'Tax Invoice Summary / GST Invoice report', where: 'Seller Central > Reports > Tax Document Library > GST Invoice', mapsTo: 'GSTR-1 B2C (and B2B for the marketplace itself)' },
  { name: 'Amazon', report: 'Commission / Fees tax invoice', where: 'Seller Central > Reports > Tax Document Library > Tax Invoice (Amazon Seller Services)', mapsTo: 'GSTR-3B Table 4 ITC (input tax on fees)' },
  { name: 'Flipkart', report: 'Monthly sales / GST summary', where: 'Seller Portal > Reports > Finance > GST Report', mapsTo: 'GSTR-1 B2C sections' },
  { name: 'Flipkart', report: 'Commission tax invoice', where: 'Seller Portal > Reports > Finance > Tax Invoice', mapsTo: 'GSTR-3B Table 4 ITC' },
  { name: 'Meesho', report: 'Order & settlement GST summary', where: 'Meesho Supplier Portal > Reports > Finance / GST', mapsTo: 'GSTR-1 B2C sections' },
  { name: 'Meesho', report: 'Shipping & commission invoice', where: 'Meesho Supplier Portal > Reports > Tax Invoices', mapsTo: 'GSTR-3B Table 4 ITC' },
];

// ── The whole pack ─────────────────────────────────────────────────────────
export interface FilingPack {
  gstin: string;
  company: string;
  period: string;
  scheme: FilingScheme;
  sellerStateCode: string | null;
  validation: ValidationReport;
  gstr1: PortalGstr1;
  gstr3b: Gstr3bTables;
  due: DueDates;
  fees: FeeExposure;
  checklist: ChecklistStep[];
  summary: {
    invoiceCount: number;
    taxableValue: number;
    outputTax: number;
    itcEligible: number;
    itcUsed: number;
    netTaxPayable: number;
    creditCarriedForward: number;
    isNil: boolean;
  };
  marketplaceSources: MarketplaceSource[];
  generatedAt: string;
}

export function buildFilingPack(input: {
  invoices: ReportInvoice[];
  expenses: Array<{ title: string | null; vendor: string | null; date: Date | string; amount: number; taxAmount: number }>;
  creditNotes: Array<{ noteNumber: string; customerGstNumber?: string | null; total?: number | null; cgstAmount?: number | null; sgstAmount?: number | null; igstAmount?: number | null; createdAt?: Date | null; noteDate?: Date | string | null }>;
  company: { gstin: string; name: string; state?: string | null; gstinStateCode?: string | null };
  period: string;
  startDate?: string | null;
  endDate?: string | null;
  scheme?: FilingScheme;
  taxableTurnoverPriorFy?: number;
  ineligibleItc?: ItcSplit;
  asOf?: Date;
}): FilingPack {
  const scheme = input.scheme ?? 'monthly';
  const sellerStateCode = input.company.gstinStateCode || stateCodeFromGstin(input.company.gstin) || null;

  const validation = validateForFiling(input.invoices, {
    sellerGstin: input.company.gstin, sellerStateCode,
  });

  // A return is filed for one calendar month. A range that straddles two months
  // mixes both periods' invoices while being labelled as one of them, which is
  // how a seller ends up uploading November's sales inside October's GSTR-1.
  // Warn, never block — the numbers themselves are still correct.
  if (input.startDate && input.endDate) {
    const startPeriod = gstPeriod(input.startDate);
    const endPeriod = gstPeriod(input.endDate);
    if (startPeriod !== endPeriod) {
      validation.warnings.unshift({
        severity: 'warning',
        invoiceNumber: `Period ${startPeriod}–${endPeriod}`,
        field: 'period',
        message: 'The selected range spans more than one tax period, so it is not a single month\'s return. Narrow it to one calendar month before uploading.',
      });
    }
  }

  // A credit or debit note belongs to the period it was issued in. Carrying the
  // whole company history into every period would let a November return offset
  // an April filing, so keep only the notes inside the requested window (or the
  // requested month when no window is given).
  const windowStart = input.startDate ? new Date(input.startDate) : null;
  const windowEnd = input.endDate ? new Date(`${input.endDate}T23:59:59`) : null;
  const creditNotes = input.creditNotes.filter((c) => {
    const raw = c.noteDate ?? c.createdAt ?? null;
    const d = raw ? new Date(raw) : null;
    if (!d || Number.isNaN(d.getTime())) return true;   // undated note: surface it, don't drop it
    if (windowStart || windowEnd) {
      if (windowStart && d < windowStart) return false;
      if (windowEnd && d > windowEnd) return false;
      return true;
    }
    return gstPeriod(d) === input.period;
  });

  const gstr1 = buildPortalGstr1(input.invoices, input.company.gstin, input.period, {
    sellerStateCode,
    creditNotes: creditNotes.map((c) => ({ ...c, noteDate: c.noteDate ?? c.createdAt ?? null })),
  });

  // ITC from approved expense tax, assumed intra-state (see note in gstr3b).
  const totalExpenseTax = input.expenses.reduce((s, e) => s + (e.taxAmount || 0), 0);
  const itcRaw: ItcSplit = { igst: 0, cgst: r2(totalExpenseTax / 2), sgst: r2(totalExpenseTax - r2(totalExpenseTax / 2)), cess: 0 };

  const creditNoteTax = creditNotes.reduce((s, c) => s + (c.cgstAmount || 0) + (c.sgstAmount || 0) + (c.igstAmount || 0), 0);
  const creditNoteSplit: ItcSplit = creditNotes.reduce((s, c) => ({
    igst: r2(s.igst + (c.igstAmount || 0)),
    cgst: r2(s.cgst + (c.cgstAmount || 0)),
    sgst: r2(s.sgst + (c.sgstAmount || 0)),
    cess: s.cess,
  }), emptyItc());

  const due = getDueDates(input.period, scheme);
  const gstr1Due = due.returns.find((r) => r.form === 'GSTR-1')?.dueDate ?? due.returns[0]?.dueDate ?? input.period;
  const gstr3bDue = due.returns.find((r) => r.form === 'GSTR-3B')?.dueDate
    ?? due.returns.find((r) => r.form === 'CMP-08')?.dueDate ?? gstr1Due;

  const provisional = buildGstr3bTables(input.invoices, {
    companyGstin: input.company.gstin, period: input.period, itcRaw,
    ineligibleItc: input.ineligibleItc, creditNoteTax, creditNoteSplit,
  });

  const isNil = provisional.summary.outputTax === 0 && provisional.table3.t312.exempt === 0 && input.invoices.length === 0;
  const fees = computeFeeExposure({
    netTaxPayable: provisional.summary.netTaxPayable,
    gstr1Due, gstr3bDue,
    taxableTurnoverPriorFy: input.taxableTurnoverPriorFy ?? 0,
    isNil, asOf: input.asOf,
  });

  const gstr3b = buildGstr3bTables(input.invoices, {
    companyGstin: input.company.gstin, period: input.period, itcRaw,
    ineligibleItc: input.ineligibleItc, creditNoteTax, creditNoteSplit,
    fee: { interest: fees.interestOnNetTax, lateFee: fees.gstr3bLateFee + fees.gstr1LateFee },
  });

  const checklist = buildFilingChecklist({
    gstin: input.company.gstin, period: input.period, scheme,
    netTaxPayable: gstr3b.summary.netTaxPayable,
    hasBlockingIssues: !validation.clean, isNil,
  });

  return {
    gstin: input.company.gstin, company: input.company.name, period: input.period, scheme,
    sellerStateCode, validation, gstr1, gstr3b, due, fees, checklist,
    summary: {
      invoiceCount: input.invoices.length,
      taxableValue: r2(input.invoices.reduce((s, i) => s + (i.totalAmount || 0), 0) - gstr3b.summary.outputTax),
      outputTax: gstr3b.summary.outputTax,
      itcEligible: gstr3b.summary.itcEligible,
      itcUsed: gstr3b.summary.itcUsed,
      netTaxPayable: gstr3b.summary.netTaxPayable,
      creditCarriedForward: gstr3b.summary.creditCarriedForward,
      isNil,
    },
    marketplaceSources: MARKETPLACE_SOURCES,
    generatedAt: new Date().toISOString(),
  };
}
