import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildGstr1, buildGstr3b, gstPeriod, toCsv, buildHsnSummary,
  type ReportInvoice, type ItcInput,
} from '@/lib/finance/gst';

async function resolveUser(req: NextRequest): Promise<{ id: string; companyId: string } | null> {
  const session = await getServerSession(req);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return null;
  return { id: user.id, companyId: user.companyId };
}

function attachment(kind: string, ext: string): Record<string, string> {
  return { 'Content-Disposition': `attachment; filename="ainos-${kind}.${ext}"` };
}

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'gstr1';
    const exportKind = searchParams.get('export'); // gstr1 | gstr3b | null
    const format = searchParams.get('format') || 'json'; // json | csv
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { gstNumber: true, name: true, state: true },
    });
    const gstin = company?.gstNumber || '';

    const created: Record<string, unknown> = {};
    if (startDate) created.gte = new Date(startDate);
    if (endDate) created.lte = new Date(endDate);
    const where: Record<string, unknown> = { companyId: user.companyId };
    if (Object.keys(created).length) where.createdAt = created;

    const invoices = await prisma.invoice.findMany({
      where: { ...where, status: { in: ['sent', 'paid'] } },
      orderBy: { createdAt: 'asc' },
    });
    const reportInvoices = invoices as unknown as ReportInvoice[];
    const period = gstPeriod(startDate ? new Date(startDate) : new Date());

    // Eligible ITC: approved/reimbursed expense tax. Expenses are treated as
    // intra-state, so ITC splits equally into CGST/SGST.
    const expenses = await prisma.expense.findMany({
      where: { ...where, status: { in: ['approved', 'reimbursed'] } },
      select: { taxAmount: true, amount: true },
    });
    const totalExpenseTax = expenses.reduce((s, e) => s + (e.taxAmount || 0), 0);
    const itc: ItcInput = { igst: 0, cgst: totalExpenseTax / 2, sgst: totalExpenseTax / 2 };

    const creditNotes = await prisma.creditNote.findMany({
      where: { companyId: user.companyId },
      select: { noteNumber: true, customerName: true, total: true, cgstAmount: true, sgstAmount: true, igstAmount: true, createdAt: true },
    });

    // ── Download paths ────────────────────────────────────────────────
    if (exportKind === 'gstr1') {
      const payload = buildGstr1(reportInvoices, gstin, period);
      if (format === 'csv') {
        const rows = reportInvoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          date: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().slice(0, 10) : '',
          customer: inv.customerName || '', gstin: inv.customerGstNumber || '',
          placeOfSupply: inv.placeOfSupply || '', taxableValue: '',
          igst: inv.igstAmount || 0, cgst: inv.cgstAmount || 0, sgst: inv.sgstAmount || 0,
          cess: 0, rate: '', type: inv.supplyType === 'inter' ? 'B2CL/B2C' : 'B2B',
        }));
        return new NextResponse(toCsv(rows), { headers: { 'Content-Type': 'text/csv', ...attachment('gstr1', 'csv') } });
      }
      return NextResponse.json(payload, { headers: attachment('gstr1', 'json') });
    }

    if (exportKind === 'gstr3b') {
      const payload = buildGstr3b(reportInvoices, itc, gstin, period);
      return NextResponse.json(payload, { headers: attachment('gstr3b', 'json') });
    }

    if (exportKind === 'hsn') {
      const hsn = buildHsnSummary(reportInvoices);
      if (format === 'csv') return new NextResponse(toCsv(hsn as unknown as Array<Record<string, unknown>>), { headers: { 'Content-Type': 'text/csv', ...attachment('hsn', 'csv') } });
      return NextResponse.json(hsn, { headers: attachment('hsn', 'json') });
    }

    // ── Inline preview (used by the dashboard page) ───────────────────
    const taxableValue = reportInvoices.reduce(
      (s, inv) => s + (inv.totalAmount || 0) - ((inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0) + (inv.utgstAmount || 0)), 0);
    const outputTax = reportInvoices.reduce((s, inv) => s + (inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0) + (inv.utgstAmount || 0), 0);

    const filings = await prisma.gstFiling.findMany({
      where: { companyId: user.companyId },
      orderBy: { period: 'desc' },
    });

    return NextResponse.json({
      type: type === 'gstr3b' ? 'GSTR-3B' : 'GSTR-1',
      gstin, company: company?.name || '', period,
      invoices: reportInvoices.map((i) => ({
        invoiceNumber: i.invoiceNumber, customerName: i.customerName, customerGstNumber: i.customerGstNumber,
        totalAmount: i.totalAmount, cgstAmount: i.cgstAmount, sgstAmount: i.sgstAmount, igstAmount: i.igstAmount,
        supplyType: i.supplyType,
      })),
      summary: {
        count: reportInvoices.length,
        taxableValue: Math.round(taxableValue * 100) / 100,
        totalTax: Math.round(outputTax * 100) / 100,
        itcEligible: Math.round(totalExpenseTax * 100) / 100,
        netTaxPayable: Math.round(Math.max(0, outputTax - totalExpenseTax) * 100) / 100,
      },
      hsn: buildHsnSummary(reportInvoices),
      creditNotes,
      filings,
    });
  } catch (error) {
    console.error('GST report error:', error);
    return NextResponse.json({ error: 'Failed to generate GST report' }, { status: 500 });
  }
}

// Mark a return as filed (GstFiling tracker). Body: { period, type, status }
export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const period = String(body.period || gstPeriod(new Date()));
    const type = body.type === 'gstr3b' ? 'GSTR3B' : 'GSTR1';
    const status = body.status === 'pending' ? 'pending' : 'filed';

    const filing = await prisma.gstFiling.upsert({
      where: { companyId_period_type: { companyId: user.companyId, period, type } },
      update: { status, filedAt: status === 'filed' ? new Date() : null },
      create: { companyId: user.companyId, period, type, status, filedAt: status === 'filed' ? new Date() : null },
    });
    return NextResponse.json(filing, { status: 201 });
  } catch (error) {
    console.error('GST filing mark error:', error);
    return NextResponse.json({ error: 'Failed to update filing status' }, { status: 500 });
  }
}
