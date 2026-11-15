// Intra-state or inter-state, decided from the evidence the seller already
// typed — no guessing.
//
// This is the single most expensive judgement call on a GST invoice: get it
// wrong and CGST/SGST is charged where IGST was due, the place-of-supply in
// GSTR-1 disagrees with the tax paid, and the buyer's input tax credit is built
// on a wrong state. The invoice form used to default to "intra" and let the
// user notice it, while the API already had the correct rule — so the form was
// quietly overriding right answers with defaults.
//
// Everything here is pure so it can be tested without a database and reused by
// the browser, where the seller needs to see the reason *before* saving.

import { GST_STATE_CODES, UT_STATE_CODES, stateCodeFromGstin } from './gst';
import { isKnownStateCode } from './gstnFiling';

export type SupplyChoice = 'intra' | 'inter';
export type SupplyBasis = 'gstin' | 'place-of-supply' | 'state-name' | 'none';

export interface SupplyInput {
  /** The seller's own GSTIN, from the company record. */
  companyGst?: string | null;
  companyState?: string | null;
  /** The buyer's GSTIN as typed on the invoice or saved on the customer. */
  customerGst?: string | null;
  customerState?: string | null;
  /** A place of supply already chosen (a 2-digit code, as GSTR-1 wants it). */
  placeOfSupply?: string | null;
}

export interface SupplyDecision {
  supplyType: SupplyChoice;
  /** False when there was no evidence to go on; the caller keeps its default. */
  decided: boolean;
  basis: SupplyBasis;
  sellerCode: string | null;
  posCode: string | null;
  sellerStateName: string | null;
  posStateName: string | null;
  /** Seller registered in a Union Territory: an intra-state bill there is
   *  CGST + UTGST. Independent of which supply type ends up chosen. */
  sellerIsUt: boolean;
  /** One plain sentence saying which states were compared and what that means. */
  note: string;
}

/** A 2-digit code counts only if CBIC actually published it. */
const knownCode = (value?: string | null): string | null => {
  const raw = String(value ?? '').trim().toUpperCase();
  if (!/^\d{2}$/.test(raw)) return null;
  return isKnownStateCode(raw) ? raw : null;
};

const codeFromGstin = (gstin?: string | null): string | null =>
  knownCode(stateCodeFromGstin(gstin));

// "Dadra & Nagar Haveli and Daman & Diu" and "Dadra and Nagar Haveli, Daman and
// Diu" are the same place. Sorting the words and dropping the joiners makes the
// everyday spellings land on one key without turning "Andaman" into "Aman".
const tokenKey = (name: string): string =>
  name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && t !== 'AND' && t !== 'OF' && t !== 'OLD')
    .sort()
    .join(' ');

// Built once from the CBIC table. The pre-reorganisation rows carry the same
// name twice ("Andhra Pradesh" and "Andhra Pradesh (old)"), so the current code
// is inserted first and the legacy one never shadows it.
const STATE_NAME_CODES: Map<string, string> = (() => {
  const map = new Map<string, string>();
  const entries = Object.entries(GST_STATE_CODES);
  for (const [code, label] of entries) {
    if (/\(old\)/i.test(label)) continue;
    map.set(tokenKey(label), code);
  }
  for (const [code, label] of entries) {
    if (!/\(old\)/i.test(label)) continue;
    const key = tokenKey(label);
    if (!map.has(key)) map.set(key, code);
  }
  return map;
})();

/** Loose state text -> CBIC state code. Returns null when it means nothing. */
export function codeForStateName(name?: string | null): string | null {
  const raw = String(name ?? '').trim();
  if (!raw) return null;
  const asCode = knownCode(raw);
  if (asCode) return asCode;
  return STATE_NAME_CODES.get(tokenKey(raw)) ?? null;
}

const stateLabel = (code: string | null): string | null =>
  code ? GST_STATE_CODES[code] ?? null : null;

/**
 * Compare seller state with place of supply.
 *
 * Evidence strength, in order: the buyer's stated place of supply, the buyer's
 * GSTIN, then a plain state name. The seller side comes from their own GSTIN,
 * falling back to the state on their profile. A code derived from a name is
 * still a real comparison — it just says so, because names are hand-typed.
 */
export function decideSupply(input: SupplyInput): SupplyDecision {
  const gstSeller = codeFromGstin(input.companyGst);
  const nameSeller = codeForStateName(input.companyState);
  const sellerCode = gstSeller ?? nameSeller;

  const statedPos = knownCode(input.placeOfSupply);
  const gstPos = codeFromGstin(input.customerGst);
  const namePos = codeForStateName(input.customerState);
  const posCode = statedPos ?? gstPos ?? namePos;

  const fromGstinOnly = !!statedPos
    ? 'place-of-supply'
    : !!gstPos && (!!gstSeller || !nameSeller)
      ? 'gstin'
      : 'state-name';

  if (!sellerCode || !posCode) {
    // Not enough to judge. Say what would fix it rather than inventing a split.
    const missing = !sellerCode && !posCode
      ? "Add your GSTIN and the customer's GSTIN or state"
      : !sellerCode
        ? "Add your own GSTIN under Company details"
        : "Add the customer's GSTIN or state";
    return {
      supplyType: 'intra',
      decided: false,
      basis: 'none',
      sellerCode,
      posCode,
      sellerStateName: stateLabel(sellerCode),
      posStateName: stateLabel(posCode),
      sellerIsUt: !!sellerCode && UT_STATE_CODES.has(sellerCode),
      note: `${missing} and AINOS will pick intra or inter on its own.`,
    };
  }

  const supplyType: SupplyChoice = sellerCode === posCode ? 'intra' : 'inter';
  const sellerName = stateLabel(sellerCode);
  const posName = stateLabel(posCode);
  const sellerIsUt = UT_STATE_CODES.has(sellerCode);

  let note: string;
  if (supplyType === 'inter') {
    note = `Your state is ${sellerName} (${sellerCode}) and the supply goes to ${posName} (${posCode}), so this is an inter-state bill — full IGST.`;
  } else if (sellerIsUt) {
    note = `Both sides are in ${sellerName} (${sellerCode}), which is a Union Territory — intra-state tax here is CGST + UTGST, not CGST + SGST.`;
  } else {
    note = `Both sides are in ${sellerName} (${sellerCode}), so this is an intra-state bill — CGST + SGST.`;
  }

  // A state code lifted off a GSTIN is government data; one lifted off a typed
  // state name is a spelling. The sentence has to say which is which, because
  // "matched on names" is the one case where a typo really does move tax.
  const typed: string[] = [];
  if (!gstSeller) typed.push('your state');
  if (!statedPos && !gstPos) typed.push("the customer's state");
  if (typed.length) note += ` ${typed.join(' and ')} came from a state name rather than a GSTIN, so do check the spelling.`;

  return {
    supplyType,
    decided: true,
    basis: fromGstinOnly,
    sellerCode,
    posCode,
    sellerStateName: sellerName,
    posStateName: posName,
    sellerIsUt,
    note,
  };
}
