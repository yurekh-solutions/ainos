import { describe, expect, it } from 'vitest';
import {
  buildContactDraft,
  cleanGstin,
  duplicateCandidates,
  fillBlanks,
  normalisePhone,
  panFromGstin,
  summariseGstn,
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
      panNumber: 'AABCV5678K',
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

  it('saves no GSTIN and no PAN when the card number is unreadable', () => {
    const { draft, warnings } = buildContactDraft({ ...CARD, gstin: '27ABC' });
    expect(draft?.gstNumber).toBeNull();
    expect(draft?.panNumber).toBeNull();
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
      address: draft!.address, gstNumber: draft!.gstNumber, panNumber: draft!.panNumber,
      state: draft!.state,
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

// Characters 3-12 of a GSTIN are the holder's PAN, so the invoice field that
// asks for a PAN can be filled from the number the card already printed — but
// only off a GSTIN that survived validation, never off a second OCR guess.
describe('panFromGstin', () => {
  it('lifts the PAN out of a well-formed GSTIN', () => {
    expect(panFromGstin('27AABCV5678K1Z3')).toBe('AABCV5678K');
    expect(panFromGstin('27aabcv5678k1z3')).toBe('AABCV5678K');
  });

  it('returns null rather than a plausible-looking fragment', () => {
    expect(panFromGstin('')).toBeNull();
    expect(panFromGstin(null)).toBeNull();
    expect(panFromGstin('27AABCV5678K1Z')).toBeNull();    // 14 characters
    expect(panFromGstin('27ABCDEFGHK1Z34')).toBeNull();    // digits in the middle
    expect(panFromGstin('not a gstin at all')).toBeNull();
  });
});

// A GSTIN that passes the format check is only *shaped* like a real
// registration. What AINOS can say without touching GSTN is whether this
// account has ever seen the number on the portal, and a miss must never be
// dressed up as a pass.
describe('summariseGstn', () => {
  // A GSTIN published as valid by an independent validator. Deliberately not
  // minted through this repo's own check-character function: an invented number
  // fails its own check character, and that now gets flagged before GSTN is
  // even consulted, so the "unseen" cases below need a number that adds up.
  const GSTIN = '09AAAUP8175A1ZG';
  const row = (over: Record<string, unknown> = {}) => ({
    gstNumber: GSTIN,
    gstStatus: 'Active',
    fetchedAt: new Date('2026-09-14T10:00:00Z'),
    payload: { legalName: 'Verma Textiles Pvt Ltd', stateName: 'Rajasthan', pan: 'AAAUP8175A', ...over },
  });

  it('says there is nothing to check when the card gave no GSTIN', () => {
    const s = summariseGstn(null, null);
    expect(s.check).toBe('unchecked');
    expect(s.label).toBe('No GSTIN');
  });

  it('calls an unseen number unchecked, never verified', () => {
    const s = summariseGstn(GSTIN, null);
    expect(s.check).toBe('unchecked');
    expect(s.label).toBe('Not checked on GSTN');
    expect(s.detail).toMatch(/has not seen it on the portal yet/);
  });

  it('admits when the records themselves could not be read', () => {
    const s = summariseGstn(GSTIN, undefined);
    expect(s.check).toBe('unchecked');
    expect(s.detail).toMatch(/could not reach its GSTIN records/);
  });

  it('matches a cached record and names the business', () => {
    const s = summariseGstn(GSTIN, row());
    expect(s.check).toBe('verified');
    expect(s.label).toBe('Matches GSTN');
    expect(s.detail).toMatch(/Verma Textiles Pvt Ltd in Rajasthan/);
    expect(s.detail).toMatch(/checked 2026-09-14/);
  });

  it('still counts a bare cached number as seen, without inventing a name', () => {
    const s = summariseGstn(GSTIN, { gstNumber: GSTIN, gstStatus: null, payload: {} });
    expect(s.check).toBe('verified');
    expect(s.label).toBe('Seen on GSTN');
    expect(s.legalName).toBeNull();
  });

  it('flags a number this account has only ever seen under a different GSTIN', () => {
    // Same PAN, different number — a misread tail, a state change, or an old
    // registration that was replaced. Every format check passes on all three,
    // because the PAN is the middle ten characters of both numbers.
    const s = summariseGstn('29AABCV5678K1Z3', null, ['27AABCV5678K1Z3']);
    expect(s.check).toBe('attention');
    expect(s.label).toBe('GSTIN needs a look');
    expect(s.detail).toMatch(/same PAN on the portal as 27AABCV5678K1Z3, not 29AABCV5678K1Z3/);
  });

  it('catches a number that fails its own check character', () => {
    // Fifteen characters, every slot legal, and not anybody's GSTIN: the last
    // character is computed from the fourteen before it, so this is caught with
    // no portal call and no captcha. It outranks "never seen here" precisely
    // because it is a positive finding rather than the absence of one.
    const s = summariseGstn('09AAAUP8175A1ZQ', null);
    expect(s.check).toBe('attention');
    expect(s.label).toBe('GSTIN looks misread');
    expect(s.detail).toMatch(/does not add up against itself/);
  });

  it('believes the portal over its own arithmetic', () => {
    // A cached record is evidence the number is real, so a check-character
    // mismatch on top of that must not turn it into a warning.
    const s = summariseGstn('09AAAUP8175A1ZQ', { gstNumber: '09AAAUP8175A1ZQ', gstStatus: 'Active', payload: {} });
    expect(s.check).toBe('verified');
  });

  it('surfaces a cancelled registration instead of billing into it quietly', () => {
    const cancelled = summariseGstn(GSTIN, { gstNumber: GSTIN, gstStatus: 'Cancelled', payload: { pan: 'AABCV5678K' } });
    expect(cancelled.check).toBe('attention');
    expect(cancelled.label).toBe('GSTN: Cancelled');
    expect(cancelled.detail).toMatch(/do not give the buyer input credit/);

    // An "Active" row is the one status that must not raise a flag.
    expect(summariseGstn(GSTIN, row({ pan: 'AAAUP8175A' })).check).toBe('verified');
  });
});
