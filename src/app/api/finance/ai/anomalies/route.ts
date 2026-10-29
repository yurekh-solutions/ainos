import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Deterministic GST / compliance anomaly scan over the company's invoices.
// Rule-based (no provider call) so it is fast, cheap and always available.

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{3}$/;
const round2 = (n: number) => Math.round(n * 100) / 100;

interface Issue {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string | null;
  severity: 'high' | 'medium' | 'low';
  type: string;
  message: string;
}

interface InvoiceItem { hsnCode?: string | null; taxAmount?: number | null; gstRate?: number | null }

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: Record<string, unknown> = { companyId: user.companyId, status: { in: ['sent', 'paid'] } };
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.gte = new Date(from);
      if (to) range.lte = new Date(to);
      where.createdAt = range;
    }

    const invoices = await prisma.invoice.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 });
    const company = await prisma.company.findUnique({ where: { id: user.companyId }, select: { gstNumber: true } });

    const issues: Issue[] = [];
    for (const inv of invoices) {
      const push = (severity: Issue['severity'], type: string, message: string) =>
        issues.push({ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, customerName: inv.customerName, severity, type, message });

      const gst = (inv.customerGstNumber || '').toUpperCase().trim();
      const hasGst = gst.length > 0;
      const total = round2(inv.totalAmount || 0);
      const taxTotal = round2(inv.taxTotal || 0);
      const splitTotal = round2((inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0) + (inv.utgstAmount || 0));

      // 1. Malformed customer GSTIN on a B2B invoice.
      if (hasGst && !GSTIN_RE.test(gst)) {
        push('high', 'invalid_gstin', `Customer GSTIN "${gst}" is not a valid 15-character GSTIN`);
      }

      // 2. High-value sale recorded without a customer GSTIN (likely a B2B filed as B2C).
      if (!hasGst && total > 250000) {
        push('medium', 'missing_gstin', `High-value invoice (₹${total.toLocaleString('en-IN')}) has no customer GSTIN — verify it is truly B2C`);
      }

      // 3. Inter-state / intra-state tax split mismatch.
      if (inv.supplyType === 'inter' && (round2(inv.cgstAmount || 0) > 0 || round2(inv.sgstAmount || 0) > 0)) {
        push('high', 'supply_split', 'Inter-state invoice carries CGST/SGST — it should be IGST only');
      }
      if (inv.supplyType === 'intra' && round2(inv.igstAmount || 0) > 0) {
        push('high', 'supply_split', 'Intra-state invoice carries IGST — it should be CGST + SGST/UTGST');
      }

      // 4. Collected tax does not equal the CGST+SGST+IGST+UTGST split.
      if (taxTotal > 0 && Math.abs(taxTotal - splitTotal) > 1) {
        push('medium', 'tax_split', `Tax total ₹${taxTotal.toLocaleString('en-IN')} ≠ GST split sum ₹${splitTotal.toLocaleString('en-IN')}`);
      }

      // 5. Item-level tax does not add up to the invoice tax total.
      const items = (Array.isArray(inv.items) ? inv.items : []) as InvoiceItem[];
      const itemTax = round2(items.reduce((s, it) => s + (it.taxAmount || 0), 0));
      if (taxTotal > 0 && itemTax > 0 && Math.abs(itemTax - taxTotal) > 2) {
        push('medium', 'item_tax', `Sum of item GST (₹${itemTax.toLocaleString('en-IN')}) differs from invoice tax (₹${taxTotal.toLocaleString('en-IN')})`);
      }

      // 6. Missing HSN/SAC on B2B line items (required for GSTR-1 HSN summary).
      if (hasGst && items.length && items.some(it => !it.hsnCode || !String(it.hsnCode).trim())) {
        push('low', 'missing_hsn', 'One or more B2B line items have no HSN/SAC code');
      }

      // 7. Place of supply vs customer GSTIN state code disagreement.
      if (hasGst && inv.placeOfSupply) {
        const pos = String(inv.placeOfSupply).padStart(2, '0');
        const gstState = gst.slice(0, 2);
        if (pos !== gstState) {
          push('low', 'place_of_supply', `Place of supply (${pos}) differs from customer GSTIN state (${gstState})`);
        }
      }

      // 8. Marked paid but payment shortfall.
      if (inv.status === 'paid' && total > 0 && round2(inv.paidAmount || 0) < total - 1) {
        push('medium', 'payment', `Invoice marked paid but amount received (₹${round2(inv.paidAmount || 0).toLocaleString('en-IN')}) < total`);
      }
    }

    const counts = {
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    };

    return NextResponse.json({
      companyGst: company?.gstNumber || null,
      scanned: invoices.length,
      counts,
      issues: issues.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'high' ? -1 : b.severity === 'high' ? 1 : a.severity === 'medium' ? -1 : 1)),
    });
  } catch (error) {
    console.error('Anomaly scan error:', error);
    const message = error instanceof Error ? error.message : 'Failed to scan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
