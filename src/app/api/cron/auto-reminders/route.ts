import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find overdue invoices (due date passed, not paid)
    const overdue = await prisma.invoice.findMany({
      where: {
        status: { not: 'paid' },
        dueDate: { lt: today },
        companyId: { not: null },
      },
    });

    let remindersSent = 0;
    let errors = 0;
    const apiKey = process.env.RESEND_API_KEY;

    for (const inv of overdue) {
      try {
        const daysOverdue = Math.floor((today.getTime() - (inv.dueDate?.getTime() || 0)) / (1000 * 60 * 60 * 24));
        const amount = inv.total || inv.totalAmount || 0;
        const invoiceNumber = inv.invoiceNumber || 'Unknown';
        const customerName = inv.customerName || 'Customer';
        const customerEmail = inv.customerEmail;

        // Send email reminder if Resend configured and customer has email
        if (apiKey && customerEmail && /\S+@\S+\.\S+/.test(customerEmail)) {
          const from = process.env.RESEND_FROM || 'AINOS <onboarding@resend.dev>';
          const subject = `Payment Reminder: Invoice ${invoiceNumber} is ${daysOverdue} days overdue`;
          const html = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
              <h2 style="color:#111827">Payment Reminder</h2>
              <p style="color:#374151">Dear ${customerName},</p>
              <p style="color:#374151">This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> for <strong>₹${amount.toLocaleString('en-IN')}</strong> was due on <strong>${inv.dueDate?.toLocaleDateString('en-IN') || 'N/A'}</strong> and is now <strong>${daysOverdue} days overdue</strong>.</p>
              <p style="color:#374151">Please process the payment at your earliest convenience. If you've already paid, please ignore this reminder.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
              <p style="font-size:12px;color:#9ca3af">Sent via AINOS Business Suite</p>
            </div>
          `;

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to: [customerEmail], subject, html }),
            signal: AbortSignal.timeout(15000),
          });

          if (res.ok) remindersSent++;
          else errors++;
        } else {
          // No email, just count as processed
          remindersSent++;
        }
      } catch (err) {
        console.error(`[Cron] Reminder for invoice ${inv.id} failed:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      errors,
      total: overdue.length,
    });
  } catch (err) {
    console.error('[Cron] Auto-reminders error:', err);
    return NextResponse.json({ success: false, error: 'Cron failed' }, { status: 500 });
  }
}
