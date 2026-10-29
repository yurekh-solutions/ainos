// E-Way Bill (EWB) generation scaffold for goods movement, sourced from Delivery Challans.
// Builds NICeW-style Part A + Part B payloads, validates the compliance-critical fields,
// computes transport validity per Rule 13B, and abstracts the live gateway behind an
// adapter (deterministic Mock now; env-gated ClearTax for later live wiring).

import { GST_STATE_CODES, stateCodeFromGstin } from './gst';

// Reverse lookup: state name -> GST state code (first 2 digits of a GSTIN).
const STATE_NAME_TO_CODE: Record<string, string> = Object.entries(GST_STATE_CODES)
  .reduce((acc, [code, name]) => { acc[name.toLowerCase()] = code; return acc; }, {} as Record<string, string>);

export const EWB_THRESHOLD = 50_000; // value of goods (excl GST) above which EWB is required

export interface ChallanForEwb {
  id: string;
  challanNumber: string;
  customerName: string;
  customerGst?: string | null;
  customerState?: string | null;
  customerAddress?: string | null;
  items?: unknown;
  subtotal?: number | null;
  totalAmount?: number | null;
  supplyType?: string | null;
  deliveryDate?: Date | string | null;
  vehicleNo?: string | null;
  transportDocNo?: string | null;
  invoiceId?: string | null;
}

export interface CompanyForEwb {
  name: string;
  gstNumber?: string | null;
  state?: string | null;
  gstinStateCode?: string | null;
}

export interface EwbItemDetail {
  subItemNo: string;
  productAsDesc: string;
  hsnCode: string;
  quantity: number;
  baseUnit: string;
  taxableAmountAndRate: { taxableAmount: number; discount: number; gstRate: number; cgstRate: number; sgstRate: number; igstRate: number };
}

export interface EwbPartA {
  userCategory: string;
  transportMode: string; // 1 Road, 2 Rail, 3 Air, 4 Ship, 5 Motorised three wheeler, 10 Exbus
  documentType: string;  // INV / CHL / REF / EXP
  mainDocumentType: string;
  fromType: string;
  toType: string;
  fromCompanyGSTIN: string;
  fromState: string;
  fromPinCode: string;
  toCompanyGSTIN: string;
  toState: string;
  toPinCode: string;
  toTrdPerNote: string;
  deliveryBasewr: string;
  totalValue: number;
  itemDetails: EwbItemDetail[];
  otherDocumentNumber: string;
  otherDocumentDate: string;
  validFrom: string;
}

export interface EwbPartB {
  vehicleNumber: string;
  transportDocNumber: string;
  fromDistrict: string;
  toDistrict: string;
  transReason: string; // 1 Sales, 8 Job work, 10 Others...
}

export interface EwbRequest {
  partA: EwbPartA;
  partB: EwbPartB;
}

// ── Validity (Rule 13B) ──────────────────────────────────────────────────────
export function computeValidityDays(distanceKm: number, opts: { hazardous?: boolean; overDimensional?: boolean } = {}): number {
  if (opts.overDimensional) return 180; // ODC: 6 months
  const d = Math.max(1, Math.ceil(distanceKm));
  if (opts.hazardous) {
    if (d <= 20) return 1;
    if (d <= 1000) return 1 + Math.ceil((d - 20) / 20);
    const upTo1000 = 1 + Math.ceil((1000 - 20) / 20);
    return upTo1000 + Math.ceil((d - 1000) / 40);
  }
  if (d <= 100) return 1;
  if (d <= 1000) return 1 + Math.ceil((d - 100) / 100);
  const upTo1000 = 1 + Math.ceil((1000 - 100) / 100); // = 10
  return upTo1000 + Math.ceil((d - 1000) / 1000);
}

export function computeValidityTill(validFrom: Date, days: number): Date {
  const t = new Date(validFrom.getTime() + days * 24 * 60 * 60 * 1000);
  t.setHours(23, 59, 59, 0);
  return t;
}

// ── Threshold ────────────────────────────────────────────────────────────────
export const requiresEwb = (goodsValue: number): boolean => (goodsValue || 0) > EWB_THRESHOLD;

// ── Field validators (compliance-critical) ───────────────────────────────────
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/i;
const PINCODE_RE = /^\d{6}$/;

export function resolveStateCode(gstin?: string | null, stateName?: string | null, gstinStateCode?: string | null): string {
  const byGstin = stateCodeFromGstin(gstin);
  if (byGstin) return byGstin;
  if (gstinStateCode) return gstinStateCode;
  if (stateName) return STATE_NAME_TO_CODE[stateName.toLowerCase()] || '';
  return '';
}

const itemArr = (c: ChallanForEwb) => (Array.isArray(c.items) ? (c.items as Array<Record<string, unknown>>) : []);

