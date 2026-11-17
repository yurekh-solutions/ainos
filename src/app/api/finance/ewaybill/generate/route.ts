import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildEwbRequest, validateEwb, isHardError, type ChallanForEwb, type CompanyForEwb } from '@/lib/finance/ewaybill';
import { authenticateEwb, generateEwb, type EwbGenerateInput } from '@/lib/finance/ewaybillApi';

// REAL e-way bill generation straight through the government NIC API, using the
// tenant's own portal credentials (Government portals page). No mock exists —
// if credentials are missing or the portal rejects, this endpoint says so and
// the Portal Assist (worksheet + ewaybill.gst.gov.in) flow stays the fallback.

const ddmm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const challanId = String(body.challanId || '');
    if (!challanId) return NextResponse.json({ error: 'challanId is required' }, { status: 400 });

    const challan = await prisma.deliveryChallan.findFirst({
      where: { id: challanId, companyId: user.companyId },
    });
    if (!challan) return NextResponse.json({ error: 'Challan not found' }, { status: 404 });

    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    // Reuse the same compliance validation as Portal Assist.
    const challanView: ChallanForEwb = challan;
    const companyView: CompanyForEwb = { name: company.name, gstNumber: company.gstNumber, state: company.state };
    const ewbReq = buildEwbRequest(challanView, companyView, {
      transportMode: body.transportMode ? String(body.transportMode) : '1',
      distance: Number(body.distance ?? 0),
      fromPinCode: body.fromPincode ? String(body.fromPincode) : undefined,
      toPinCode: body.toPincode ? String(body.toPincode) : undefined,
      hazardous: Boolean(body.hazardous),
    });
    const goodsValue = Number(challan.subtotal ?? 0) || Number(challan.totalAmount ?? 0) || 0;
    const errors = validateEwb(ewbReq, goodsValue);
    if (isHardError(errors)) return NextResponse.json({ error: 'Cannot generate yet', details: errors }, { status: 400 });
    if (!ewbReq.partA.fromPinCode || !ewbReq.partA.toPinCode) {
      return NextResponse.json({ error: 'Both from and to pincodes are required for direct generation' }, { status: 400 });
    }

    const creds = await prisma.govPortalCredential.findFirst({
      where: { companyId: user.companyId, portal: 'EWB', gstin: (company.gstNumber || '').toUpperCase() },
      orderBy: { updatedAt: 'desc' },
    });
    if (!creds) {
      return NextResponse.json({
        error: 'E-Way Bill API is not set up for this GSTIN yet',
        hint: 'Open Government portals, add the E-Way Bill credentials from the taxpayer portal registration, or use Portal Assist.',
      }, { status: 400 });
    }

    const gstSession = await authenticateEwb({
      gstin: creds.gstin, username: creds.username, password: creds.password,
      clientId: creds.clientId || '', clientSecret: creds.clientSecret || '',
    });

    // Map the validated Part A/B into the NIC payload (taxes computed from items).
    const taxOf = (which: 'cgst' | 'sgst' | 'igst') =>
      ewbReq.partA.itemDetails.reduce((s, it) => s + (it.taxableAmountAndRate.taxableAmount * it.taxableAmountAndRate[`${which}Rate`]) / 100, 0);
    const cgst = Math.round(taxOf('cgst') * 100) / 100;
    const sgst = Math.round(taxOf('sgst') * 100) / 100;
    const igst = Math.round(taxOf('igst') * 100) / 100;
    const docDate = ddmm(new Date(ewbReq.partA.validFrom || Date.now()));

    const payload: EwbGenerateInput = {
      supplyType: 'O',
      subSupplyType: '1',
      docType: 'CHL',
      docNo: ewbReq.partA.otherDocumentNumber,
      docDate,
      fromGstin: ewbReq.partA.fromCompanyGSTIN,
      fromTrdName: company.name.slice(0, 25),
      fromAddr1: (body.fromAddress || company.name).slice(0, 255),
      fromPlace: (body.fromPlace || company.state || '').slice(0, 50),
      fromPincode: Number(ewbReq.partA.fromPinCode),
      fromStateCode: Number(ewbReq.partA.fromState),
      actFromStateCode: Number(ewbReq.partA.fromState),
      toGstin: ewbReq.partA.toCompanyGSTIN || 'URP',
      toTrdName: challan.customerName.slice(0, 25),
      toAddr1: (challan.customerAddress || challan.customerName).slice(0, 255),
      toPlace: (body.toPlace || challan.customerState || '').slice(0, 50),
      toPincode: Number(ewbReq.partA.toPinCode),
      toStateCode: Number(ewbReq.partA.toState),
      actToStateCode: Number(ewbReq.partA.toState),
      totalValue: goodsValue,
      cgstValue: cgst,
      sgstValue: sgst,
      igstValue: igst,
      totInvValue: Math.round((goodsValue + cgst + sgst + igst) * 100) / 100,
      transMode: body.transportMode === '2' || body.transportMode === '3' || body.transportMode === '4' ? body.transportMode : '1',
      transDistance: String(Math.max(1, Math.ceil(Number(body.distance ?? 1)))),
      transporterId: body.transporterId || undefined,
      transporterName: body.transporterName || undefined,
      transDocNo: ewbReq.partB.transportDocNumber || undefined,
      vehicleNo: ewbReq.partB.vehicleNumber || undefined,
      vehicleType: 'R',
      itemList: ewbReq.partA.itemDetails.map((it) => ({
        productName: it.productAsDesc.slice(0, 100),
        productDesc: it.productAsDesc.slice(0, 100),
        hsnCode: Number(it.hsnCode) || undefined,
        quantity: it.quantity,
        qtyUnit: it.baseUnit,
        taxableAmount: it.taxableAmountAndRate.taxableAmount,
        cgstRate: it.taxableAmountAndRate.cgstRate,
        sgstRate: it.taxableAmountAndRate.sgstRate,
        igstRate: it.taxableAmountAndRate.igstRate,
        cessRate: 0,
      })),
    };

    const generated = await generateEwb(
      { gstin: creds.gstin, username: creds.username, password: creds.password, clientId: creds.clientId || '', clientSecret: creds.clientSecret || '' },
      gstSession,
      payload,
    );

    // Persist the REAL number on the linked invoice only (challans carry no EWB columns).
    let linked = false;
    if (challan.invoiceId) {
      await prisma.invoice.update({
        where: { id: challan.invoiceId },
        data: {
          ewayBillNo: generated.ewayBillNo,
          ewayBillDate: generated.ewayBillDate ? new Date(generated.ewayBillDate.split('/').reverse().join('-')) : new Date(),
          ewayBillValid: generated.validUpto ? new Date(generated.validUpto.split('/').reverse().join('-')) : null,
        },
      });
      linked = true;
    }
    await prisma.govPortalCredential.update({ where: { id: creds.id }, data: { verified: true, lastTestedAt: new Date(), lastTestStatus: 'ok' } });

    return NextResponse.json({ generated, linkedInvoice: linked });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'E-Way Bill generation failed';
    return NextResponse.json({ error: message, hint: 'You can always use Portal Assist to generate on ewaybill.gst.gov.in by hand.' }, { status: 502 });
  }
}
