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

// Characters 3-12 of a GSTIN *are* the recipient's PAN, so a card that prints
// only the GSTIN still gives the invoice the PAN field it needs.
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;

export function panFromGstin(gstNumber?: string | null): string | null {
  const g = str(gstNumber).toUpperCase();
  if (g.length !== 15) return null;
  const pan = g.slice(2, 12);
  return PAN.test(pan) ? pan : null;
}

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
  panNumber: string | null;
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
    return { draft: null, warnings: ['Nothing readable — type at least a name before saving.'] };
  }

  const email = firstOf(str(f.email).replace(/,/g, '/'));
  if (email && !email.includes('@')) warnings.push('The email did not look valid, so it was skipped.');

  const gstRaw = str(f.gstin);
  const gstNumber = cleanGstin(gstRaw);
  if (gstRaw && !gstNumber) {
    warnings.push(`GSTIN "${gstRaw}" is not a valid 15-character GSTIN, so it was not saved.`);
  }

  const stateCode = gstNumber ? gstNumber.slice(0, 2) : '';
  const address = str(f.address);
  const pin = address.match(PINCODE)?.[1] ?? '';

  // The PAN is not taken from the picture at all: characters 3-12 of a GSTIN
  // that already passed validation are the recipient's PAN, so reading it off
  // the card would only add a second chance to misread the same eleven
  // characters. Without a GSTIN there is no PAN, and the field stays blank.
  const panNumber = panFromGstin(gstNumber);

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
      panNumber: panNumber || null,
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

/**
 * What GSTN said about this number, last time this account asked.
 *
 * Format validation proves the string is shaped like a GSTIN; it does not prove
 * the number belongs to anybody. AINOS already keeps every real portal lookup
 * it has ever done in gst_lookup_cache, so a scanned GSTIN can be cross-checked
 * against that without touching GSTN and without a captcha. A miss is reported
 * as a miss — never as a pass.
 */
export type GstnCheck = 'verified' | 'attention' | 'unchecked';

export interface GstnSummary {
  check: GstnCheck;
  /** Short pill text. */
  label: string;
  /** One plain sentence explaining the pill. */
  detail: string;
  legalName: string | null;
  stateName: string | null;
  gstStatus: string | null;
  fetchedAt: string | null;
}

export interface CachedGstn {
  gstNumber?: string | null;
  gstStatus?: string | null;
  fetchedAt?: Date | string | null;
  payload?: unknown;
}

const UNCHECKED = (label: string, detail: string): GstnSummary => ({
  check: 'unchecked', label, detail,
  legalName: null, stateName: null, gstStatus: null, fetchedAt: null,
});

/**
 * `row` is the cached portal record for this exact number: an object when this
 * account has it, null when it genuinely does not, and undefined when the
 * records could not be read at all. Those last two look the same from the
 * outside but only one of them is worth telling the user about, so they get
 * different wording.
 *
 * `samePan` holds other GSTINs this account has seen that carry the same PAN.
 * The PAN sits in the middle of a GSTIN, so two numbers around one PAN differ
 * only in the state code and the tail: a business that moved state, an old
 * registration that was replaced, or the digit the card was misread on.
 *
 * The order is deliberate. Portal evidence outranks everything. Below that, a
 * known sibling PAN is the more useful warning because it names the number the
 * account has actually seen; the check character comes next, since it can prove
 * a misreading with nothing but the number itself; and only a number that passes
 * both is left as simply unseen.
 */
export function summariseGstn(
  gstNumber: string | null,
  row: CachedGstn | null | undefined,
  samePan: string[] = [],
): GstnSummary {
  if (!gstNumber) {
    return UNCHECKED('No GSTIN', 'The card did not give a usable GSTIN, so nothing could be checked on GSTN.');
  }
  if (row === undefined) {
    return UNCHECKED('Not checked', 'AINOS could not reach its GSTIN records just now, so this number was not cross-checked. The card was still saved.');
  }

  if (row === null) {
    if (samePan.length) {
      return {
        check: 'attention',
        label: 'GSTIN needs a look',
        detail: `This account has seen the same PAN on the portal as ${samePan[0]}, not ${gstNumber}. Either the card was misread or the registration was replaced — worth checking before the first bill.`,
        legalName: null, stateName: null, gstStatus: null, fetchedAt: null,
      };
    }
    // The last character is computed from the fourteen before it, so a number
    // can be complete, correctly shaped, legal in every slot and still not be
    // anybody's GSTIN. This is the one misreading that needs no portal to catch.
    const verdict = validateGstin(gstNumber);
    if (verdict.checkDigitMismatch) {
      return {
        check: 'attention',
        label: 'GSTIN looks misread',
        detail: `${gstNumber} does not add up against itself — ${verdict.reason || 'its check character is wrong'}. Every slot is legal, so a format check lets it through; ask the supplier to confirm the number in writing before the first bill.`,
        legalName: null, stateName: null, gstStatus: null, fetchedAt: null,
      };
    }
    return UNCHECKED('Not checked on GSTN', `${gstNumber} is shaped like a real GSTIN and adds up, but this account has not seen it on the portal yet. Check it before the first big bill.`);
  }

  const payload = (row.payload ?? {}) as Record<string, unknown>;
  const legalName = str(payload.legalName) || str(payload.companyName) || null;
  const stateName = str(payload.stateName) || null;
  const status = str(row.gstStatus) || str(payload.gstStatus) || '';
  const when = row.fetchedAt ? new Date(row.fetchedAt) : null;
  const fetchedAt = when && !Number.isNaN(when.getTime()) ? when.toISOString().slice(0, 10) : null;

  if (/cancel|inactive|suspend|provisional|ineligible/i.test(status)) {
    return {
      check: 'attention',
      label: `GSTN: ${status}`,
      detail: `GSTN shows ${gstNumber} as "${status}". Invoices raised to a cancelled registration do not give the buyer input credit — get the current number from them before billing.`,
      legalName, stateName, gstStatus: status, fetchedAt,
    };
  }

  return {
    check: 'verified',
    label: legalName ? 'Matches GSTN' : 'Seen on GSTN',
    detail: legalName
      ? `GSTN knows this number as ${legalName}${stateName ? ` in ${stateName}` : ''}${fetchedAt ? ` (checked ${fetchedAt})` : ''}.`
      : `This account has fetched ${gstNumber} from the portal before${fetchedAt ? ` on ${fetchedAt}` : ''}, so the number exists.`,
    legalName, stateName, gstStatus: status || null, fetchedAt,
  };
}