/** Build the Part A + Part B payload from a challan + company, applying optional overrides. */
export function buildEwbRequest(challan: ChallanForEwb, company: CompanyForEwb, input: {
  transportMode?: string; distance?: number; validFrom?: Date; toPinCode?: string; fromPinCode?: string; hazardous?: boolean;
} = {}): EwbRequest {
  const fromCode = resolveStateCode(company.gstNumber, company.state, company.gstinStateCode);
  const toCode = resolveStateCode(challan.customerGst, challan.customerState);
  const goodsValue = Number(challan.subtotal ?? 0) || Number(challan.totalAmount ?? 0) || 0;
  const toGst = (challan.customerGst || '').trim().toUpperCase();
  const isRegistered = GSTIN_RE.test(toGst);
  const validFrom = input.validFrom || (challan.deliveryDate ? new Date(challan.deliveryDate as string) : new Date());

  const itemDetails: EwbItemDetail[] = itemArr(challan).map((it, i) => {
    const qty = Number(it.quantity ?? 1);
    const taxable = Number(it.price ?? 0) * qty;
    const rate = Number(it.gstRate ?? 0);
    return {
      subItemNo: String(i + 1),
      productAsDesc: String(it.description || it.productName || 'Goods').slice(0, 100),
      hsnCode: String(it.hsnCode || '').replace(/\D/g, ''),
      quantity: qty,
      baseUnit: 'PCS',
      taxableAmountAndRate: {
        taxableAmount: taxable, discount: 0, gstRate: rate,
        cgstRate: challan.supplyType === 'inter' ? 0 : rate / 2,
        sgstRate: challan.supplyType === 'inter' ? 0 : rate / 2,
        igstRate: challan.supplyType === 'inter' ? rate : 0,
      },
    };
  });

  const partA: EwbPartA = {
    userCategory: 'GSTR-1 registered',
    transportMode: input.transportMode || '1',
    documentType: 'CHL',
    mainDocumentType: 'CHL',
    fromType: 'GST Registered Person',
    toType: isRegistered ? 'GST Registered Person' : 'Consumer and Others',
    fromCompanyGSTIN: (company.gstNumber || '').toUpperCase(),
    fromState: fromCode,
    fromPinCode: input.fromPinCode || '',
    toCompanyGSTIN: toGst,
    toState: toCode,
    toPinCode: input.toPinCode || '',
    toTrdPerNote: challan.customerName,
    deliveryBasewr: 'N',
    totalValue: goodsValue,
    itemDetails,
    otherDocumentNumber: challan.challanNumber,
    otherDocumentDate: validFrom.toISOString().slice(0, 10),
    validFrom: validFrom.toISOString(),
  };

  const partB: EwbPartB = {
    vehicleNumber: (challan.vehicleNo || '').toUpperCase(),
    transportDocNumber: challan.transportDocNo || '',
    fromDistrict: '',
    toDistrict: '',
    transReason: '1',
  };

  return { partA, partB };
}

/** Validate the compliance-critical Part A fields; returns a list of human-readable errors. */
export function validateEwb(req: EwbRequest, goodsValue: number): string[] {
  const e: string[] = [];
  const a = req.partA;
  if (!GSTIN_RE.test(a.fromCompanyGSTIN)) e.push('Invalid company GSTIN');
  if (a.toCompanyGSTIN && !GSTIN_RE.test(a.toCompanyGSTIN)) e.push('Invalid consignee GSTIN');
  if (!/^\d{2}$/.test(a.fromState) || !GST_STATE_CODES[a.fromState]) e.push('From-state code missing/invalid');
  if (!/^\d{2}$/.test(a.toState) || !GST_STATE_CODES[a.toState]) e.push('To-state code missing/invalid (add customer GSTIN or state)');
  if (a.fromPinCode && !PINCODE_RE.test(a.fromPinCode)) e.push('From pincode must be 6 digits');
  if (a.toPinCode && !PINCODE_RE.test(a.toPinCode)) e.push('To pincode must be 6 digits');
  if (!(a.totalValue > 0)) e.push('Consignment value must be greater than 0');
  if (!a.itemDetails.length) e.push('No line items to move');
  a.itemDetails.forEach((it, i) => {
    if (it.hsnCode && ![4, 6, 8].includes(it.hsnCode.length)) e.push(`Item ${i + 1}: HSN/SAC must be 4, 6 or 8 digits`);
  });
  if (!a.otherDocumentNumber) e.push('Document number is required');
  if (!requiresEwb(goodsValue)) e.push(`EWB not mandatory (value ₹${goodsValue} ≤ ₹${EWB_THRESHOLD}) — allowed but optional`);
  return e;
}

// ── Readiness helper ─────────────────────────────────────────────────────────
// "not mandatory" is a soft note (consignment below threshold); everything else
// is a hard blocker. EWB numbers themselves are only ever REAL — generated on
// the free government NICeW portal and recorded via the PUT endpoint. There is
// deliberately no mock/generator adapter so the product can never emit a fake.
const isHardError = (errs: string[]) => errs.some((x) => !x.includes('not mandatory'));

export { isHardError };
