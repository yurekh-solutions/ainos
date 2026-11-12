// Business-card contact data: what an OCR'd card has to become so it can be
// dropped straight into the customer book.
//
// The scan route reads the picture; this module decides what a usable contact
// looks like, and — just as importantly — how not to wreck the records a seller
// has already typed by re-scanning a card they saved last month.
import { GST_STATE_CODES } from './gst';
import { validateGstin } from './gstnFiling';

export interface BusinessCardFields {
  name: string;
  designation: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  gstin: string;
}

export const EMPTY_CARD_FIELDS: BusinessCardFields = {
  name: '', designation: '', company: '', phone: '', email: '', website: '', address: '', gstin: '',
};

const str = (v: unknown): string => {
  if (typeof v === 'string') return v.trim();
  if (v === null || v === undefined) return '';
  return String(v).trim();
};

/** A card that lists two numbers prints them as "98200 12345 / 22 4567 8901". */
const firstOf = (raw: string, sep = '/'): string =>
  str(raw).split(sep).map((s) => s.trim()).filter(Boolean)[0] ?? '';

/** Digits only, with the country code dropped, so "+91 98200 12345" and
 *  "098200-12345" are recognised as the same person. */
export function normalisePhone(raw: string): string {
  const digits = str(raw).replace(/\D/g, '');
  if (digits.length > 10 && (digits.startsWith('91') || digits.startsWith('0'))) {
    return digits.slice(-10);
  }
  return digits;
}

const PINCODE = /\b([1-9]\d{5})\b/;

/**
 * Only a GSTIN that passes the format check is ever written into a customer
 * record. A misread "27ABCDE1234A1Z5" would otherwise poison the GST lookup and
 * every invoice raised for that contact. The check digit stays advisory, exactly
 * as it does in the filing pack.
 */
export function cleanGstin(raw: string): string {
  const g = str(raw).toUpperCase().replace(/\s+/g, '');
  if (!g) return '';
  return validateGstin(g).valid ? g : '';
}

export interface ContactDraft {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  gstNumber: string | null;
  state: string | null;
  pincode: string | null;
  notes: string | null;
}

export interface DraftResult {
  draft: ContactDraft | null;
  warnings: string[];
}

/**
 * Turns card fields into a customer-shaped record, or refuses when the card
 * yielded nothing a human would recognise. Name falls back to company, then to
 * the email handle, because plenty of cards carry no personal name at all.
 */
export function buildContactDraft(f: Partial<BusinessCardFields>): DraftResult {
  const warnings: string[] = [];

  const name = str(f.name) || str(f.company) || (str(f.email).includes('@') ? str(f.email).split('@')[0] : '');
  if (!name) {
    return { draft: null, warnings: ['Nothing readable on the card — type at least a name before saving.'] };
  }

  const email = firstOf(str(f.email).replace(/,/g, '/'));
  if (email && !email.includes('@')) warnings.push('The email on the card did not look valid, so it was skipped.');

  const gstRaw = str(f.gstin);
  const gstNumber = cleanGstin(gstRaw);
  if (gstRaw && !gstNumber) {
    warnings.push(`GSTIN "${gstRaw}" is not a valid 15-character GSTIN, so it was not saved.`);
  }

  const stateCode = gstNumber ? gstNumber.slice(0, 2) : '';
  const address = str(f.address);
  const pin = address.match(PINCODE)?.[1] ?? '';

  const notesParts: string[] = [];
  const designation = str(f.designation);
  const website = str(f.website).replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (designation) notesParts.push(`Designation: ${designation}`);
  if (website) notesParts.push(`Website: ${website}`);
  const extraPhones = str(f.phone).split('/').map((s) => s.trim()).filter(Boolean).slice(1);
  const extraEmails = str(f.email).replace(/,/g, '/').split('/').map((s) => s.trim()).filter(Boolean).slice(1);
  if (extraPhones.length) notesParts.push(`Other numbers: ${extraPhones.join(', ')}`);
  if (extraEmails.length) notesParts.push(`Other emails: ${extraEmails.join(', ')}`);

  return {
    draft: {
      name,
      email: email && email.includes('@') ? email.toLowerCase() : null,
      phone: firstOf(str(f.phone).replace(/,/g, '/')) || null,
      company: str(f.company) || null,
      address: address || null,
      gstNumber: gstNumber || null,
      state: (stateCode && GST_STATE_CODES[stateCode]) || null,
      pincode: pin || null,
      notes: notesParts.length ? notesParts.join(' · ') : null,
    },
    warnings,
  };
}

type CustomerLike = Record<string, unknown>;

const isBlank = (v: unknown): boolean => v === null || v === undefined || String(v).trim() === '';

/**
 * Fills only the gaps. If the seller already holds a number for this contact,
 * an OCR guess must not overwrite it — the card may be five years old. Fields
 * that already carry a value are left exactly as they are.
 */
export function fillBlanks(existing: CustomerLike, draft: ContactDraft): Record<string, string | null> {
  const patch: Record<string, string | null> = {};
  for (const key of Object.keys(draft) as Array<keyof ContactDraft>) {
    const next = draft[key];
    if (isBlank(next)) continue;
    if (!isBlank(existing[key])) continue;
    patch[key] = next as string | null;
  }
  return patch;
}

/**
 * The keys that mean "this card is already in the books", strongest first. A
 * phone is matched on its last ten digits so formatting differences between the
 * card and the record do not create a duplicate.
 */
export function duplicateCandidates(draft: ContactDraft): Array<Record<string, unknown>> {
  const where: Array<Record<string, unknown>> = [];
  if (draft.gstNumber) where.push({ gstNumber: draft.gstNumber });
  if (draft.email) where.push({ email: { equals: draft.email, mode: 'insensitive' } });
  const core = normalisePhone(draft.phone || '');
  if (core.length >= 10) where.push({ phone: { contains: core } });
  if (draft.name && draft.company) {
    where.push({
      name: { equals: draft.name, mode: 'insensitive' },
      company: { equals: draft.company, mode: 'insensitive' },
    });
  }
  return where;
}
