import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  stateCodeFromGstin, resolveSupplyType, computeGstSplit, computeTds, computeTcs1H,
  UT_STATE_CODES, type SupplyType,
} from '@/lib/finance/gst';
import { postInvoiceIssued, postInvoicePayment, removeSource } from '@/lib/finance/ledger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: Record<string, unknown> = { companyId: user.companyId };
    if (status && status !== 'all') where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    if (!body.customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    // Find or create customer with GST details
    let customer = null;
    if (body.customerEmail) {
      customer = await prisma.customer.findFirst({
        where: { companyId: user.companyId, email: body.customerEmail },
      });
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyId: user.companyId,
          name: body.customerName,
          email: body.customerEmail || null,
          phone: body.customerPhone || null,
          gstNumber: body.customerGst || null,
          panNumber: body.customerPan || null,
          state: body.customerState || null,
          pincode: body.customerPincode || null,
          address: body.customerAddress || null,
        },
      });
    } else {
      // Update customer GST details if provided
      if (body.customerGst || body.customerState) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            gstNumber: body.customerGst || customer.gstNumber,
            panNumber: body.customerPan || customer.panNumber,
            state: body.customerState || customer.state,
            pincode: body.customerPincode || customer.pincode,
          },
        });
      }
    }

    // Company context drives interstate detection and default currency
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { gstNumber: true, state: true, currency: true },
    });
    const billingType = body.billingType || 'gst'; // 'gst', 'non-gst', 'mrp'

    // Process items with per-item GST rates
    const items = body.items.map((item: Record<string, unknown>, idx: number) => {
      const itemRate = Number(item.gstRate ?? 18);
      const qty = Number(item.quantity ?? 1);
      const price = Number(item.price ?? 0);
      const costPrice = Number(item.costPrice ?? 0);
      const itemSubtotal = price * qty;
      const itemTax = itemRate > 0 ? (itemSubtotal * itemRate) / 100 : 0;
      const itemTotal = itemSubtotal + itemTax;
      const profit = (price - costPrice) * qty;

      return {
        productId: item.productId || `item-${idx}`,
        productName: item.productName || item.description || 'Item',
        description: item.description || item.productName || 'Item',
        hsnCode: item.hsnCode || null,
        barcode: item.barcode || null,
        quantity: qty,
        price,
        costPrice,
        gstRate: itemRate,
        taxAmount: itemTax,
        total: itemTotal,
        profit,
      };
    });

    const subtotal = items.reduce((sum: number, item: Record<string, unknown>) =>
      sum + (Number(item.price) * Number(item.quantity)), 0);
    const taxTotal = items.reduce((sum: number, item: Record<string, unknown>) =>
      sum + Number(item.taxAmount), 0);
    const profitAmount = items.reduce((sum: number, item: Record<string, unknown>) =>
      sum + Number(item.profit), 0);

    // Interstate detection: seller state code (from GSTIN) vs place of supply.
    const sellerStateCode = stateCodeFromGstin(company?.gstNumber);
    const placeOfSupplyCode = body.placeOfSupply || stateCodeFromGstin(body.customerGst) || null;
    const supplyType: SupplyType = (body.supplyType as SupplyType)
      || resolveSupplyType(sellerStateCode, placeOfSupplyCode);
    const isUt = supplyType === 'intra' && !!sellerStateCode && UT_STATE_CODES.has(sellerStateCode);

    const split = computeGstSplit(taxTotal, 100, { supplyType, sellerStateCode, ut: isUt });
    const cgstAmount = split.cgst;
    const sgstAmount = split.sgst;
    const igstAmount = split.igst;
    const utgstAmount = split.utgst;

    // Discount calculation
    const discountAmount = Number(body.discountAmount ?? 0);
    const discountType = body.discountType || 'flat'; // 'flat' or 'percent'
    const actualDiscount = discountType === 'percent'
      ? (subtotal * discountAmount) / 100
      : discountAmount;

    const totalAmount = subtotal + taxTotal - actualDiscount;

    // Currency snapshot + optional TDS / TCS (section-driven)
    const currency = body.currency || company?.currency || 'INR';
    const currencyRate = body.currencyRate ? Number(body.currencyRate) : (currency === 'INR' ? 1 : null);
    const tdsSection = body.tdsSection || null;
    const tdsAmount = tdsSection ? computeTds(subtotal, tdsSection, body.tdsRate != null ? Number(body.tdsRate) : null) : 0;
    const tcsSection = body.tcsSection || null;
    const tcsAmount = tcsSection
      ? computeTcs1H(totalAmount, Number(body.priorBuyerReceipts ?? 0), { sellerEligible: !!body.tcsSellerEligible, rate: body.tcsRate != null ? Number(body.tcsRate) : undefined })
      : 0;

    // Payment tracking
    const payments = body.payments || null;
    const paymentMethod = body.paymentMethod || null;
    const paidAmount = Number(body.paidAmount ?? 0);

    // Generate sequential invoice number (collision-safe: invoiceNumber is globally unique)
    const invYear = new Date().getFullYear();
    let invN = (await prisma.invoice.count({ where: { companyId: user.companyId } })) + 1;
    let invoiceNumber = `AIN-${String(invN).padStart(4, '0')}-${invYear}`;
    while (await prisma.invoice.findUnique({ where: { invoiceNumber } })) {
      invN += 1;
      invoiceNumber = `AIN-${String(invN).padStart(4, '0')}-${invYear}`;
    }

    const invoice = await prisma.invoice.create({
      data: {
        companyId: user.companyId,
        customerId: customer.id,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerAddress: body.customerAddress,
        customerGstNumber: body.customerGst,
        customerState: body.customerState,
        customerPan: body.customerPan,
        invoiceNumber,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items,
        subtotal,
        taxTotal,
        totalAmount,
        taxRate: body.gstRate !== undefined ? Number(body.gstRate) : null,
        // GST split
        cgstAmount,
        sgstAmount,
        igstAmount,
        utgstAmount,
        // Compliance add-ons
        currency,
        currencyRate,
        tdsSection,
        tdsAmount,
        tcsSection,
        tcsAmount,
        isExport: body.isExport ? true : null,
        isSez: body.isSez ? true : null,
        billingType,
        supplyType,
        discountAmount: actualDiscount,
        discountType,
        profitAmount,
        // E-Invoice
        einvoiceIrn: body.einvoiceIrn || null,
        einvoiceQr: body.einvoiceQr || null,
        einvoiceAck: body.einvoiceAck || null,
        // E-Way Bill
        ewayBillNo: body.ewayBillNo || null,
        ewayBillDate: body.ewayBillDate ? new Date(body.ewayBillDate) : null,
        ewayBillValid: body.ewayBillValid ? new Date(body.ewayBillValid) : null,
        transportDocNo: body.transportDocNo || null,
        vehicleNo: body.vehicleNo || null,
        // Payment
        paymentMethod,
        payments,
        paidAmount,
        placeOfSupply: body.placeOfSupply || null,
        // Digital Signature
        signatureImage: body.signatureImage || null,
        signatureType: body.signatureType || null,
        signatureDate: body.signatureDate ? new Date(body.signatureDate) : null,
        // Custom dynamic fields
        customFields: body.customFields || null,
        // Status
        status: body.status || 'draft',
        notes: body.notes || null,
        createdBy: user.id,
      },
    });

    // Post to the double-entry ledger (idempotent; drafts simply no-op).
    await postInvoiceIssued(prisma, invoice);
    await postInvoicePayment(prisma, invoice);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Verify invoice belongs to company
    const existing = await prisma.invoice.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data,
    });

    // Reconcile the ledger against the updated document.
    await postInvoiceIssued(prisma, invoice);
    await postInvoicePayment(prisma, invoice);

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    await prisma.invoice.delete({
      where: { id, companyId: user.companyId },
    });

    // Remove any journals posted for this invoice and its payment.
    await removeSource(prisma, 'INVOICE', id);
    await removeSource(prisma, 'INVOICE_PAYMENT', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
