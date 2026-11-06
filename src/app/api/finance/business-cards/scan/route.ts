import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeMedia } from '@/lib/ai-provider';
import { extractJson } from '@/lib/finance/ai';

// Business-card OCR: a card photo (base64 image) is read by the vision
// provider and turned into structured contact fields the user can review,
// edit and export to Excel. Mirrors the invoice/receipt scan pattern.

export interface BusinessCardFields {
  name: string;
  designation: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 401 });

    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: 'An image is required' }, { status: 400 });

    const instruction = `You are extracting contact details from a business card image.
Return ONLY minified JSON in exactly this shape (no markdown):
{
  "name": "person name or empty",
  "designation": "job title / role or empty",
  "company": "company / brand name or empty",
  "phone": "phone number(s) or empty",
  "email": "email address(es) or empty",
  "website": "website / URL or empty",
  "address": "office address or empty"
}
Read the text exactly as printed. If a field has multiple values (e.g. two phones), join them with " / ". Use "" for anything not present on the card. Never invent data.`;

    const analysis = await analyzeMedia(imageBase64, instruction);
    if (!analysis) {
      return NextResponse.json({ error: 'AI scanning is unavailable right now — please try again in a moment' }, { status: 503 });
    }

    const parsed = extractJson<Record<string, unknown>>(analysis);
    if (!parsed) {
      return NextResponse.json({ error: 'Could not read the card — try a clearer, well-lit photo' }, { status: 422 });
    }

    const fields: BusinessCardFields = {
      name: str(parsed.name),
      designation: str(parsed.designation ?? parsed.title),
      company: str(parsed.company),
      phone: str(parsed.phone ?? parsed.mobile),
      email: str(parsed.email),
      website: str(parsed.website ?? parsed.url),
      address: str(parsed.address),
    };

    return NextResponse.json({ fields });
  } catch (error) {
    console.error('Business card scan error:', error);
    const message = error instanceof Error ? error.message : 'Failed to read card';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
