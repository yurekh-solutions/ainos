// Tally / Excel sheet reading.
//
// A business's old books arrive as whatever its accountant exported: Tally's
// own Excel layout, a header that says "Particulars" instead of "Item", a date
// typed as 15/01/2026, an amount carrying the ₹ symbol and thousand commas, and
// one voucher spread over several lines. The importer therefore normalises
// first and only then computes, so an imported bill goes through exactly the
// same GST rules as a bill typed into AINOS.
import { computeGstSplit, type SupplyType } from './gst';
import { decideSupply } from './supply';
import { validateGstin } from './gstnFiling';
import { buildHeaderLookup, cellText, mapHeaders, type SheetRow } from './sheet';

export type ImportRow = SheetRow;

const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

// ── Column names ─────────────────────────────────────────────────────────────
// Canonical key -> every header spelling we are willing to recognise.
const HEADER_ALIASES: Record<string, string[]> = {
  voucherNumber: ['voucher no', 'voucher number', 'voucher', 'invoice no', 'invoice number', 'inv no', 'bill no', 'bill number', 'document no', 'document number', 'receipt no'],
  date: ['date', 'voucher date', 'invoice date', 'bill date', 'document date', 'delivery date'],
  dueDate: ['due date', 'payment due date', 'due'],
  partyName: ['party name', 'party', 'party name / ledger', 'ledger name', 'ledger', 'customer', 'customer name', 'client name', 'billed to', 'bill to', 'buyer name', 'account name'],
  partyGst: ['party gstin', 'gstin', 'gstin no', 'gstin number', 'gst no', 'gst number', 'buyer gstin', 'customer gstin', 'gst no of buyer'],
  partyState: ['party state', 'state', 'state name', 'buyer state', 'customer state', 'ship to state'],
  placeOfSupply: ['place of supply', 'pos', 'supply state'],
  item: ['item', 'item name', 'product', 'product name', 'description', 'particulars', 'goods name', 'service name', 'material', 'narration'],
  hsn: ['hsn', 'hsn code', 'hsn no', 'hsn/sac', 'hsn sac', 'sac', 'sac code'],
  quantity: ['qty', 'quantity', 'units', 'nos'],
  rate: ['rate', 'price', 'unit price', 'rate per unit', 'basic rate'],
  gstRate: ['gst%', 'gst %', 'gst rate', 'gst % of value', '% of gst value', 'tax rate', 'tax %', 'igst rate', 'igst %', 'cgst rate', 'cgst %', 'sgst rate', 'sgst %', 'gst'],
  // Tally's own "Amount" column is the line's taxable value, not the bill's
  // grand total, so it belongs here and not under declaredTotal.
  taxableValue: ['taxable value', 'assessable value', 'taxable amount', 'taxable', 'basic amount', 'amount', 'line amount', 'line total', 'value'],
  taxAmount: ['tax amount', 'gst amount', 'igst amount', 'cgst amount', 'sgst amount'],
  declaredTotal: ['total', 'grand total', 'total amount', 'invoice value', 'bill amount', 'grand amount'],
  discount: ['discount', 'disc', 'discount amount'],
  paidAmount: ['paid', 'paid amount', 'amount received', 'received'],
  status: ['status', 'invoice status'],
};

// Folding and the first-spelling-wins rule live in ./sheet, because the
// customer import reads headings under the very same rules.
const HEADER_LOOKUP: Map<string, string> = buildHeaderLookup(HEADER_ALIASES);

export type NormalizedRow = Partial<Record<string, unknown>>;

/** Rewrites one sheet row onto canonical keys. Unknown headers are dropped. */
export function normalizeRow(row: ImportRow): NormalizedRow {
  return mapHeaders(row, HEADER_LOOKUP);
}

