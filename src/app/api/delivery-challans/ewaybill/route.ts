import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildEwbRequest, validateEwb, isHardError, requiresEwb,
  EWB_THRESHOLD, type ChallanForEwb, type CompanyForEwb,
} from '@/lib/finance/ewaybill';

async function resolveUser(req: NextRequest): Promise<{ companyId: string } | null> {
  const session = await getServerSession(req);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return null;
  return { companyId: user.companyId };
}

async function loadContext(companyId: string, challanId: string) {
  const [challan, company] = await Promise.all([
    prisma.deliveryChallan.findFirst({ where: { id: challanId, companyId } }),
    prisma.company.findUnique({ where: { id: companyId }, select: { name: true, gstNumber: true, state: true, gstinStateCode: true } }),
  ]);
  return { challan: challan as unknown as ChallanForEwb | null, company: company as unknown as CompanyForEwb | null };
}

/** GET ?challanId= — return the pre-filled EWB payload + compliance readiness (no gateway call). */
export async function GET(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const challanId = new URL(req.url).searchParams.get('challanId') || '';
    if (!challanId) return NextResponse.json({ error: 'challanId required' }, { status: 400 });

    const { challan, company } = await loadContext(user.companyId, challanId);
    if (!challan) return NextResponse.json({ error: 'Challan not found' }, { status: 404 });
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const ewbReq = buildEwbRequest(challan, company);
    const goodsValue = Number(challan.subtotal ?? 0) || Number(challan.totalAmount ?? 0) || 0;
    const errors = validateEwb(ewbReq, goodsValue);

    return NextResponse.json({
      challan: { id: challan.id, number: challan.challanNumber, customerName: challan.customerName, goodsValue, invoiceId: challan.invoiceId },
      requiresEwb: requiresEwb(goodsValue),
      threshold: EWB_THRESHOLD,
      ready: !isHardError(errors),
      errors,
      payload: ewbReq,
    });
  } catch (error) {
    console.error('EWB preview error:', error);
    return NextResponse.json({ error: 'Failed to build E-Way Bill preview' }, { status: 500 });
  }
}

/**
 * PUT { challanId, ewbNo, validTill?, vehicleNo?, transportDocNo? }
 * — records a REAL E-Way Bill number that the user generated on the free
 * NICeW portal (ewaybill gst.gov.in). No gateway call, no cost. Persists onto
 * the linked Invoice's ewayBill columns (no DB migration needed).
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const challanId = String(body.challanId || '');
    const ewbNo = String(body.ewbNo || '').replace(/\s/g, '');
    if (!challanId) return NextResponse.json({ error: 'challanId required' }, { status: 400 });
    if (!/^\d{12}$/.test(ewbNo)) {
      return NextResponse.json({ error: 'E-Way Bill number must be exactly 12 digits' }, { status: 400 });
    }

    const challan = await prisma.deliveryChallan.findFirst({ where: { id: challanId, companyId: user.companyId } });
    if (!challan) return NextResponse.json({ error: 'Challan not found' }, { status: 404 });

    const validTill = body.validTill ? new Date(body.validTill) : null;
    if (validTill && isNaN(validTill.getTime())) {
      return NextResponse.json({ error: 'Invalid valid-till date' }, { status: 400 });
    }

    // Persist onto the linked invoice (eway columns live there). No invoice => record-only.
    let persistedInvoiceId: string | null = null;
    if (challan.invoiceId) {
      const invoice = await prisma.invoice.findFirst({ where: { id: challan.invoiceId, companyId: user.companyId } });
      if (invoice) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            ewayBillNo: ewbNo,
            ewayBillDate: new Date(),
            ...(validTill ? { ewayBillValid: validTill } : {}),
            ...(body.vehicleNo ? { vehicleNo: String(body.vehicleNo).toUpperCase() } : {}),
            ...(body.transportDocNo ? { transportDocNo: String(body.transportDocNo) } : {}),
          },
        });
        persistedInvoiceId = invoice.id;
      }
    }

    return NextResponse.json({
      recorded: true,
      ewbNo,
      validTill: validTill ? validTill.toISOString() : null,
      persistedInvoiceId,
      message: persistedInvoiceId
        ? 'E-Way Bill stored on the linked invoice.'
        : 'Recorded, but no linked invoice to store it on — link an invoice to persist.',
    });
  } catch (error) {
    console.error('EWB record error:', error);
    return NextResponse.json({ error: 'Failed to record E-Way Bill' }, { status: 500 });
  }
}
