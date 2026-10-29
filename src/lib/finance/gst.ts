// Core GST + Indian-compliance logic shared by finance APIs.
// Reference parity with the Free-GST-Billing feature set: state/UT aware
// CGST-SGST-IGST-UTGST split, Place-of-Supply, TDS/TCS (206C(1H) with the
// Rs 50 lakh per-buyer threshold per CBDT Circular 17/2020), multi-currency
// amount-in-words, and GSTN-style GSTR-1 / GSTR-3B report builders.

export type SupplyType = 'intra' | 'inter';

export interface GstSplit {
  cgst: number;
  sgst: number;
  utgst: number;
  igst: number;
  total: number;
}

const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

// ── Indian state / UT codes (first 2 digits of a GSTIN) ──────────────────────
export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Dadra & Nagar Haveli and Daman & Diu', '26': 'Maharashtra', '27': 'Goa',
  '28': 'Chhattisgarh', '29': 'Karnataka', '30': 'Goa', '31': 'Ladakh', '32': 'Kerala',
  '33': 'Tamil Nadu', '34': 'Telangana', '35': 'Andaman & Nicobar Islands', '36': 'Andhra Pradesh',
  '37': 'Sikkim', '38': 'Lakshadweep', '99': 'Other Territory',
};

// Union Territories where intra-supply files as CGST + UTGST (not SGST).
export const UT_STATE_CODES = new Set(['04', '31', '35', '38', '25']);

export function stateCodeFromGstin(gstin?: string | null): string | null {
  if (!gstin) return null;
  const m = gstin.trim().match(/^(\d{2})/);
  return m ? m[1] : null;
}

/** Normalise loose "intra"/"inter" or state-code pairs into a SupplyType. */
export function resolveSupplyType(sellerStateCode?: string | null, placeOfSupplyCode?: string | null): SupplyType {
  if (!sellerStateCode || !placeOfSupplyCode) return 'intra';
  return sellerStateCode === placeOfSupplyCode ? 'intra' : 'inter';
}

/**
 * Split a tax amount into CGST/SGST/UTGST/IGST.
 * - inter-state        -> full IGST
 * - intra-state (state)-> CGST + SGST
 * - intra-state (UT)   -> CGST + UTGST
 */
export function computeGstSplit(taxableValue: number, ratePercent: number, opts: { supplyType: SupplyType; sellerStateCode?: string | null; ut?: boolean } = { supplyType: 'intra' }): GstSplit {
  const total = r2((taxableValue * ratePercent) / 100);
  const isUt = opts.ut ?? (opts.supplyType === 'intra' && !!opts.sellerStateCode && UT_STATE_CODES.has(opts.sellerStateCode));
  if (opts.supplyType === 'inter') {
    return { cgst: 0, sgst: 0, utgst: 0, igst: total, total };
  }
  const half = r2(total / 2);
  if (isUt) return { cgst: half, sgst: 0, utgst: r2(total - half), igst: 0, total };
  return { cgst: half, sgst: r2(total - half), utgst: 0, igst: 0, total };
}

// ── TDS ──────────────────────────────────────────────────────────────────────
export const TDS_SECTIONS: Record<string, number> = {
  '194C': 2, '194J': 10, '194I': 10, '194H': 5, '194Q': 0.1, '194O': 2, '194R': 10, '195': 10,
};

export function computeTds(base: number, section?: string | null, customRate?: number | null): number {
  const rate = customRate ?? (section ? TDS_SECTIONS[section] : undefined);
  if (!rate) return 0;
  return r2((base * rate) / 100);
}

// ── TCS under 206C(1H) ──────────────────────────────────────────────────────
// Eligibility: seller turnover in preceding FY > Rs 10 crore. Collection:
// 0.1% (0.05% for LUT/SEZ) on the receipt (INCLUDING GST) from a buyer that
// exceeds Rs 50 lakh in the current FY. CBDT Circular 17/2020 (receipt basis).
export const TCS_1H_TURNOVER_THRESHOLD = 10_00_00_000; // 10 crore
export const TCS_1H_BUYER_THRESHOLD = 50_00_000; // 50 lakh

export function computeTcs1H(receiptInclGst: number, priorBuyerReceiptsThisFy: number, opts: { sellerEligible: boolean; rate?: number } = { sellerEligible: false }): number {
  if (!opts.sellerEligible) return 0;
  const rate = opts.rate ?? 0.1;
  const prior = priorBuyerReceiptsThisFy;
  const current = receiptInclGst;
  if (prior + current <= TCS_1H_BUYER_THRESHOLD) return 0;
  const chargeableBase = Math.max(0, prior + current - TCS_1H_BUYER_THRESHOLD) - Math.max(0, prior - TCS_1H_BUYER_THRESHOLD);
  return r2((Math.max(0, chargeableBase) * rate) / 100);
}

