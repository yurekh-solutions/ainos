import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildEwbRequest, validateEwb, isHardError, getEwbAdapter, requiresEwb,
  computeValidityDays, EWB_THRESHOLD, type ChallanForEwb, type CompanyForEwb,
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
 * POST { challanId, transportMode?, distance?, fromPinCode?, toPinCode?, hazardous? }
 * — validates, generates via the configured adapter (mock until live creds), and
 * persists the result onto the linked Invoice (which carries the ewayBill columns).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const challanId = String(body.challanId || '');
    if (!challanId) return NextResponse.json({ error: 'challanId required' }, { status: 400 });

    const { challan, company } = await loadContext(user.companyId, challanId);
    if (!challan) return NextResponse.json({ error: 'Challan not found' }, { status: 404 });
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const distance = Math.max(1, Number(body.distance) || 1);
    const hazardous = !!body.hazardous;
    const ewbReq = buildEwbRequest(challan, company, {
      transportMode: body.transportMode ? String(body.transportMode) : undefined,
      distance, hazardous,
      fromPinCode: body.fromPinCode ? String(body.fromPinCode) : undefined,
      toPinCode: body.toPinCode ? String(body.toPinCode) : undefined,
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
    });

    const goodsValue = Number(challan.subtotal ?? 0) || Number(challan.totalAmount ?? 0) || 0;
    const errors = validateEwb(ewbReq, goodsValue);
    if (isHardError(errors)) return NextResponse.json({ error: 'Fix the following before generating', errors }, { status: 400 });

    const result = await getEwbAdapter().generate(ewbReq, { distance, hazardous });

    // Persist onto the linked invoice when present (ewayBill columns live there).
    let persistedInvoiceId: string | null = null;
    if (challan.invoiceId) {
      const invoice = await prisma.invoice.findFirst({ where: { id: challan.invoiceId, companyId: user.companyId } });
      if (invoice) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            ewayBillNo: result.ewbNo,
            ewayBillDate: new Date(ewbReq.partA.validFrom),
            ewayBillValid: new Date(result.validityTill),
            vehicleNo: ewbReq.partB.vehicleNumber || invoice.vehicleNo,
            transportDocNo: ewbReq.partB.transportDocNumber || invoice.transportDocNo,
          },
        });
        persistedInvoiceId = invoice.id;
      }
    }

    return NextResponse.json({
      provider: result.provider,
      ewbNo: result.ewbNo,
      validityDays: computeValidityDays(distance, { hazardous }),
      validityTill: result.validityTill,
      qrCode: result.qrCode,
      warnings: errors,
      persistedInvoiceId,
      payload: ewbReq,
    }, { status: 201 });
  } catch (error) {
    console.error('EWB generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate E-Way Bill';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
