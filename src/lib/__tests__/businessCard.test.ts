import { describe, expect, it } from 'vitest';
import {
  buildContactDraft,
  cleanGstin,
  duplicateCandidates,
  fillBlanks,
  normalisePhone,
} from '../finance/businessCard';

// A scanned card goes straight into the customer book, so the two things that
// matter are: never write a bad GSTIN into a record, and never damage a record
// the seller already has.

const CARD = {
  name: 'Rakesh Verma',
  designation: 'Purchase Manager',
  company: 'Verma Textiles Pvt Ltd',
  phone: '+91 98200 12345 / 22 4567 8901',
  email: 'rakesh@vermatextiles.in',
  website: 'https://vermatextiles.in/',
  address: 'Plot 14, MIDC Phase II, Andheri East, Mumbai 400093',
  gstin: '27AABCV5678K1Z3',
};

describe('normalisePhone', () => {
  it('reduces every formatting style to the ten digit number', () => {
    expect(normalisePhone('+91 98200 12345')).toBe('9820012345');
    expect(normalisePhone('098200-12345')).toBe('9820012345');
    expect(normalisePhone('9820012345')).toBe('9820012345');
  });

  it('leaves a landline alone rather than chopping it', () => {
    expect(normalisePhone('22 4567 8901')).toBe('2245678901');
  });
});

describe('cleanGstin', () => {
  it('keeps a well-formed GSTIN and upper-cases it', () => {
    expect(cleanGstin('27aabcv5678k1z3')).toBe('27AABCV5678K1Z3');
  });

  it('drops anything that is not a GSTIN, so a misread never reaches the record', () => {
    expect(cleanGstin('27AABCV5678K1Z')).toBe('');     // 14 characters
    expect(cleanGstin('GST 27AABCV5678K1Z3')).toBe(''); // label glued on
    expect(cleanGstin('88AABCV5678K1Z3')).toBe('');     // state code not in the table
    expect(cleanGstin('')).toBe('');
  });
});

describe('buildContactDraft', () => {
  it('maps a full card onto the customer fields it can fill', () => {
    const { draft, warnings } = buildContactDraft(CARD);
    expect(warnings).toEqual([]);
    expect(draft).toEqual({
      name: 'Rakesh Verma',
      email: 'rakesh@vermatextiles.in',
      phone: '+91 98200 12345',
      company: 'Verma Textiles Pvt Ltd',
      address: 'Plot 14, MIDC Phase II, Andheri East, Mumbai 400093',
      gstNumber: '27AABCV5678K1Z3',
      state: 'Maharashtra',
      pincode: '400093',
      notes: 'Designation: Purchase Manager · Website: vermatextiles.in · Other numbers: 22 4567 8901',
    });
  });

  it('refuses a card that yielded nothing a human would recognise', () => {
    const { draft, warnings } = buildContactDraft({ phone: '9820012345' });
    expect(draft).toBeNull();
    expect(warnings[0]).toMatch(/at least a name/);
  });

  it('falls back to the company, then the email handle, when no name is printed', () => {
    expect(buildContactDraft({ company: 'Sharma Provision' }).draft?.name).toBe('Sharma Provision');
    expect(buildContactDraft({ email: 'info@sharma.in' }).draft?.name).toBe('info');
  });

  it('saves no GSTIN but says so when the card number is unreadable', () => {
    const { draft, warnings } = buildContactDraft({ ...CARD, gstin: '27ABC' });
    expect(draft?.gstNumber).toBeNull();
    expect(draft?.state).toBeNull();
    expect(warnings.join(' ')).toMatch(/not a valid 15-character GSTIN/);
  });

  it('keeps a check-digit doubt rather than throwing the number away', () => {
    // The check character is advisory across the whole product, so a card whose
    // GSTIN differs only there still lands in the record.
    const { draft } = buildContactDraft({ ...CARD, gstin: '27AABCV5678K1Z9' });
    expect(draft?.gstNumber).toBe('27AABCV5678K1Z9');
  });

  it('ignores a pincode that is only part of a longer number', () => {
    const { draft } = buildContactDraft({ name: 'A', address: 'CIN U72900MH2010PTC123456' });
    expect(draft?.pincode).toBeNull();
  });
});

describe('fillBlanks', () => {
  const { draft } = buildContactDraft(CARD);

  it('never overwrites what the seller already typed', () => {
    const existing = { name: 'Rakesh Verma', phone: '9833300000', email: null, gstNumber: null };
    const patch = fillBlanks(existing, draft!);
    expect(patch.phone).toBeUndefined();
    expect(patch.email).toBe('rakesh@vermatextiles.in');
    expect(patch.gstNumber).toBe('27AABCV5678K1Z3');
  });

  it('returns nothing to write when the record already holds every field', () => {
    const complete = {
      name: draft!.name, email: draft!.email, phone: draft!.phone, company: draft!.company,
      address: draft!.address, gstNumber: draft!.gstNumber, state: draft!.state,
      pincode: draft!.pincode, notes: draft!.notes,
    };
    expect(fillBlanks(complete, draft!)).toEqual({});
  });

  it('treats an empty string as a gap worth filling', () => {
    expect(fillBlanks({ name: 'Rakesh Verma', email: '  ' }, draft!).email).toBe('rakesh@vermatextiles.in');
  });
});

describe('duplicateCandidates', () => {
  it('checks the strongest key first and skips keys the card did not carry', () => {
    const { draft } = buildContactDraft({ name: 'Sameer Khan', phone: '9811122233' });
    const keys = duplicateCandidates(draft!).map((w) => Object.keys(w).join('+'));
    expect(keys).toEqual(['phone']);
  });

  it('orders GSTIN before email before phone before name and company', () => {
    const { draft } = buildContactDraft(CARD);
    const keys = duplicateCandidates(draft!).map((w) => Object.keys(w).join('+'));
    expect(keys).toEqual(['gstNumber', 'email', 'phone', 'name+company']);
  });
});
