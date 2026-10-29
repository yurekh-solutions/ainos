import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// Auto payment-chase: finds overdue, still-unpaid invoices and emails a polite
// reminder to each customer. Defaults to a dry run so nothing sends until the
// user explicitly confirms. Records an Automation so the action is visible.

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });
    const companyId = user.companyId;

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false; // safe default

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, email: true },
    });

    const now = new Date();
    const overdue = await prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ['sent', 'overdue'] },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: 'asc' },
    });

    const targets = overdue
      .map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        customerEmail: inv.customerEmail,
        dueDate: inv.dueDate,
        outstanding: round2((inv.totalAmount || 0) - (inv.paidAmount || 0)),
      }))
      .filter(t => t.outstanding > 0 && t.customerEmail);

    const sent: { invoiceNumber: string; email: string }[] = [];
    const failed: { invoiceNumber: string; email: string; error: string }[] = [];

    if (!dryRun) {
      for (const t of targets) {
        const daysLate = Math.max(1, Math.ceil((now.getTime() - (t.dueDate ? t.dueDate.getTime() : now.getTime())) / (24 * 60 * 60 * 1000)));
        const subject = `Payment reminder — Invoice ${t.invoiceNumber}`;
        const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
          <h2 style="margin:0 0 8px;color:#5b21b6">${company?.name || 'Our team'}</h2>
          <p>Hi ${t.customerName || 'there'},</p>
          <p>This is a friendly reminder that invoice <strong>${t.invoiceNumber}</strong> for
             <strong>₹${t.outstanding.toLocaleString('en-IN')}</strong> was due on
             <strong>${t.dueDate ? t.dueDate.toDateString() : 'today'}</strong> and is now ${daysLate} day(s) overdue.</p>
          <p>If payment has already been made, please ignore this note. Otherwise, we would appreciate it if you could settle it at the earliest.</p>
          <p style="margin-top:24px;color:#6b7280;font-size:13px">Thank you,<br>${company?.name || 'Accounts Team'}</p>
        </div>`;
        try {
          await sendEmail({ to: t.customerEmail as string, subject, html });
          sent.push({ invoiceNumber: t.invoiceNumber, email: t.customerEmail as string });
          await prisma.invoice.update({ where: { id: t.id }, data: { status: 'overdue' } });
        } catch (e) {
          failed.push({ invoiceNumber: t.invoiceNumber, email: t.customerEmail as string, error: e instanceof Error ? e.message : 'send failed' });
        }
      }

      // Record the run as an Automation for visibility.
      await prisma.automation.create({
        data: {
          name: `Payment chase — ${new Date().toISOString().slice(0, 10)}`,
          description: `${sent.length} reminder(s) sent, ${failed.length} failed`,
          trigger: 'manual:payment-chase',
          actions: { sent, failed, dryRun: false } as object,
          status: 'completed',
          companyId,
          createdBy: user.id,
        },
      });
    }

    return NextResponse.json({
      dryRun,
      company: company?.name || null,
      overdueCount: targets.length,
      totalOutstanding: round2(targets.reduce((s, t) => s + t.outstanding, 0)),
      candidates: targets.map(t => ({ invoiceNumber: t.invoiceNumber, customerName: t.customerName, email: t.customerEmail, outstanding: t.outstanding, dueDate: t.dueDate })),
      sent: dryRun ? [] : sent,
      failed: dryRun ? [] : failed,
    });
  } catch (error) {
    console.error('Payment chase error:', error);
    const message = error instanceof Error ? error.message : 'Failed to run payment chase';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
