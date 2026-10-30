// NICV (National Invoice Registration Validation schema) builder.
// Maps an AINOS invoice + company into the government e-invoice JSON
// (v1.03-style) that an IRP / facilitator registration expects. Pure and
// network-free so it is unit-testable and provider-agnostic.

import { stateCodeFromGstin, GST_STATE_CODES } from '../gst';

export interface EinvoiceCompany {
  name: string;
  gstNumber?: string | null;
  gstinStateCode?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface EinvoiceItem {
  productName?: string | null;
  description?: string | null;
  hsnCode?: string | null;
  unit?: string | null;
  quantity?: number | null;
  price?: number | null;
  gstRate?: number | null;
  taxAmount?: number | null;
}

export interface EinvoiceInvoice {
  invoiceNumber: string;
  invoiceDate?: Date | string | null;
  customerName?: string | null;
  customerGstNumber?: string | null;
  customerAddress?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  customerEmail?: string | null;
  placeOfSupply?: string | null;
  supplyType?: string | null;
  items?: unknown;
  subtotal?: number | null;
  taxTotal?: number | null;
  cgstAmount?: number | null;
  sgstAmount?: number | null;
  igstAmount?: number | null;
  utgstAmount?: number | null;
  discountAmount?: number | null;
  totalAmount?: number | null;
  currency?: string | null;
  paymentMethod?: string | null;
  paidAmount?: number | null;
}

export interface NicvPayload {
  Version: string;
  TranDtls: Record<string, unknown>;
  SellerDtls: Record<string, unknown>;
  BuyerDtls: Record<string, unknown>;
  ItemList: Array<Record<string, unknown>>;
  ValDtls: Record<string, unknown>;
  DocDtls: Array<Record<string, unknown>>;
  PayDtls: Array<Record<string, unknown>>;
  TransportDtls: Record<string, unknown>;
  Signature?: string;
}

const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

// DD/MM/YYYY as required by the e-invoice schema.
function fmtDate(d?: Date | string | null): string | null {
  if (!d) return null;
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return null;
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

// Resolve a 2-digit GST state code from an explicit code, a GSTIN, or a state name.
function resolveStateCode(opts: { code?: string | null; gstin?: string | null; stateName?: string | null }): string {
  if (opts.code && /^\d{2}$/.test(opts.code.trim())) return opts.code.trim();
  const fromGstin = stateCodeFromGstin(opts.gstin);
  if (fromGstin) return fromGstin;
  if (opts.stateName) {
    const needle = opts.stateName.trim().toLowerCase();
    const hit = Object.entries(GST_STATE_CODES).find(([, name]) => name.toLowerCase() === needle);
    if (hit) return hit[0];
  }
  return '99'; // Other Territory fallback
}

function splitLineTax(taxAmt: number, supplyType: string | null | undefined): { cgst: number; sgst: number; igst: number; utgst: number } {
  if (supplyType === 'inter') return { cgst: 0, sgst: 0, igst: r2(taxAmt), utgst: 0 };
  const half = r2(taxAmt / 2);
  return { cgst: half, sgst: r2(taxAmt - half), igst: 0, utgst: 0 };
}

/** Build the NICV JSON payload for a single invoice. */
export function buildNicv(invoice: EinvoiceInvoice, company: EinvoiceCompany): NicvPayload {
  const items: EinvoiceItem[] = Array.isArray(invoice.items) ? (invoice.items as EinvoiceItem[]) : [];
  const inter = invoice.supplyType === 'inter';

  const itemList = items.map((it, i) => {
    const taxable = r2(num(it.price) * num(it.quantity));
    const lineTax = num(it.taxAmount) || r2((taxable * num(it.gstRate)) / 100);
    const sp = splitLineTax(lineTax, invoice.supplyType);
    const rate = num(it.gstRate);
    return {
      ItmSeq: i + 1,
      Desc: String(it.description || it.productName || 'Item').slice(0, 1000),
      HSNSCode: String(it.hsnCode || 'NA'),
      Uqc: String(it.unit || 'PCS'),
      Qty: num(it.quantity),
      Rate: num(it.price),
      TaxableAmt: taxable,
      CgstRate: inter ? 0 : r2(rate / 2),
      CgstAmt: sp.cgst,
      SgstRate: inter ? 0 : r2(rate / 2),
      SgstAmt: sp.sgst,
      IgstRate: inter ? rate : 0,
      IgstAmt: sp.igst,
      UtxRate: 0,
      UtxAmt: sp.utgst,
      CessRate: 0,
      CessAmt: 0,
    };
  });

  const taxableAmt = r2(invoice.subtotal ?? items.reduce((s, it) => s + num(it.price) * num(it.quantity), 0));
  const cgst = r2(invoice.cgstAmount ?? 0);
  const sgst = r2(invoice.sgstAmount ?? 0);
  const igst = r2(invoice.igstAmount ?? 0);
  const utgst = r2(invoice.utgstAmount ?? 0);
  const disc = r2(invoice.discountAmount ?? 0);
  const total = r2(invoice.totalAmount ?? taxableAmt + cgst + sgst + igst + utgst - disc);

  const sellerStcd = resolveStateCode({
    code: company.gstinStateCode,
    gstin: company.gstNumber,
    stateName: company.state,
  });
  const buyerStcd = resolveStateCode({
    code: invoice.placeOfSupply,
    gstin: invoice.customerGstNumber,
    stateName: invoice.customerState,
  });

  return {
    Version: 'AINOS_NICV_v1.03',
    TranDtls: {
      TaxSch: 'GST',
      SupTyp: 'R',
      RegClm: 'S',
      DocTyp: 'INV',
      DocNo: invoice.invoiceNumber,
      DocDt: fmtDate(invoice.invoiceDate ?? new Date()),
    },
    SellerDtls: {
      Gstin: company.gstNumber || 'Unregistered',
      LglNm: company.name,
      TrdNm: company.name,
      Addr1: company.address || '-',
      Loc: company.city || company.address || '-',
      Stcd: sellerStcd,
      Ph: company.phone || '',
      Email: company.email || '',
    },
    BuyerDtls: {
      Gstin: invoice.customerGstNumber || 'URP',
      LglNm: invoice.customerName || 'Buyer',
      Addr1: invoice.customerAddress || '-',
      Loc: invoice.customerCity || invoice.customerAddress || '-',
      Stcd: buyerStcd,
      Pos: buyerStcd,
      Email: invoice.customerEmail || '',
    },
    ItemList: itemList,
    ValDtls: {
      RndOffAmt: 0,
      OthChrgAmt: 0,
      DiscAmt: disc,
      TaxableAmt: taxableAmt,
      CgstAmt: cgst,
      SgstAmt: sgst,
      IgstAmt: igst,
      UtxAmt: utgst,
      CessAmt: 0,
      TotInvVal: total,
      TotInvValFc: total,
    },
    DocDtls: [{ Nam: 'NA', No: invoice.invoiceNumber, Dt: fmtDate(invoice.invoiceDate ?? new Date()) || '' }],
    PayDtls: [{ Md: invoice.paymentMethod || 'RECEIPT', Paidamt: r2(invoice.paidAmount ?? 0), CrDays: '', PaymRef: '' }],
    TransportDtls: { Mode: '1', VidCtry: 'IN' },
  };
}
