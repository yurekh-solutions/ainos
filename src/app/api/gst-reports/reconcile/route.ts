import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { toCsv } from '@/lib/finance/gst';

async function resolveUser(req: NextRequest): Promise<{ id: string; companyId: string } | null> {
  const session = await getServerSession(req);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return null;
  return { id: user.id, companyId: user.companyId };
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);

interface TwoBRecord {
  supplierGstin: string;
  invoiceNo: string;
  date: string | null;
  taxable: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

/** Flatten the GSTN GSTR-2B portal JSON into per-inward-invoice records. */
function parseTwoB(raw: unknown): TwoBRecord[] {
  const out: TwoBRecord[] = [];
  const data = (raw as { data?: { docdata?: { b2b?: unknown[] } } })?.data;
  const b2b = (data?.docdata?.b2b as Array<Record<string, unknown>>) || [];
  for (const supplier of b2b) {
    const gstin = String(supplier.gstin || '');
    const invoices = (supplier.inv as Array<Record<string, unknown>>) || [];
    for (const inv of invoices) {
      const items = (inv.items as Array<Record<string, unknown>>) || [];
      let igst = num(inv.igst), cgst = num(inv.cgst), sgst = num(inv.sgst), cess = num(inv.cess), txv = num(inv.txv);
      // Some 2B files only carry tax at line level; roll it up when missing.
      if (items.length && !(igst || cgst || sgst)) {
        for (const it of items) { igst += num(it.igst); cgst += num(it.cgst); sgst += num(it.sgst); cess += num(it.cess); txv += num(it.txv); }
      }
      out.push({
        supplierGstin: gstin,
        invoiceNo: String(inv.num || ''),
        date: (inv.din as string) || null,
        taxable: r2(txv), igst: r2(igst), cgst: r2(cgst), sgst: r2(sgst), cess: r2(cess),
      });
    }
  }
  return out;
}

/**
 * AINOS "purchase records" = confirmed purchase orders (vendor GSTIN via the
 * Vendor relation) plus approved expense claims that carry tax. Used as the
 * books side of the 2B reconciliation.
 */
async function loadBookRecords(companyId: string) {
  const [pos, expenses] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: { companyId, status: { not: 'draft' } },
      include: { companyRef: false },
    }),
    prisma.expense.findMany({
      where: { companyId, status: { in: ['approved', 'reimbursed'] }, taxAmount: { gt: 0 } },
    }),
  ]);

  const vendors = await prisma.vendor.findMany({ where: { companyId }, select: { id: true, gstNumber: true, name: true } });
  const gstinByVendorId = new Map(vendors.map((v) => [v.id, v.gstNumber || '']));
  const gstinByVendorName = new Map(vendors.filter((v) => v.gstNumber).map((v) => [v.name.toLowerCase(), (v.gstNumber || '').toUpperCase()]));

  const books: TwoBRecord[] = [];
  for (const po of pos) {
    const tax = num(po.tax);
    const total = num(po.total);
    const gstin = (po.vendorId ? gstinByVendorId.get(po.vendorId) : gstinByVendorName.get((po.vendorName || '').toLowerCase())) || '';
    books.push({
      supplierGstin: (gstin || '').toUpperCase(),
      invoiceNo: po.poNumber,
      date: po.orderDate ? new Date(po.orderDate).toISOString().slice(0, 10) : null,
      taxable: r2(total - tax), igst: r2(tax / 2), cgst: r2(tax / 4), sgst: r2(tax / 4), cess: 0,
    });
  }
  for (const ex of expenses) {
    books.push({
      supplierGstin: (gstinByVendorName.get((ex.vendor || '').toLowerCase()) || '').toUpperCase(),
      invoiceNo: ex.title || ex.id.slice(-8),
      date: new Date(ex.date).toISOString().slice(0, 10),
      taxable: r2(ex.amount), igst: r2((ex.taxAmount || 0) / 2), cgst: r2((ex.taxAmount || 0) / 4), sgst: r2((ex.taxAmount || 0) / 4), cess: 0,
    });
  }
  return books;
}

interface ReconRow extends TwoBRecord {
  status: 'matched' | 'amount_mismatch' | 'books_only' | 'twob_only';
  bookTaxable: number | null;
  bookTax: number;
  taxIn2b: number;
}

function reconcile(twob: TwoBRecord[], books: TwoBRecord[]) {
  const rows: ReconRow[] = [];
  const usedBook = new Set<number>();
  const taxOf = (r: TwoBRecord) => r2(r.igst + r.cgst + r.sgst + r.cess);

  for (const t of twob) {
    const idx = books.findIndex((b, i) => !usedBook.has(i) && b.supplierGstin === t.supplierGstin && (b.invoiceNo === t.invoiceNo || Math.abs(b.taxable - t.taxable) < 1));
    const taxIn2b = taxOf(t);
    if (idx === -1) {
      rows.push({ ...t, status: 'twob_only', bookTaxable: null, bookTax: 0, taxIn2b });
    } else {
      usedBook.add(idx);
      const b = books[idx];
      const bookTax = taxOf(b);
      const mismatch = Math.abs(bookTax - taxIn2b) > 1 || Math.abs(b.taxable - t.taxable) > 1;
      rows.push({ ...t, status: mismatch ? 'amount_mismatch' : 'matched', bookTaxable: b.taxable, bookTax, taxIn2b });
    }
  }
  books.forEach((b, i) => {
    if (!usedBook.has(i)) {
      const bookTax = taxOf(b);
      rows.push({ ...b, status: 'books_only', bookTaxable: b.taxable, bookTax, taxIn2b: 0 });
    }
  });
  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const rawJson = body.rawJson ?? body;
    const periodStart = body.periodStart ? new Date(body.periodStart) : new Date();
    const periodEnd = body.periodEnd ? new Date(body.periodEnd) : new Date();

    const twob = parseTwoB(rawJson);
    const books = await loadBookRecords(user.companyId);
    const rows = reconcile(twob, books);

    const summary = {
      matched: rows.filter((r) => r.status === 'matched').length,
      amountMismatch: rows.filter((r) => r.status === 'amount_mismatch').length,
      booksOnly: rows.filter((r) => r.status === 'books_only').length,
      twobOnly: rows.filter((r) => r.status === 'twob_only').length,
      itcAvail: r2(rows.filter((r) => r.status === 'matched').reduce((s, r) => s + r.taxIn2b, 0)),
      itcAtRisk: r2(rows.filter((r) => r.status !== 'matched').reduce((s, r) => s + Math.max(r.taxIn2b, r.bookTax), 0)),
    };

    const stored = await prisma.gstReconImport.create({
      data: { companyId: user.companyId, periodStart, periodEnd, rawJson, resultJson: { summary, rows } as unknown as Prisma.InputJsonValue },
    });

    if (body.format === 'csv') {
      return new NextResponse(toCsv(rows as unknown as Array<Record<string, unknown>>), {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="ainos-gstr2b-recon.csv"' },
      });
    }
    return NextResponse.json({ id: stored.id, summary, rows }, { status: 201 });
  } catch (error) {
    console.error('2B reconcile error:', error);
    return NextResponse.json({ error: 'Failed to reconcile GSTR-2B' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await resolveUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const imports = await prisma.gstReconImport.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, periodStart: true, periodEnd: true, createdAt: true, resultJson: true },
  });
  return NextResponse.json(imports);
}
