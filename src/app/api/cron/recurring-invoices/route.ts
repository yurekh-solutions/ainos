import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all active recurring invoices due today or earlier
    const recurring = await prisma.recurringInvoice.findMany({
      where: {
        status: 'active',
        nextRunDate: { lte: today },
      },
    });

    let generated = 0;
    let errors = 0;

    for (const rec of recurring) {
      try {
        // Check if endDate passed
        if (rec.endDate && rec.endDate < today) {
          await prisma.recurringInvoice.update({
            where: { id: rec.id },
            data: { status: 'completed' },
          });
          continue;
        }

        // Generate sequential invoice number
        const year = today.getFullYear();
        let seq = (await prisma.invoice.count()) + 1;
        let invoiceNumber = `AIN-${String(seq).padStart(4, '0')}-${year}`;
        while (await prisma.invoice.findUnique({ where: { invoiceNumber } })) {
          seq++;
          invoiceNumber = `AIN-${String(seq).padStart(4, '0')}-${year}`;
        }

        // Extract items and compute totals
        const items = (rec.items as unknown as InvoiceItem[]) || [];
        const subtotal = items.reduce((sum: number, it: InvoiceItem) => sum + (it.quantity || 1) * (it.price || 0), 0);
        const taxRate = 18;
        const tax = +(subtotal * 0.18).toFixed(2);
        const total = +(subtotal + tax).toFixed(2);

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            customerName: rec.customerName,
            customerId: rec.customerId,
            items: rec.items ? JSON.parse(JSON.stringify(rec.items)) : undefined,
            subtotal,
            tax,
            taxRate,
            taxTotal: tax,
            total,
            totalAmount: total,
            cgstAmount: +(tax / 2).toFixed(2),
            sgstAmount: +(tax / 2).toFixed(2),
            igstAmount: 0,
            status: 'draft',
            invoiceDate: today,
            dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
            companyId: rec.companyId,
          },
        });

        // Update nextRunDate based on frequency
        const nextDate = new Date(rec.nextRunDate);
        switch (rec.frequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        await prisma.recurringInvoice.update({
          where: { id: rec.id },
          data: {
            nextRunDate: nextDate,
            lastInvoiceId: invoice.id,
          },
        });

        generated++;
      } catch (err) {
        console.error(`[Cron] Recurring invoice ${rec.id} failed:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      generated,
      errors,
      total: recurring.length,
    });
  } catch (err) {
    console.error('[Cron] Recurring invoices error:', err);
    return NextResponse.json({ success: false, error: 'Cron failed' }, { status: 500 });
  }
}