// ── Multi-currency ───────────────────────────────────────────────────────────
export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ', SGD: 'S$', AUD: 'A$', CAD: 'C$',
  SAR: 'SAR ', MYR: 'RM ', ZAR: 'R ', NGN: '₦ ', KES: 'KSh ', NPR: 'Rs ', BDT: '৳ ',
  LKR: 'Rs ', PKR: 'Rs ', PHP: '₱ ', IDR: 'Rp ', NZD: 'NZ$', QAR: 'QR ', OMR: 'OMR ',
};

export function currencySymbol(code?: string | null): string {
  return CURRENCY_SYMBOLS[(code || 'INR').toUpperCase()] || `${(code || 'INR').toUpperCase()} `;
}

// ── Amount in words ──────────────────────────────────────────────────────────
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigit(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10), o = n % 10;
  return TENS[t] + (o ? ' ' + ONES[o] : '');
}

function internationalWords(n: number): string {
  const chunks: Array<[number, string]> = [[1_000_000_000, 'Billion'], [1_000_000, 'Million'], [1_000, 'Thousand']];
  let rest = Math.floor(n);
  const parts: string[] = [];
  for (const [val, name] of chunks) {
    if (rest >= val) {
      const count = Math.floor(rest / val);
      rest -= count * val;
      parts.push(`${threeDigit(count)} ${name}`);
    }
  }
  if (rest > 0) parts.push(threeDigit(rest));
  return parts.join(' ').trim();
}

function threeDigit(n: number): string {
  const h = Math.floor(n / 100), rem = n % 100;
  const out: string[] = [];
  if (h > 0) out.push(`${ONES[h]} Hundred`);
  if (rem > 0) out.push(twoDigit(rem));
  return out.join(' ');
}

function indianWords(n: number): string {
  const parts: string[] = [];
  const crore = Math.floor(n / 1_00_00_000); n -= crore * 1_00_00_000;
  const lakh = Math.floor(n / 1_00_000); n -= lakh * 1_00_000;
  const thousand = Math.floor(n / 1_000); n -= thousand * 1_000;
  const hundred = Math.floor(n / 100); n %= 100;
  if (crore) parts.push(`${indianWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigit(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigit(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (n) parts.push(twoDigit(n));
  return parts.join(' ').trim();
}

/**
 * Convert a number to words. Indian numbering (Crore/Lakh) for INR-like
 * currencies, international (Million/Thousand) otherwise. Adds the unit name
 * and fractional denomination (Paise/Cents/etc.).
 */
export function amountInWords(amount: number, currency = 'INR'): string {
  const code = currency.toUpperCase();
  const whole = Math.floor(Math.abs(amount));
  const frac = Math.round((Math.abs(amount) - whole) * 100);
  const indian = code === 'INR' || ['NPR', 'PKR', 'BDT', 'LKR'].includes(code);
  const words = indian ? indianWords(whole) : internationalWords(whole);
  const unit = FRACTION_NAMES[code]?.major || '';
  const fracName = FRACTION_NAMES[code]?.minor || '';
  let out = words ? `${words} ${unit}`.trim() : 'Zero';
  if (frac > 0) out += ` and ${indian ? indianWords(frac) : internationalWords(frac)} ${fracName}`.trim();
  out += ' Only';
  return out.replace(/\s+/g, ' ').trim();
}

const FRACTION_NAMES: Record<string, { major: string; minor: string }> = {
  INR: { major: 'Rupees', minor: 'Paise' }, USD: { major: 'Dollars', minor: 'Cents' },
  EUR: { major: 'Euros', minor: 'Cents' }, GBP: { major: 'Pounds', minor: 'Pence' },
  AED: { major: 'Dirhams', minor: 'Fils' }, SGD: { major: 'Dollars', minor: 'Cents' },
  AUD: { major: 'Dollars', minor: 'Cents' }, CAD: { major: 'Dollars', minor: 'Cents' },
  SAR: { major: 'Riyals', minor: 'Halalas' }, MYR: { major: 'Ringgit', minor: 'Sen' },
  ZAR: { major: 'Rand', minor: 'Cents' }, NGN: { major: 'Naira', minor: 'Kobo' },
  KES: { major: 'Shillings', minor: 'Cents' }, NZD: { major: 'Dollars', minor: 'Cents' },
  QAR: { major: 'Riyals', minor: 'Dirhams' }, OMR: { major: 'Rials', minor: 'Baisa' },
};

export function formatMoney(amount: number, currency = 'INR'): string {
  const code = currency.toUpperCase();
  const symbol = currencySymbol(code);
  try {
    return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: code }).format(amount);
  } catch {
    return `${symbol}${amount.toLocaleString(code === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2 })}`;
  }
}

// ── Period key ─────────────────────────────────────────────────────────────
export function gstPeriod(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${mm}${d.getFullYear()}`;
}

