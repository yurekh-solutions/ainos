import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildContactDraft,
  duplicateCandidates,
  fillBlanks,
  normalisePhone,
  type BusinessCardFields,
} from '@/lib/finance/businessCard';

// Saves a scanned business card into the customer book.
//
// Called once per card, either straight after the scan (the "add automatically"
// switch on the scanner) or from the row's own button. The card is never
// blindly inserted: if the seller already has this contact — same GSTIN, same
// email, same number however it is formatted, or the same name and company —
// the existing record is topped up instead, and only in the fields that are
// still empty. That is what keeps fifty exhibition cards from becoming fifty
// duplicates while also refusing to overwrite a good number with an OCR guess.

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    const companyId = user.companyId;

    const body = await req.json().catch(() => null);
    const fields = (body?.fields ?? body) as Partial<BusinessCardFields> | null;
    if (!fields || typeof fields !== 'object') {
      return NextResponse.json({ error: 'No card data was sent' }, { status: 400 });
    }

    const { draft, warnings } = buildContactDraft(fields);
    if (!draft) {
      return NextResponse.json({ error: warnings[0] || 'Nothing to save from this card', warnings }, { status: 422 });
    }

    // Strongest key first, so a GSTIN match beats a name-and-company collision.
    let existing: { id: string } | null = null;
    for (const clause of duplicateCandidates(draft)) {
      existing = await prisma.customer.findFirst({
        where: { companyId, AND: [clause as Prisma.CustomerWhereInput] },
        select: { id: true },
      });
      if (existing) break;
    }

    // Phone needs the digits compared, not the string: "+91 98200 12345" and
    // "98200-12345" are the same contact but no plain equality catches that.
    if (!existing) {
      const core = normalisePhone(draft.phone || '');
      if (core.length >= 10) {
        const hits = await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM customers
          WHERE company_id = ${companyId}
            AND phone IS NOT NULL
            AND regexp_replace(phone, '\\D', '', 'g') LIKE ${'%' + core}
          LIMIT 1`;
        existing = hits[0] ?? null;
      }
    }

    if (existing) {
      const full = await prisma.customer.findUnique({ where: { id: existing.id } });
      if (!full) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

      const patch = fillBlanks(full as Record<string, unknown>, draft);
      if (!Object.keys(patch).length) {
        return NextResponse.json({
          ok: true, action: 'unchanged', id: full.id, name: full.name, warnings,
        });
      }
      const updated = await prisma.customer.update({ where: { id: full.id }, data: patch });
      return NextResponse.json({ ok: true, action: 'updated', id: updated.id, name: updated.name, warnings });
    }

    const created = await prisma.customer.create({ data: { ...draft, companyId } });
    return NextResponse.json({ ok: true, action: 'created', id: created.id, name: created.name, warnings }, { status: 201 });
  } catch (error) {
    console.error('Business card save error:', error);
    const message = error instanceof Error ? error.message : 'Could not save the card';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