// ── Values ───────────────────────────────────────────────────────────────────
/** ₹1,23,456.00 / "Rs. 50000" / 50000 -> 50000. Returns null when unreadable. */
export function parseSheetNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[₹]|rs\.?|inr|[, ]/gi, '').replace(/[()]/g, '');
  if (!cleaned || !/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Sheet dates are the single most common reason an import silently fails.
 * Handles real date cells, Excel serial numbers and the Indian hand-typed
 * 15/01/2026, 15-1-2026 and 15-Jan-2026 forms.
 */
export function parseSheetDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  // Excel serial day number (what a date cell becomes without cellDates).
  if (typeof value === 'number' && Number.isFinite(value) && value > 25569 && value < 80000) {
    return new Date(Math.round((value - 25569) * 86400000));
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) return dayFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const dmy = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmy) {
    let a = Number(dmy[1]);
    let b = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    // Day first unless the first part cannot be a day, in which case the
    // sheet was written month-first.
    if (a <= 12 && b > 12) [a, b] = [b, a];
    return dayFromParts(year, b, a);
  }

  const named = raw.match(/^(\d{1,2})[\s-]?([a-z]{3,})[\s-]?(\d{4})$/i) || raw.match(/^([a-z]{3,})[\s-]?(\d{1,2})[\s-]?(\d{4})$/i);
  if (named) {
    const digits = named.slice(1).filter((p) => /^\d+$/.test(p)).map(Number);
    const month = MONTH_NAMES.findIndex((m) => named[0].toLowerCase().includes(m));
    if (month >= 0) return dayFromParts(digits.find((d) => d > 999) ?? NaN, month + 1, digits.find((d) => d <= 31) ?? NaN);
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function dayFromParts(year: number, month: number, day: number): Date | null {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCDate() === day ? d : null;
}

// ── Vouchers ─────────────────────────────────────────────────────────────────
export type ImportItem = {
  name: string;
  hsnCode: string | null;
  quantity: number;
  rate: number;
  gstRate: number;
  taxableValue: number;
  taxAmount: number;
};

export type ImportVoucher = {
  /** 1-based sheet rows that made up this voucher, so errors can name them. */
  rows: number[];
  voucherNumber: string | null;
  date: Date | null;
  dueDate: Date | null;
  dateRaw: unknown;
  partyName: string;
  partyGst: string | null;
  partyState: string | null;
  /** Whatever the sheet said: a 2-digit code or a state name. */
  placeOfSupply: string | null;
  status: string | null;
  discount: number;
  declaredTotal: number | null;
  paidAmount: number | null;
  items: ImportItem[];
};

/**
 * Groups sheet rows into vouchers. Tally writes one line per item and repeats
 * the voucher header on each, so lines sharing a voucher number (or leaving it
 * blank under the same party) become one bill with several items rather than
 * several one-item bills.
 */
export function groupVouchers(rows: NormalizedRow[]): ImportVoucher[] {
  const vouchers: ImportVoucher[] = [];
  let open: ImportVoucher | null = null;

  rows.forEach((row, idx) => {
    const sheetRow = idx + 2; // header sits on row 1
    const number = cellText(row.voucherNumber);
    const party = cellText(row.partyName);
    const item = buildItem(row);

    // Same voucher number, or a line that leaves it blank under the party
    // already open: Tally writes the header once and the items underneath.
    const sameParty = !open || !party || open.partyName.toLowerCase() === party.toLowerCase();
    const reusable = !!open && ((!!number && open.voucherNumber === number) || (!number && sameParty));
    if (reusable && open) {
      if (item) open.items.push(item);
      fillHeader(open, row);
      if (!open.rows.includes(sheetRow)) open.rows.push(sheetRow);
      return;
    }

    const voucher: ImportVoucher = {
      rows: [sheetRow],
      voucherNumber: number,
      date: parseSheetDate(row.date),
      dueDate: parseSheetDate(row.dueDate),
      dateRaw: row.date,
      partyName: party ?? '',
      partyGst: gstin(row.partyGst),
      partyState: cellText(row.partyState),
      placeOfSupply: cellText(row.placeOfSupply),
      status: cellText(row.status),
      discount: parseSheetNumber(row.discount) ?? 0,
      declaredTotal: parseSheetNumber(row.declaredTotal),
      paidAmount: parseSheetNumber(row.paidAmount),
      items: item ? [item] : [],
    };
    vouchers.push(voucher);
    open = voucher;
  });

  return vouchers;
}

function fillHeader(v: ImportVoucher, row: NormalizedRow): void {
  v.date ??= parseSheetDate(row.date);
  v.dueDate ??= parseSheetDate(row.dueDate);
  v.partyGst ??= gstin(row.partyGst);
  v.partyState ??= cellText(row.partyState);
  v.placeOfSupply ??= cellText(row.placeOfSupply);
  v.status ??= cellText(row.status);
  v.discount = v.discount || (parseSheetNumber(row.discount) ?? 0);
  v.declaredTotal = v.declaredTotal ?? parseSheetNumber(row.declaredTotal);
  v.paidAmount = v.paidAmount ?? parseSheetNumber(row.paidAmount);
}

function gstin(value: unknown): string | null {
  const s = cellText(value);
  return s ? s.toUpperCase().replace(/\s+/g, '') : null;
}

/**
 * One line item. Rate x Qty is the taxable value; a sheet that only carries an
 * Amount is read as tax-inclusive and the tax is backed out of it, because
 * treating a tax-inclusive Amount as the taxable base would bill GST on GST.
 */
function buildItem(row: NormalizedRow): ImportItem | null {
  const explicitTaxable = parseSheetNumber(row.taxableValue);
  const rate = parseSheetNumber(row.rate);
  const declared = parseSheetNumber(row.declaredTotal);
  const quantity = parseSheetNumber(row.quantity) ?? 1;
  const qty = quantity > 0 ? quantity : 1;
  const gstRate = clampGstRate(parseSheetNumber(row.gstRate));

  let taxable: number | null = null;
  if (explicitTaxable !== null && explicitTaxable > 0) taxable = explicitTaxable;
  else if (rate !== null && rate > 0) taxable = r2(rate * qty);
  else if (declared !== null && declared > 0) taxable = r2(declared / (1 + gstRate / 100));

  if (taxable === null || taxable <= 0) return null;

  const statedTax = parseSheetNumber(row.taxAmount);
  return {
    name: cellText(row.item) ?? 'Item',
    hsnCode: cellText(row.hsn),
    quantity: qty,
    rate: r2(taxable / qty),
    gstRate,
    taxableValue: taxable,
    taxAmount: statedTax !== null && statedTax >= 0 ? r2(statedTax) : r2((taxable * gstRate) / 100),
  };
}

// GST sits at 0, 0.25, 3, 5, 12, 18 or 28 percent. A sheet cell reading "18%"
// or a blank is normalised here; anything above 100 cannot be a rate.
function clampGstRate(value: number | null): number {
  if (value === null || value < 0) return 0;
  if (value > 100) return 0;
  return value;
}

// ── GST treatment ────────────────────────────────────────────────────────────
export type ImportPricing = {
  subtotal: number;
  taxTotal: number;
  discount: number;
  totalAmount: number;
  cgst: number;
  sgst: number;
  utgst: number;
  igst: number;
  supplyType: SupplyType;
  placeOfSupply: string | null;
  warnings: string[];
};

/**
 * Prices a voucher the way /api/invoices does, so an imported bill and a typed
 * bill land in the same GST heads. The place of supply is read off the buyer's
 * GSTIN first, then the state text on the sheet, by the shared supply rule.
 */
export function priceVoucher(v: ImportVoucher, company: { gstNumber?: string | null; state?: string | null } | null): ImportPricing {
  const warnings: string[] = [];
  const subtotal = r2(v.items.reduce((s, it) => s + it.taxableValue, 0));
  const taxTotal = r2(v.items.reduce((s, it) => s + it.taxAmount, 0));
  const discount = r2(v.discount || 0);

  const buyerVerdict = validateGstin(v.partyGst);
  if (v.partyGst && !buyerVerdict.valid) warnings.push(`GSTIN ${v.partyGst} is not a valid 15-character GSTIN (${buyerVerdict.reason})`);

  // Same rule the invoice form uses: the buyer's GSTIN first, then the state
  // text on the sheet, against the seller's own registration.
  const decision = decideSupply({
    companyGst: company?.gstNumber,
    companyState: company?.state,
    customerGst: v.partyGst,
    customerState: v.partyState ?? v.placeOfSupply,
    placeOfSupply: v.placeOfSupply,
  });
  const supplyType: SupplyType = decision.supplyType;
  const placeOfSupply = decision.posCode;

  // An undecided split falls back to intra. That is a real risk of putting tax
  // in the wrong head, so it is reported instead of being buried.
  if (!decision.decided) warnings.push(decision.note);

  const split = computeGstSplit(taxTotal, 100, {
    supplyType, sellerStateCode: decision.sellerCode, ut: decision.sellerIsUt,
  });

  const totalAmount = r2(subtotal + taxTotal - discount);
  if (v.declaredTotal !== null && v.declaredTotal > 0
    && Math.abs(v.declaredTotal - totalAmount) > 1 && v.declaredTotal >= subtotal) {
    // Only a figure that could plausibly be a grand total is worth flagging:
    // a per-line "Total" is smaller than the bill by design.
    warnings.push(`Sheet total ₹${v.declaredTotal.toLocaleString('en-IN')} does not match ₹${totalAmount.toLocaleString('en-IN')} from the line items; the line items were used`);
  }

  return {
    subtotal, taxTotal, discount,
    totalAmount,
    cgst: split.cgst, sgst: split.sgst, utgst: split.utgst, igst: split.igst,
    supplyType, placeOfSupply, warnings,
  };
}

/** Rows that carry nothing a bill can be built from. */
export function voucherProblem(v: ImportVoucher): string | null {
  if (!v.partyName) return 'Party name is empty';
  if (v.items.length === 0) return 'No item with a rate or taxable value on this line';
  if (v.dateRaw !== undefined && v.dateRaw !== null && String(v.dateRaw).trim() !== '' && !v.date) {
    return `Date "${String(v.dateRaw)}" is not readable`;
  }
  return null;
}
