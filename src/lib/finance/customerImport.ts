// Customer list reading.
//
// Contacts reach the book two ways: a card photographed at a stall, and a
// spreadsheet the office already keeps. The list must land in the same place
// under the same rules, so every row is turned into the very draft the
// scanner produces — one contact builder, two doors. The columns a structured
// list can carry but a photograph cannot (PAN, pin code, state, notes,
// status) are read straight off the sheet, because there is nothing to guess.
import { buildContactDraft, type ContactDraft } from './businessCard';
import { GST_STATE_CODES } from './gst';
import { codeForStateName } from './supply';
import { buildHeaderLookup, cellText, mapHeaders, type SheetRow } from './sheet';

// Canonical key -> every heading spelling we are willing to recognise.
export const CONTACT_HEADERS: Record<string, string[]> = {
  name: ['customer name', 'customer', 'name', 'client', 'client name', 'party', 'party name', 'contact', 'contact name', 'contact person', 'person name', 'full name', 'lead name', 'buyer name'],
  company: ['company', 'company name', 'firm', 'firm name', 'business', 'business name', 'organisation', 'organization', 'account name'],
  email: ['email', 'email id', 'e mail', 'email address', 'mail', 'office email', 'work email'],
  phone: ['phone', 'phone no', 'phone number', 'mobile', 'mobile no', 'mobile number', 'contact no', 'contact number', 'whatsapp', 'whatsapp no', 'telephone', 'tel', 'cell', 'cell no'],
  gstin: ['gstin', 'gstin no', 'gstin number', 'gst', 'gst no', 'gst number', 'gst reg no', 'buyer gstin', 'customer gstin'],
  pan: ['pan', 'pan no', 'pan number', 'pan card'],
  address: ['address', 'billing address', 'address line 1', 'address 1', 'full address', 'street', 'office address', 'location'],
  state: ['state', 'state name', 'billing state', 'customer state', 'party state'],
  pincode: ['pincode', 'pin code', 'pin', 'zip', 'zip code', 'postal code'],
  notes: ['notes', 'note', 'remarks', 'remark', 'comment', 'comments', 'description'],
  status: ['status', 'customer status', 'stage'],
};

const HEADER_LOOKUP: Map<string, string> = buildHeaderLookup(CONTACT_HEADERS);

// Characters 3-12 of a GSTIN are the PAN, so a list that prints only the PAN
// still fills the field an invoice needs — but only in the right shape.
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
const PINCODE = /^[1-9]\d{5}$/;

// Customer.status is how the book is filtered later; a sheet word we do not
// recognise must not invent a fourth state, so it falls back to active.
const STATUS_WORDS: Record<string, string> = {
  active: 'active', customer: 'active', existing: 'active', open: 'active', approved: 'active',
  lead: 'lead', leads: 'lead', prospect: 'lead', new: 'lead', enquiry: 'lead', inquiry: 'lead', followup: 'lead', 'follow up': 'lead',
  inactive: 'inactive', dormant: 'inactive', closed: 'inactive', expired: 'inactive',
  blocked: 'blocked', blacklisted: 'blocked', hold: 'blocked',
};

const statusOf = (value: unknown): string => STATUS_WORDS[(cellText(value) ?? '').toLowerCase()] ?? 'active';

export type ContactRow = {
  /** 1-based sheet row, so a refusal can name the line the reader can see. */
  row: number;
  /** Best identity we have, for the import report. */
  name: string;
  draft: ContactDraft | null;
  /** Why this row cannot become a contact, or null when it can. */
  problem: string | null;
  warnings: string[];
  status: string;
};

/**
 * Reads a contact sheet into drafts. Rows carrying no heading we recognise are
 * skipped in silence — a spacer line or a totals line is not a failure and
 * must not fill the report with noise — while a row that says who it is but
 * cannot be saved says why.
 */
export function readContactRows(rows: SheetRow[]): ContactRow[] {
  const out: ContactRow[] = [];

  rows.forEach((raw, index) => {
    const rowNumber = index + 2; // the heading sits on row 1
    const cells = mapHeaders(raw, HEADER_LOOKUP);
    if (Object.keys(cells).length === 0) return;

    const { draft, warnings } = buildContactDraft({
      name: cellText(cells.name) ?? '',
      company: cellText(cells.company) ?? '',
      email: cellText(cells.email) ?? '',
      phone: cellText(cells.phone) ?? '',
      address: cellText(cells.address) ?? '',
      gstin: cellText(cells.gstin) ?? '',
    });

    if (!draft) {
      out.push({
        row: rowNumber,
        name: cellText(cells.company) ?? cellText(cells.email) ?? `Row ${rowNumber}`,
        draft: null,
        problem: 'No name, company or email on this row',
        warnings,
        status: statusOf(cells.status),
      });
      return;
    }

    // Only where the structured columns add something the card builder could
    // not know, and only when they validate: a wrong PAN in the books is
    // worse than a blank one.
    if (!draft.panNumber) {
      const pan = (cellText(cells.pan) ?? '').toUpperCase().replace(/\s+/g, '');
      if (PAN.test(pan)) draft.panNumber = pan;
      else if (pan) warnings.push(`PAN "${pan}" is not in the ABCDE1234F shape, so it was not saved.`);
    }

    const stateText = cellText(cells.state);
    if (!draft.state && stateText) {
      const code = codeForStateName(stateText);
      draft.state = (code && GST_STATE_CODES[code]) || stateText;
    }

    const pincode = (cellText(cells.pincode) ?? '').replace(/\s+/g, '');
    if (!draft.pincode && pincode) {
      if (PINCODE.test(pincode)) draft.pincode = pincode;
      else warnings.push(`Pin code "${pincode}" is not a 6-digit Indian pin code, so it was not saved.`);
    }

    const note = cellText(cells.notes);
    if (note) draft.notes = [draft.notes, note].filter(Boolean).join(' · ');

    out.push({
      row: rowNumber,
      name: draft.name,
      draft,
      problem: null,
      warnings,
      status: statusOf(cells.status),
    });
  });

  return out;
}
