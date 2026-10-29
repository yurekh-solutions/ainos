import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeMedia } from '@/lib/ai-provider';
import { extractJson, nearestGstRate } from '@/lib/finance/ai';

// Invoice / receipt OCR import: a photo or PDF-of-page (as a base64 image) is
// read by the vision provider and turned into draft line items the user can
// review before creating the invoice. Mirrors the existing media-scan pattern.

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: 'An image is required' }, { status: 400 });

    const instruction = `You are extracting data from an invoice or receipt image.
Return ONLY minified JSON in exactly this shape (no markdown):
{
  "vendor": "seller/vendor name or empty",
  "vendorGst": "GSTIN if visible else empty",
  "invoiceNumber": "document number if visible else empty",
  "invoiceDate": "YYYY-MM-DD if visible else empty",
  "currency": "INR unless clearly another",
  "items": [
    { "productName": "", "description": "", "hsnCode": "", "quantity": 1, "price": 0, "gstRate": 18 }
  ]
}
price = per-unit taxable price. Use numbers, not strings. If a field is not visible use "" or a sensible default.`;

    const analysis = await analyzeMedia(imageBase64, instruction);
    if (!analysis) {
      return NextResponse.json({ error: 'AI OCR is unavailable right now — please enter the items manually' }, { status: 503 });
    }

    const parsed = extractJson<Record<string, unknown>>(analysis);
    if (!parsed) {
      return NextResponse.json({ error: 'Could not read the document — try a clearer photo' }, { status: 422 });
    }

    const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
    const items = rawItems
      .map((it: Record<string, unknown>) => ({
        productName: typeof it.productName === 'string' ? it.productName : (typeof it.description === 'string' ? it.description : 'Item'),
        description: typeof it.description === 'string' ? it.description : '',
        hsnCode: typeof it.hsnCode === 'string' ? it.hsnCode : '',
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
        gstRate: nearestGstRate(it.gstRate),
      }))
      .filter(it => it.price > 0 || it.productName !== 'Item');

    return NextResponse.json({
      vendor: typeof parsed.vendor === 'string' ? parsed.vendor : '',
      vendorGst: typeof parsed.vendorGst === 'string' ? parsed.vendorGst : '',
      invoiceNumber: typeof parsed.invoiceNumber === 'string' ? parsed.invoiceNumber : '',
      invoiceDate: typeof parsed.invoiceDate === 'string' ? parsed.invoiceDate : '',
      currency: typeof parsed.currency === 'string' ? parsed.currency : 'INR',
      items,
    });
  } catch (error) {
    console.error('OCR import error:', error);
    const message = error instanceof Error ? error.message : 'Failed to read document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
