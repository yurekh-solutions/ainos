import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { postInvoiceIssued, postInvoicePayment } from '@/lib/finance/ledger';
import { recordAudit } from '@/lib/audit';
import {
  normalizeRow, groupVouchers, priceVoucher, voucherProblem,
  type ImportRow, type ImportVoucher,
} from '@/lib/finance/tallyImport';

// Tally/Excel export — returns invoice data in Tally-compatible format
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: Record<string, unknown> = { companyId: user.companyId };
    // Filter on the bill's own date, not on the moment the row was written:
    // an imported 2023 voucher must still show up when she picks FY 2023-24.
    if (from || to) {
      const range: Record<string, unknown> = {};
      if (from) range.gte = new Date(from);
      if (to) range.lte = new Date(`${to}T23:59:59.999Z`);
      where.OR = [{ invoiceDate: range }, { invoiceDate: null, createdAt: range }];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: 'asc' },
    });

    // Get company details for Tally export
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
    });

    // Format for Tally-compatible XML/Excel
    const tallyData = invoices.map(inv => {
      const items = (inv.items as Record<string, unknown>[]) || [];
      return {
        voucherType: 'Sales',
        voucherNumber: inv.invoiceNumber,
        date: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
        partyName: inv.customerName || '',
        partyGst: inv.customerGstNumber || '',
        partyState: inv.customerState || '',
        items: items.map(item => ({
          name: item.productName || 'Item',
          hsnCode: item.hsnCode || '',
          quantity: item.quantity || 0,
          rate: item.price || 0,
          gstRate: item.gstRate || 18,
          amount: (Number(item.price) || 0) * (Number(item.quantity) || 0),
        })),
        subtotal: inv.subtotal || 0,
        cgst: inv.cgstAmount || 0,
        sgst: inv.sgstAmount || 0,
        igst: inv.igstAmount || 0,
        totalTax: inv.taxTotal || 0,
        discount: inv.discountAmount || 0,
        grandTotal: inv.totalAmount || 0,
        status: inv.status || 'draft',
      };
    });

    return NextResponse.json({
      company: {
        name: company?.name || '',
        gstNumber: company?.gstNumber || '',
        address: company?.address || '',
      },
      vouchers: tallyData,
      totalVouchers: tallyData.length,
    });
  } catch (error) {
    console.error('Error exporting tally data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Tally/Excel import. The client hands over the raw sheet rows; everything
// after that (loose headers, dates, one voucher across many lines, GST heads)
// is decided by the shared importer so an imported bill is indistinguishable
// from a typed one.
const STATUS_WORDS: Record<string, string> = {
  draft: 'draft', '': 'sent', sent: 'sent', issued: 'sent', final: 'sent', unpaid: 'sent', overdue: 'sent',
  partial: 'partially_paid', 'partially paid': 'partially_paid', 'part-paid': 'partially_paid',
  paid: 'paid', settled: 'paid', cleared: 'paid', cancelled: 'cancelled', void: 'cancelled',
};

/** The shape the old client posted: vouchers with nested items. Flattened back
 *  onto sheet rows so there is only one import pipeline to keep correct. */
function vouchersToRows(vouchers: Record<string, unknown>[]): ImportRow[] {
  const rows: ImportRow[] = [];
  for (const v of vouchers) {
    const items = Array.isArray(v.items) ? v.items as Record<string, unknown>[] : [{}];
    for (const item of items) {
      rows.push({
        'Voucher No': v.voucherNumber, 'Date': v.date, 'Party Name': v.partyName,
        'Party GSTIN': v.partyGst, 'Party State': v.partyState, 'Status': v.status,
        'Discount': v.discount, 'Paid Amount': v.paidAmount,
        'Item': item.name, 'HSN': item.hsnCode, 'Qty': item.quantity,
        'Rate': item.rate, 'GST%': item.gstRate, 'Total Amount': v.grandTotal,
      } as ImportRow);
    }
  }
  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await req.json();
    const incoming: unknown[] = Array.isArray(body.rows) ? body.rows
      : Array.isArray(body.vouchers) ? vouchersToRows(body.vouchers as Record<string, unknown>[])
        : [];

    if (incoming.length === 0) {
      return NextResponse.json({
        error: 'Nothing to import. The first sheet row needs column headings like "Party Name", "Date", "Item", "Qty", "Rate", "GST%".',
      }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    const vouchers = groupVouchers(incoming.map((row) => normalizeRow(row as ImportRow)));
    if (vouchers.length === 0) {
      return NextResponse.json({ error: 'No voucher rows found in the sheet.' }, { status: 400 });
    }

    const created: Record<string, unknown>[] = [];
    const skipped: Record<string, unknown>[] = [];
    const failed: Record<string, unknown>[] = [];

    for (const v of vouchers) {
      const rowLabel = v.rows.length > 1 ? `Rows ${v.rows.join(', ')}` : `Row ${v.rows[0]}`;

      const problem = voucherProblem(v);
      if (problem) {
        failed.push({ rows: v.rows, reason: `${rowLabel}: ${problem}` });
        continue;
      }

      // Uploading the same file twice must not double the books.
      if (v.voucherNumber) {
        const already = await prisma.invoice.findFirst({
          where: { companyId: user.companyId, invoiceNumber: v.voucherNumber },
        });
        if (already) {
          skipped.push({ rows: v.rows, invoiceNumber: already.invoiceNumber, reason: `${already.invoiceNumber} is already in AINOS` });
          continue;
        }
      }

      const pricing = priceVoucher(v, company);

      // Keep the accountant's voucher number when there is one, otherwise
      // generate a collision-free IMP number (invoiceNumber is unique).
      let invoiceNumber = v.voucherNumber as string;
      if (!invoiceNumber) {
        let n = (await prisma.invoice.count({ where: { companyId: user.companyId } })) + 1;
        invoiceNumber = `IMP-${String(n).padStart(4, '0')}`;
        while (await prisma.invoice.findUnique({ where: { invoiceNumber } })) {
          n += 1;
          invoiceNumber = `IMP-${String(n).padStart(4, '0')}`;
        }
      }

      // Same party, different spelling: match on GSTIN first, then on name.
      let customer = v.partyGst
        ? await prisma.customer.findFirst({ where: { companyId: user.companyId, gstNumber: v.partyGst } })
        : null;
      if (!customer && v.partyName) {
        customer = await prisma.customer.findFirst({
          where: { companyId: user.companyId, name: { equals: v.partyName, mode: 'insensitive' } },
        });
      }
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            companyId: user.companyId, name: v.partyName,
            gstNumber: v.partyGst, state: v.partyState,
          },
        });
      }

      const items = v.items.map((it, idx) => ({
        productId: `import-${v.rows[0]}-${idx}`,
        productName: it.name,
        description: it.name,
        hsnCode: it.hsnCode,
        quantity: it.quantity,
        price: it.rate,
        costPrice: 0,
        gstRate: it.gstRate,
        taxAmount: it.taxAmount,
        total: it.taxableValue + it.taxAmount,
        profit: 0,
      }));

      const paidAmount = v.paidAmount ?? 0;
      const status = resolveStatus(v, pricing.totalAmount, paidAmount);
      const invoiceDate = v.date ?? new Date();

      const invoice = await prisma.invoice.create({
        data: {
          companyId: user.companyId,
          customerId: customer.id,
          customerName: v.partyName,
          customerGstNumber: v.partyGst,
          customerState: v.partyState,
          placeOfSupply: pricing.placeOfSupply,
          invoiceNumber,
          invoiceDate,
          dueDate: v.dueDate ?? new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          items,
          subtotal: pricing.subtotal,
          taxTotal: pricing.taxTotal,
          totalAmount: pricing.totalAmount,
          cgstAmount: pricing.cgst,
          sgstAmount: pricing.sgst,
          utgstAmount: pricing.utgst,
          igstAmount: pricing.igst,
          supplyType: pricing.supplyType,
          discountAmount: pricing.discount,
          discountType: 'flat',
          profitAmount: 0,
          currency: company?.currency || 'INR',
          status,
          paidAmount: status === 'draft' ? 0 : paidAmount,
          createdBy: user.id,
        },
      });

      // An imported bill belongs in the books, not just in the list.
      await postInvoiceIssued(prisma, invoice);
      await postInvoicePayment(prisma, invoice);

      await recordAudit({
        companyId: user.companyId,
        entity: 'invoice',
        entityId: invoice.id,
        action: 'imported',
        actor: { id: user.id, email: session.user.email },
        summary: `${invoiceNumber} imported from ${String(body.source ?? 'Excel/Tally sheet')}`,
        changes: {
          customerName: invoice.customerName,
          totalAmount: invoice.totalAmount,
          supplyType: pricing.supplyType,
          sheetRows: v.rows,
        },
      });

      created.push({
        rows: v.rows, invoiceNumber, partyName: v.partyName,
        totalAmount: pricing.totalAmount, supplyType: pricing.supplyType,
        warnings: pricing.warnings,
      });
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      skipped: skipped.length,
      failed: failed.length,
      createdInvoices: created.map((c) => c.invoiceNumber),
      details: created,
      skippedDetails: skipped,
      errorDetails: failed,
    });
  } catch (error) {
    console.error('Error importing tally data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** A Status column decides whether the bill sits in receivables. With no column
 *  an imported bill counts as issued, because a bill that never left the books
 *  would be invisible in Pending Payments and in the GST reports. */
function resolveStatus(v: ImportVoucher, totalAmount: number, paidAmount: number): string {
  const stated = (v.status ?? '').trim().toLowerCase();
  if (stated && STATUS_WORDS[stated] !== undefined) return STATUS_WORDS[stated];
  if (paidAmount > 0 && paidAmount >= totalAmount) return 'paid';
  if (paidAmount > 0) return 'partially_paid';
  return 'sent';
}
