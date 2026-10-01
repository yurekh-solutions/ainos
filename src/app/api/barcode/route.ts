import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Generate a simple SVG barcode from text (CODE128-like visual)
function generateBarcodeSvg(text: string) {
  // Create a deterministic binary pattern from the text characters
  let pattern = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    pattern += code.toString(2).padStart(8, '0');
  }
  // Add start/stop patterns
  pattern = '1101001000' + pattern + '1100010010';

  const barWidth = 2;
  const height = 80;
  const margin = 10;
  const totalWidth = pattern.length * barWidth + margin * 2;
  const totalHeight = height + margin * 2 + 20;

  let rects = '';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      rects += `<rect x="${margin + i * barWidth}" y="${margin}" width="${barWidth}" height="${height}" fill="#333"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}"><rect width="100%" height="100%" fill="transparent"/>${rects}<text x="${totalWidth / 2}" y="${height + margin + 15}" text-anchor="middle" font-size="12" font-family="monospace" fill="#333">${text}</text></svg>`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const svg = generateBarcodeSvg(text);
    return NextResponse.json({ svg, text });
  } catch (error) {
    console.error('Error generating barcode:', error);
    return NextResponse.json({ error: 'Failed to generate barcode' }, { status: 500 });
  }
}

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
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, companyId: user.companyId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const barcodeText = product.barcode || product.sku || product.id;
    const svg = generateBarcodeSvg(barcodeText);

    return NextResponse.json({ svg, text: barcodeText, productName: product.name });
  } catch (error) {
    console.error('Error generating product barcode:', error);
    return NextResponse.json({ error: 'Failed to generate barcode' }, { status: 500 });
  }
}