// ── GSTR-1 / GSTR-3B builders ────────────────────────────────────────────────
export interface ReportInvoice {
  invoiceNumber: string;
  invoiceDate: Date | string | null;
  customerName: string | null;
  customerGstNumber: string | null;
  customerState: string | null;
  placeOfSupply: string | null;
  totalAmount: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
  igstAmount: number | null;
  utgstAmount: number | null;
  items?: Array<Record<string, unknown>> | null;
  supplyType?: string | null;
  status?: string | null;
}

export interface HsnRow {
  hsn: string;
  description: string;
  uqc: string;
  quantity: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

const numv = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

function itemOf(inv: ReportInvoice) {
  return Array.isArray(inv.items) ? (inv.items as Array<Record<string, unknown>>) : [];
}

/** Aggregate HSN/SAC summary across the invoice set (Table 12 of GSTR-1). */
export function buildHsnSummary(invoices: ReportInvoice[]): HsnRow[] {
  const map = new Map<string, HsnRow>();
  for (const inv of invoices) {
    for (const it of itemOf(inv)) {
      const hsn = String(it.hsnCode ?? it.hsn ?? 'NA');
      const taxable = numv(it.price) * numv(it.quantity);
      const rate = numv(it.gstRate);
      const tax = numv(it.taxAmount ?? (taxable * rate) / 100);
      const inter = inv.supplyType === 'inter' || (!!inv.placeOfSupply && inv.placeOfSupply !== stateCodeFromGstin(null));
      const key = `${hsn}|${inv.supplyType || 'intra'}`;
      const cur = map.get(key) || { hsn, description: String(it.description ?? it.productName ?? ''), uqc: String(it.unit ?? 'PCS'), quantity: 0, taxableValue: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 };
      cur.quantity += numv(it.quantity);
      cur.taxableValue = r2(cur.taxableValue + taxable);
      if (inv.supplyType === 'inter') cur.igst = r2(cur.igst + tax);
      else { cur.cgst = r2(cur.cgst + tax / 2); cur.sgst = r2(cur.sgst + tax / 2); }
      map.set(key, cur);
    }
  }
  return [...map.values()];
}

export interface Gstr1Payload {
  version: string;
  gstin: string;
  fp: string;
  gt: string;
  generatedAt: string;
  count: number;
  invoiceValues: {
    B2B: unknown[];
    B2CL: unknown[];
    B2C: unknown[];
    CDNR: unknown[];
    HSN: HsnRow[];
  };
  totals: { taxableValue: number; igst: number; cgst: number; sgst: number; cess: number };
}

/**
 * Build a GSTR-1 (outward supplies) structure from posted invoices, split into
 * B2B (registered), B2CL (inter-state large > Rs 2.5L) and B2C (aggregated),
 * plus the HSN summary. Mirrors the GSTN offline-tool section model.
 */
export function buildGstr1(invoices: ReportInvoice[], companyGstin: string, period: string): Gstr1Payload {
  const b2b: unknown[] = [];
  const b2cByRate = new Map<string, { rate: number; taxable: number; igst: number; cgst: number; sgst: number; invCount: number }>();
  const b2cl: unknown[] = [];
  let taxableValue = 0, igst = 0, cgst = 0, sgst = 0;

  for (const inv of invoices) {
    const gstin = inv.customerGstNumber?.trim();
    const isB2B = !!gstin && gstin.length === 15;
    const items = itemOf(inv);
    const lineTaxable = items.length
      ? items.reduce((s, it) => s + numv(it.price) * numv(it.quantity), 0)
      : numv(inv.totalAmount) - numv(inv.cgstAmount) - numv(inv.sgstAmount) - numv(inv.igstAmount) - numv(inv.utgstAmount);
    const invCgst = numv(inv.cgstAmount), invSgst = numv(inv.sgstAmount), invIgst = numv(inv.igstAmount);
    const effRate = items.length ? Math.max(0, ...items.map((it) => numv(it.gstRate))) : 0;
    taxableValue += lineTaxable; igst += invIgst; cgst += invCgst; sgst += invSgst;

    if (isB2B) {
      b2b.push({
        ctid: 'B2B', tid: 'R',
        inv: {
          inum: inv.invoiceNumber, idt: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().slice(0, 10) : null,
          val: numv(inv.totalAmount), pos: inv.placeOfSupply || inv.customerState || '', rchgs: gstin,
          rgst: '', rname: inv.customerName || '', eod: null,
          itms: items.map((it, i) => ({
            num: i + 1, hsn: String(it.hsnCode ?? 'NA'), nm: String(it.description ?? it.productName ?? ''),
            uq: String(it.unit ?? 'PCS'), qty: numv(it.quantity), txv: numv(it.price) * numv(it.quantity),
            txp: numv(it.gstRate), igst: inv.supplyType === 'inter' ? numv(it.taxAmount) : 0,
            cgst: inv.supplyType === 'inter' ? 0 : numv(it.taxAmount) / 2,
            sgst: inv.supplyType === 'inter' ? 0 : numv(it.taxAmount) / 2, cess: 0,
          })),
        },
      });
    } else {
      const b2clLarge = inv.supplyType === 'inter' && numv(inv.totalAmount) > 2_50_000;
      if (b2clLarge) {
        b2cl.push({ ctid: 'B2CL', inum: inv.invoiceNumber, idt: inv.invoiceDate, val: numv(inv.totalAmount), pos: inv.placeOfSupply, txp: effRate, igst: invIgst });
      } else {
        const key = `${effRate}|${inv.supplyType === 'inter' ? 'I' : 'S'}`;
        const cur = b2cByRate.get(key) || { rate: effRate, taxable: 0, igst: 0, cgst: 0, sgst: 0, invCount: 0 };
        cur.taxable += lineTaxable; cur.igst += invIgst; cur.cgst += invCgst; cur.sgst += invSgst; cur.invCount += 1;
        b2cByRate.set(key, cur);
      }
    }
  }

  const b2c = [...b2cByRate.entries()].map(([key, v]) => ({
    ctid: 'B2C', sply: key.split('|')[1] === 'I' ? 'INTER' : 'INTRA', txp: v.rate,
    val: r2(v.taxable), igst: r2(v.igst), cgst: r2(v.cgst), sgst: r2(v.sgst), invCount: v.invCount,
  }));

  return {
    version: 'AINOS_GSTR1_EXPORT_v1',
    gstin: companyGstin, fp: period, gt: 'R3.1', generatedAt: new Date().toISOString(),
    count: invoices.length,
    invoiceValues: { B2B: b2b, B2CL: b2cl, B2C: b2c, CDNR: [], HSN: buildHsnSummary(invoices) },
    totals: { taxableValue: r2(taxableValue), igst: r2(igst), cgst: r2(cgst), sgst: r2(sgst), cess: 0 },
  };
}

export interface ItcInput {
  igst: number;
  cgst: number;
  sgst: number;
}

export interface Gstr3BPayload {
  version: string;
  gstin: string;
  fp: string;
  generatedAt: string;
  outward: { taxableValue: number; igst: number; cgst: number; sgst: number };
  itc: ItcInput;
  net: { igst: number; cgst: number; sgst: number; total: number };
}

/**
 * GSTR-3B summary. Net payable = output tax (outward) minus eligible ITC.
 * The previous implementation returned netTax == totalTax (no ITC subtracted);
 * this fixes that.
 */
export function buildGstr3b(invoices: ReportInvoice[], itc: ItcInput, companyGstin: string, period: string): Gstr3BPayload {
  let taxableValue = 0, igst = 0, cgst = 0, sgst = 0;
  for (const inv of invoices) {
    const items = itemOf(inv);
    taxableValue += items.length ? items.reduce((s, it) => s + numv(it.price) * numv(it.quantity), 0) : numv(inv.totalAmount);
    igst += numv(inv.igstAmount); cgst += numv(inv.cgstAmount); sgst += numv(inv.sgstAmount);
  }
  const netIgst = r2(Math.max(0, igst - itc.igst));
  const netCgst = r2(Math.max(0, cgst - itc.cgst));
  const netSgst = r2(Math.max(0, sgst - itc.sgst));
  return {
    version: 'AINOS_GSTR3B_EXPORT_v1', gstin: companyGstin, fp: period, generatedAt: new Date().toISOString(),
    outward: { taxableValue: r2(taxableValue), igst: r2(igst), cgst: r2(cgst), sgst: r2(sgst) },
    itc: { igst: r2(itc.igst), cgst: r2(itc.cgst), sgst: r2(itc.sgst) },
    net: { igst: netIgst, cgst: netCgst, sgst: netSgst, total: r2(netIgst + netCgst + netSgst) },
  };
}

/** Serialise an array of flat row objects to CSV (CA / portal-upload friendly). */
export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}
