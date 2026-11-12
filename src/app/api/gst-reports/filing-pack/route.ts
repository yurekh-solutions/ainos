import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toCsv, gstPeriod, type ReportInvoice } from '@/lib/finance/gst';
import {
  buildFilingPack, buildSheetRows,
  type FilingScheme, type ItcSplit, type SheetKind,
} from '@/lib/finance/gstnFiling';

async function resolveUser(req: NextRequest): Promise<{ id: string; companyId: string } | null> {
  const session = await getServerSession(req);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return null;
  return { id: user.id, companyId: user.companyId };
}

function attachment(name: string, ext: string): Record<string, string> {
  return { 'Content-Disposition': `attachment; filename="ainos-${name}.${ext}"` };
}

const SHEETS: SheetKind[] = ['b2b', 'b2c', 'hsn', '3b-tables', 'itc', 'issues'];

/**
 * Loads the period's books and assembles the self-filing pack. Read-only:
 * nothing here submits anything to GSTN, it prepares the data and files.
 */
async function loadPack(req: NextRequest) {
  const user = await resolveUser(req);
  if (!user) return { error: 'Unauthorized' as const, status: 401 };

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const scheme = (['monthly', 'qrmp', 'composition'].includes(searchParams.get('scheme') || '')
    ? searchParams.get('scheme') : 'monthly') as FilingScheme;
  const priorTurnover = Number(searchParams.get('priorTurnover') || 0);
  const ineligibleRaw = Number(searchParams.get('ineligibleItc') || 0);

  const created: Record<string, unknown> = {};
  if (startDate) created.gte = new Date(startDate);
  if (endDate) created.lte = new Date(endDate + 'T23:59:59');
  const where: Record<string, unknown> = { companyId: user.companyId };
  if (Object.keys(created).length) where.createdAt = created;

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { gstNumber: true, name: true, state: true, gstinStateCode: true },
  });

  const [invoices, expenses, creditNotes] = await Promise.all([
    prisma.invoice.findMany({
      where: { ...where, status: { in: ['sent', 'paid'] } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.expense.findMany({
      where: { ...where, status: { in: ['approved', 'reimbursed'] } },
      select: { title: true, vendor: true, date: true, amount: true, taxAmount: true },
    }),
    prisma.creditNote.findMany({
      where: { companyId: user.companyId },
      select: {
        noteNumber: true, customerId: true, customerName: true, total: true,
        cgstAmount: true, sgstAmount: true, igstAmount: true, createdAt: true, invoiceId: true,
      },
    }),
  ]);

  // Credit notes need the recipient GSTIN for the CDNR section; resolve it from
  // the customer record (or the original invoice when only invoiceId is linked).
  const customerIds = creditNotes.map((c) => c.customerId).filter((id): id is string => Boolean(id));
  const invoiceIds = creditNotes.map((c) => c.invoiceId).filter((id): id is string => Boolean(id));
  const [customers, linkedInvoices] = await Promise.all([
    customerIds.length
      ? prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, gstNumber: true } })
      : Promise.resolve([]),
    invoiceIds.length
      ? prisma.invoice.findMany({ where: { id: { in: invoiceIds } }, select: { id: true, customerGstNumber: true, placeOfSupply: true } })
      : Promise.resolve([]),
  ]);
  const gstByCustomer = new Map(customers.map((c) => [c.id, c.gstNumber]));
  const gstByInvoice = new Map(linkedInvoices.map((i) => [i.id, i.customerGstNumber]));

  const ineligibleItc: ItcSplit = { igst: 0, cgst: ineligibleRaw / 2, sgst: ineligibleRaw / 2, cess: 0 };

  const pack = buildFilingPack({
    invoices: invoices as unknown as ReportInvoice[],
    expenses,
    creditNotes: creditNotes.map((c) => ({
      noteNumber: c.noteNumber,
      customerGstNumber: (c.customerId ? gstByCustomer.get(c.customerId) : null)
        || (c.invoiceId ? gstByInvoice.get(c.invoiceId) : null)
        || null,
      total: c.total, cgstAmount: c.cgstAmount, sgstAmount: c.sgstAmount, igstAmount: c.igstAmount,
      createdAt: c.createdAt,
    })),
    company: {
      gstin: company?.gstNumber || '',
      name: company?.name || '',
      state: company?.state,
      gstinStateCode: company?.gstinStateCode,
    },
    period: gstPeriod(startDate ? new Date(startDate) : new Date()),
    startDate, endDate, scheme,
    taxableTurnoverPriorFy: priorTurnover,
    ineligibleItc: ineligibleRaw > 0 ? ineligibleItc : undefined,
  });

  return { status: 200, user: user, pack, expenses };
}

