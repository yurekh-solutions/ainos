import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { amountInWords, currencySymbol } from '@/lib/finance/gst';

async function resolveUser(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.companyId) return null;
  return { id: user.id, companyId: user.companyId };
}

interface Line {
  description?: string; productName?: string; quantity?: number; price?: number;
  gstRate?: number; taxAmount?: number; total?: number; hsnCode?: string;
}

// Combined multi-invoice PDF export. One A4 page per invoice with a compact
// itemised summary — good enough for sharing a batch with a CA or the client,
// without duplicating the full branded template renderer.
export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.slice(0, 100) : [];
    if (!ids.length) return NextResponse.json({ error: 'No invoices selected' }, { status: 400 });

    const invoices = await prisma.invoice.findMany({ where: { id: { in: ids }, companyId: user.companyId } });
    const company = await prisma.company.findUnique({ where: { id: user.companyId }, select: { name: true } });

    if (!invoices.length) return NextResponse.json({ error: 'Invoices not found' }, { status: 404 });

    // Pre-render e-invoice QR images (best-effort) so the sync page loop can embed them.
    const qrMap = new Map<string, string>();
    for (const inv of invoices) {
      if (inv.einvoiceQr) {
        try { qrMap.set(inv.id, await QRCode.toDataURL(inv.einvoiceQr, { margin: 1, width: 160 })); } catch { /* skip */ }
      }
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 200;
    const M = 14;
    const money = (n: number, cur: string) => `${currencySymbol(cur)}${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    invoices.forEach((inv, idx) => {
      if (idx > 0) doc.addPage();
      const cur = inv.currency || 'INR';
      let y = M + 6;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
      doc.text(company?.name || 'AINOS', M, y);
      doc.setFontSize(11); doc.text('TAX INVOICE', pageW, y, { align: 'right' });
      y += 6;

      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(`Invoice #: ${inv.invoiceNumber}`, M, y);
      doc.text(`Date: ${inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : ''}`, pageW, y, { align: 'right' });
      y += 5;
      doc.text(`Bill To: ${inv.customerName || '-'}`, M, y);
      if (inv.customerGstNumber) { y += 4.5; doc.text(`GSTIN: ${inv.customerGstNumber}`, M, y); }
      y += 4.5;
      doc.text(`Supply: ${inv.supplyType === 'inter' ? 'Inter-state (IGST)' : 'Intra-state (CGST+SGST)'}`, M, y);
      y += 4.5;
      if (inv.placeOfSupply) { doc.text(`Place of Supply: ${inv.placeOfSupply}`, M, y); y += 4.5; }

      y += 3;
      doc.setTextColor(0);
      // Table header
      doc.setFillColor(243, 244, 246); doc.rect(M, y - 4, pageW - M, 6, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('Item', M + 1, y);
      doc.text('Qty', 120, y, { align: 'right' });
      doc.text('Rate', 145, y, { align: 'right' });
      doc.text('GST%', 163, y, { align: 'right' });
      doc.text('Amount', 186, y, { align: 'right' });
      y += 5;

      const items = (Array.isArray(inv.items) ? inv.items : []) as Line[];
      doc.setFont('helvetica', 'normal');
      for (const it of items) {
        if (y > 275) { doc.addPage(); y = M + 6; }
        doc.text(String(it.description || it.productName || 'Item').slice(0, 42), M + 1, y);
        doc.text(String(it.quantity ?? 0), 120, y, { align: 'right' });
        doc.text(String(it.price ?? 0), 145, y, { align: 'right' });
        doc.text(String(it.gstRate ?? 0), 163, y, { align: 'right' });
        doc.text(String(it.total ?? 0), 186, y, { align: 'right' });
        y += 4.5;
      }

      y += 2;
      doc.setDrawColor(200); doc.line(M, y, pageW, y); y += 5;
      doc.setFontSize(9);
      const rows: Array<[string, number]> = [
        ['Subtotal', inv.subtotal || 0],
        ['CGST', inv.cgstAmount || 0], ['SGST', inv.sgstAmount || 0],
        ['IGST', inv.igstAmount || 0], ['UTGST', inv.utgstAmount || 0],
        ['Discount', -(inv.discountAmount || 0)],
        ['TDS', -(inv.tdsAmount || 0)], ['TCS', inv.tcsAmount || 0],
      ];
      for (const [label, val] of rows) {
        if (!val) continue;
        doc.text(label, 140, y);
        doc.text(money(val, cur), 186, y, { align: 'right' });
        y += 4.5;
      }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('TOTAL', 140, y);
      doc.text(money(inv.totalAmount || 0, cur), 186, y, { align: 'right' });
      y += 6;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(90);
      doc.text(`Amount in words: ${amountInWords(inv.totalAmount || 0, cur)}`, M, y);

      // e-Invoice QR + IRN (bottom-left of each page)
      const qr = qrMap.get(inv.id);
      if (qr && inv.einvoiceIrn) {
        const qrSize = 20;
        const qrY = 272;
        doc.addImage(qr, 'PNG', M, qrY, qrSize, qrSize);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(90);
        doc.text('e-Invoice IRN', M + qrSize + 2, qrY + 4);
        doc.text(doc.splitTextToSize(inv.einvoiceIrn.slice(0, 40), 60), M + qrSize + 2, qrY + 8);
        doc.text(doc.splitTextToSize(inv.einvoiceIrn.slice(40), 60), M + qrSize + 2, qrY + 12);
        if (inv.einvoiceAck) doc.text(`Ack: ${inv.einvoiceAck}`, M + qrSize + 2, qrY + 17);
      }
    });

    const buf = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ainos-invoices-${invoices.length}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Bulk PDF error:', error);
    return NextResponse.json({ error: 'Failed to generate bulk PDF' }, { status: 500 });
  }
}
