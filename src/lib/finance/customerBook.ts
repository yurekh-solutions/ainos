// Putting a contact in the book, whichever door it came through.
//
// The business-card scanner and the Excel import both end here, so the
// question "is this person already in Customers?" is answered once. The order
// is strongest key first — GSTIN, email, the phone's last ten digits, then
// name and company — because a GSTIN match beats a name collision, and a
// phone typed as "+91 98200 12345" must still find "98200-12345".
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { duplicateCandidates, fillBlanks, normalisePhone, type ContactDraft } from './businessCard';

export type SaveAction = 'created' | 'updated' | 'unchanged';

export type SaveResult = {
  action: SaveAction;
  id: string;
  name: string;
  /** Fields the existing record was missing and this contact filled in. */
  filled: string[];
};

export async function saveContact(
  companyId: string,
  draft: ContactDraft,
  options: { status?: string } = {},
): Promise<SaveResult> {
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

  if (!existing) {
    // The status only ever applies to a new record: an existing contact's
    // state is a decision somebody in the business made, not a sheet's.
    const created = await prisma.customer.create({
      data: { ...draft, companyId, ...(options.status ? { status: options.status } : {}) },
    });
    return { action: 'created', id: created.id, name: created.name, filled: [] };
  }

  const full = await prisma.customer.findUnique({ where: { id: existing.id } });
  if (!full) throw new Error('Customer not found');

  // Fields that already carry a value are left exactly as they are, so an
  // import can complete a record but can never overwrite what was typed.
  const patch = fillBlanks(full as Record<string, unknown>, draft);
  if (!Object.keys(patch).length) {
    return { action: 'unchanged', id: full.id, name: full.name, filled: [] };
  }
  const updated = await prisma.customer.update({ where: { id: full.id }, data: patch });
  return { action: 'updated', id: updated.id, name: updated.name, filled: Object.keys(patch) };
}