export async function GET(req: NextRequest) {
  try {
    const loaded = await loadPack(req);
    if ('error' in loaded) return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    const { pack, expenses } = loaded;

    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download');
    const sheet = searchParams.get('sheet') as SheetKind | null;

    // Individual GSTN-schema GSTR-1 upload file.
    if (download === 'gstr1-json') {
      return NextResponse.json(pack.gstr1, { headers: attachment(`gstr1-${pack.period}`, 'json') });
    }

    // One CSV per section, for manual portal entry or a CA handoff.
    if (download === 'sheet' && sheet && SHEETS.includes(sheet)) {
      const rows = buildSheetRows(sheet, {
        portal: pack.gstr1, tables: pack.gstr3b, expenses, issues: [...pack.validation.blocking, ...pack.validation.warnings],
      });
      return new NextResponse(toCsv(rows), {
        headers: { 'Content-Type': 'text/csv', ...attachment(`gstr-${sheet}-${pack.period}`, 'csv') },
      });
    }

    // Everything in one file so the period can be archived or handed over.
    if (download === 'pack') {
      return NextResponse.json(pack, { headers: attachment(`filing-pack-${pack.period}`, 'json') });
    }

    return NextResponse.json(pack);
  } catch (error) {
    console.error('Filing pack error:', error);
    return NextResponse.json({ error: 'Failed to build the filing pack' }, { status: 500 });
  }
}

/**
 * Close a period after filing it on the portal. Stores the ARN and challan in
 * the existing GstFiling payload, so no schema change is needed.
 * Body: { period, type, arn?, challanNo?, cashPaid?, itcUsed? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const period = String(body.period || gstPeriod(new Date()));
    const type = body.type === 'GSTR3B' || body.type === 'gstr3b' ? 'GSTR3B' : 'GSTR1';
    const arn = body.arn ? String(body.arn).trim().toUpperCase() : null;
    if (arn && !/^[0-9]{15}$/.test(arn)) {
      return NextResponse.json({ error: 'ARN must be the 15-digit acknowledgement number from the portal' }, { status: 400 });
    }

    const meta = {
      arn,
      challanNo: body.challanNo ? String(body.challanNo).trim() : null,
      cashPaid: Number(body.cashPaid) || 0,
      itcUsed: Number(body.itcUsed) || 0,
      recordedAt: new Date().toISOString(),
    };

    const existing = await prisma.gstFiling.findUnique({
      where: { companyId_period_type: { companyId: user.companyId, period, type } },
    });
    const previous = (existing?.payload ?? {}) as Record<string, unknown>;

    const filing = await prisma.gstFiling.upsert({
      where: { companyId_period_type: { companyId: user.companyId, period, type } },
      update: {
        status: arn ? 'filed' : 'pending',
        filedAt: arn ? new Date() : null,
        payload: { ...previous, ...meta },
      },
      create: {
        companyId: user.companyId, period, type,
        status: arn ? 'filed' : 'pending',
        filedAt: arn ? new Date() : null,
        payload: meta,
      },
    });
    return NextResponse.json(filing, { status: 201 });
  } catch (error) {
    console.error('Filing record error:', error);
    return NextResponse.json({ error: 'Failed to record the filing' }, { status: 500 });
  }
}
