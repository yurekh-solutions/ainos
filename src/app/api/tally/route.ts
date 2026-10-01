import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
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

// Tally/Excel import — accepts JSON data from Excel and creates invoices
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
    const { vouchers } = body;

    if (!vouchers || !Array.isArray(vouchers) || vouchers.length === 0) {
      return NextResponse.json({ error: 'No vouchers to import' }, { status: 400 });
    }

    const created: string[] = [];
    const errors: string[] = [];

    // Fetch company for state comparison
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
    });

    for (let i = 0; i < vouchers.length; i++) {
      try {
        const v = vouchers[i];

        // Find or create customer
        let customer = null;
        if (v.partyName) {
          customer = await prisma.customer.findFirst({
            where: { companyId: user.companyId, name: v.partyName },
          });
          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                companyId: user.companyId,
                name: v.partyName,
                gstNumber: v.partyGst || null,
                state: v.partyState || null,
              },
            });
          }
        }

        const items = (v.items || []).map((item: Record<string, unknown>, idx: number) => ({
          productId: `import-${i}-${idx}`,
          productName: item.name || 'Item',
          description: item.name || 'Item',
          hsnCode: item.hsnCode || null,
          quantity: Number(item.quantity) || 1,
          price: Number(item.rate) || 0,
          gstRate: Number(item.gstRate) || 18,
          taxAmount: ((Number(item.rate) || 0) * (Number(item.quantity) || 1) * (Number(item.gstRate) || 18)) / 100,
          total: (Number(item.rate) || 0) * (Number(item.quantity) || 1),
          profit: 0,
        }));

        const subtotal = items.reduce((s: number, it: Record<string, unknown>) =>
          s + (Number(it.price) * Number(it.quantity)), 0);
        const taxTotal = items.reduce((s: number, it: Record<string, unknown>) =>
          s + Number(it.taxAmount), 0);

        const supplyType = v.partyState && company?.address
          ? (v.partyState.toLowerCase() === company.address.toLowerCase() ? 'intra' : 'inter')
          : 'intra';

        const count = await prisma.invoice.count({ where: { companyId: user.companyId } });
        const invoiceNumber = v.voucherNumber || `IMP-${String(count + 1).padStart(4, '0')}`;

        await prisma.invoice.create({
          data: {
            companyId: user.companyId,
            customerId: customer?.id || null,
            customerName: v.partyName || 'Imported Customer',
            customerGstNumber: v.partyGst || null,
            customerState: v.partyState || null,
            invoiceNumber,
            invoiceDate: v.date ? new Date(v.date) : new Date(),
            items,
            subtotal,
            taxTotal,
            totalAmount: v.grandTotal || (subtotal + taxTotal),
            cgstAmount: supplyType === 'intra' ? taxTotal / 2 : 0,
            sgstAmount: supplyType === 'intra' ? taxTotal / 2 : 0,
            igstAmount: supplyType === 'inter' ? taxTotal : 0,
            supplyType,
            status: v.status || 'draft',
            createdBy: user.id,
          },
        });

        created.push(invoiceNumber);
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      errors: errors.length,
      createdInvoices: created,
      errorDetails: errors,
    });
  } catch (error) {
    console.error('Error importing tally data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
