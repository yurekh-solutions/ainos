import { describe, expect, it } from 'vitest';
import { GST_STATE_CODES, UT_STATE_CODES } from '../finance/gst';

// The state code is the first two digits of every GSTIN, so this one table
// decides which state the filing pack, the e-way bill and the e-invoice
// adapter think a taxpayer is in. It was wrong for six codes — Maharashtra
// was listed under 26 (Dadra & Nagar Haveli) and Goa under 27 — and because
// the e-way-bill and e-invoice paths look a state *name* back up to its code,
// a mislabelled row is enough to send a consignment out under the wrong
// jurisdiction. These are the codes worth pinning to the CBIC table.

describe('GST_STATE_CODES', () => {
  it('maps the high-volume states to the codes printed on their GSTINs', () => {
    expect(GST_STATE_CODES['27']).toBe('Maharashtra');
    expect(GST_STATE_CODES['29']).toBe('Karnataka');
    expect(GST_STATE_CODES['07']).toBe('Delhi');
    expect(GST_STATE_CODES['09']).toBe('Uttar Pradesh');
    expect(GST_STATE_CODES['24']).toBe('Gujarat');
    expect(GST_STATE_CODES['33']).toBe('Tamil Nadu');
  });

  it('keeps Goa, Telangana and Andhra Pradesh on their own codes', () => {
    expect(GST_STATE_CODES['30']).toBe('Goa');
    expect(GST_STATE_CODES['36']).toBe('Telangana');
    expect(GST_STATE_CODES['37']).toBe('Andhra Pradesh');
    expect(GST_STATE_CODES['34']).toBe('Puducherry');
  });

  it('puts the merged union territory on 26, not on 25', () => {
    expect(GST_STATE_CODES['26']).toBe('Dadra & Nagar Haveli and Daman & Diu');
    expect(GST_STATE_CODES['25']).toContain('old');
  });

  it('never lists one name twice, so name-to-code lookups are unambiguous', () => {
    const names = Object.values(GST_STATE_CODES).map((n) => n.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('still recognises every code it recognised before, keys included', () => {
    // isKnownStateCode works off the keys: dropping one would start rejecting
    // real GSTINs, which is exactly the kind of regression this table caused
    // once already.
    for (const code of ['01', '04', '11', '22', '25', '28', '30', '31', '38', '99']) {
      expect(GST_STATE_CODES[code]).toBeTruthy();
    }
  });

  it('lists the union territories that file UTGST', () => {
    expect(UT_STATE_CODES.has('04')).toBe(true);   // Chandigarh
    expect(UT_STATE_CODES.has('31')).toBe(true);
    expect(UT_STATE_CODES.has('35')).toBe(true);   // Andaman & Nicobar
    expect(UT_STATE_CODES.has('38')).toBe(true);
    expect(UT_STATE_CODES.has('07')).toBe(false);  // Delhi is a state for GST
    expect(UT_STATE_CODES.has('27')).toBe(false);
  });
});
