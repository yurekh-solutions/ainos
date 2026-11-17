import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import {
  buildContactDraft,
  panFromGstin,
  summariseGstn,
  type BusinessCardFields,
  type CachedGstn,
  type ContactDraft,
} from '@/lib/finance/businessCard';
import { saveContact } from '@/lib/finance/customerBook';

// Saves a scanned business card into the customer book.
//
// Called once per card, either straight after the scan (the "add automatically"
// switch on the scanner) or from the row's own button. The card is never
// blindly inserted: if the seller already has this contact — same GSTIN, same
// email, same number however it is formatted, or the same name and company —
// the existing record is topped up instead, and only in the fields that are
// still empty. That is what keeps fifty exhibition cards from becoming fifty
// duplicates while also refusing to overwrite a good number with an OCR guess.
//
// The response also carries what GSTN said about the number last time this
// account looked, because "the card printed 15 characters" is not the same
// claim as "this supplier exists".

// Best-effort on purpose. Three outcomes for the exact number, and they must
// not blur together: the record, nothing (this account has never seen it), or
// undefined (the read itself failed — say so instead of implying the number is
// unknown). When nothing matches, the same PAN is looked for on other numbers
// this account has seen, because that is where a misread shows up.
async function gstnEvidence(gstNumber: string | null): Promise<{ row: CachedGstn | null | undefined; samePan: string[] }> {
  if (!gstNumber) return { row: null, samePan: [] };
  const pan = panFromGstin(gstNumber);
  try {
    const row = await prisma.gstLookupCache.findUnique({
      where: { gstNumber },
      select: { gstNumber: true, gstStatus: true, fetchedAt: true, payload: true },
    });
    if (row || !pan) return { row, samePan: [] };
    // Characters 3-12 of a GSTIN are the PAN, so a business that moved state or
    // replaced its registration keeps the same ten characters around a new
    // number. Postgres substr is 1-based, which lines up with that slice.
    const peers = await prisma.$queryRaw<Array<{ gst_number: string }>>`
      SELECT gst_number FROM gst_lookup_cache
      WHERE substr(gst_number, 3, 10) = ${pan}
        AND gst_number <> ${gstNumber}
      LIMIT 3`;
    return { row, samePan: peers.map((p) => p.gst_number).filter(Boolean) };
  } catch (error) {
    console.error('GSTIN cache read failed:', error);
    return { row: undefined, samePan: [] };
  }
}

const filledCount = (draft: ContactDraft): number =>
  (Object.keys(draft) as Array<keyof ContactDraft>)
    .filter((key) => draft[key] !== null && draft[key] !== '').length;

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

    const evidence = await gstnEvidence(draft.gstNumber);
    const gstn = summariseGstn(draft.gstNumber, evidence.row, evidence.samePan);

    // One row per save, so the feature leaves a trail. It is what answers
    // "how many cards come in" and "did the contact it created ever get
    // billed" without adding a table of its own.
    const logSave = (
      entityId: string,
      action: 'created' | 'updated' | 'unchanged',
      summary: string,
      extra: Record<string, unknown> = {},
    ) => recordAudit({
      companyId,
      entity: 'business_card',
      entityId,
      action,
      actor: { id: user.id, email: session.user.email },
      summary,
      changes: {
        check: gstn.check,
        hasGstin: !!draft.gstNumber,
        stateCode: draft.gstNumber?.slice(0, 2) ?? null,
        panPeers: evidence.samePan.length,
        fields: filledCount(draft),
        ...extra,
      },
    });

    // Recognition, creation and gap-filling live in customerBook, because the
    // Excel import in Customers goes through exactly the same door.
    const saved = await saveContact(companyId, draft);

    if (saved.action === 'unchanged') {
      await logSave(saved.id, 'unchanged', `Business card already in Customers as ${saved.name}`);
      return NextResponse.json({
        ok: true, action: 'unchanged', id: saved.id, name: saved.name, warnings, gstn,
      });
    }
    if (saved.action === 'updated') {
      await logSave(
        saved.id, 'updated',
        `Business card filled ${saved.filled.length} blank field(s) for ${saved.name}`,
        { filled: saved.filled },
      );
      return NextResponse.json({ ok: true, action: 'updated', id: saved.id, name: saved.name, warnings, gstn });
    }

    await logSave(saved.id, 'created', `Business card added to Customers as ${saved.name}`);
    return NextResponse.json({ ok: true, action: 'created', id: saved.id, name: saved.name, warnings, gstn }, { status: 201 });
  } catch (error) {
    console.error('Business card save error:', error);
    const message = error instanceof Error ? error.message : 'Could not save the card';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
