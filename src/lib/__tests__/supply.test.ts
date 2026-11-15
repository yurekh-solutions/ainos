import { describe, expect, it } from 'vitest';
import { codeForStateName, decideSupply } from '../finance/supply';
import { computeGstSplit } from '../finance/gst';

// Whether a bill is intra-state or inter-state decides which tax head every
// rupee lands in, and the invoice form used to answer it with a hardcoded
// "intra" default that then overrode the correct rule sitting in the API. These
// are the comparisons that have to keep working off the numbers people already
// typed, including the union territories where the state half is UTGST.

const MH = '27AABCV5678K1Z3';        // Maharashtra seller
const KA = '29AABCS1234F1Z5';        // Karnataka buyer
const CHD = '04AABCT9999K1ZP';       // Chandigarh
const PY = '34AABCE7777L1ZQ';        // Puducherry
const DNH = '26AABCM4444F1ZR';       // Dadra & Nagar Haveli and Daman & Diu

describe('decideSupply', () => {
  it('calls a Maharashtra-to-Karnataka bill inter-state on IGST', () => {
    const d = decideSupply({ companyGst: MH, customerGst: KA });
    expect(d.supplyType).toBe('inter');
    expect(d.decided).toBe(true);
    expect(d.basis).toBe('gstin');
    expect(d.sellerCode).toBe('27');
    expect(d.posCode).toBe('29');
    expect(d.note).toMatch(/inter-state bill — full IGST/);
    expect(d.note).toMatch(/Maharashtra \(27\)/);
    expect(d.note).toMatch(/Karnataka \(29\)/);
  });

  it('calls a same-state bill intra-state on CGST + SGST', () => {
    const d = decideSupply({ companyGst: MH, customerGst: '27AABCV1111K1Z5' });
    expect(d.supplyType).toBe('intra');
    expect(d.sellerIsUt).toBe(false);
    expect(d.note).toMatch(/CGST \+ SGST/);
  });

  it('names UTGST for a union territory selling within it', () => {
    for (const gst of [CHD, PY, DNH]) {
      const d = decideSupply({ companyGst: gst, customerGst: gst });
      expect(d.supplyType).toBe('intra');
      expect(d.sellerIsUt).toBe(true);
      expect(d.note).toMatch(/Union Territory — intra-state tax here is CGST \+ UTGST/);
    }
  });

  it('splits the tax so a UT seller pays CGST + UTGST, not CGST + SGST', () => {
    const ut = computeGstSplit(100000, 18, { supplyType: 'intra', sellerStateCode: '34' });
    expect(ut).toEqual({ cgst: 9000, sgst: 0, utgst: 9000, igst: 0, total: 18000 });

    const state = computeGstSplit(100000, 18, { supplyType: 'intra', sellerStateCode: '27' });
    expect(state).toEqual({ cgst: 9000, sgst: 9000, utgst: 0, igst: 0, total: 18000 });

    // A UT seller billing another state still charges IGST, UT or not.
    const inter = computeGstSplit(100000, 18, { supplyType: 'inter', sellerStateCode: '04' });
    expect(inter.igst).toBe(18000);
    expect(inter.utgst).toBe(0);
  });

  it('falls back to the state names when nobody typed a GSTIN', () => {
    const d = decideSupply({ companyState: 'Maharashtra', customerState: 'Karnataka' });
    expect(d.supplyType).toBe('inter');
    expect(d.basis).toBe('state-name');
    expect(d.note).toMatch(/your state and the customer's state came from a state name/);
  });

  it('says which side was a spelling when only one side had a GSTIN', () => {
    const d = decideSupply({ companyGst: MH, customerState: 'Karnataka' });
    expect(d.basis).toBe('state-name');
    expect(d.note).toMatch(/the customer's state came from a state name/);
    expect(d.note).not.toMatch(/your state .* came from a state name/);
  });

  it('mixes a GSTIN on one side with a typed state on the other', () => {
    const d = decideSupply({ companyGst: MH, customerState: 'Chandigarh' });
    expect(d.supplyType).toBe('inter');
    expect(d.posCode).toBe('04');
    // The seller is in a state, so UTGST never applies even though the buyer is
    // in a union territory — place of supply decides IGST, not the UT list.
    expect(d.sellerIsUt).toBe(false);
  });

  it('trusts an explicit place of supply over the buyer GSTIN', () => {
    const d = decideSupply({ companyGst: MH, customerGst: '27AABCV1111K1Z5', placeOfSupply: '29' });
    expect(d.basis).toBe('place-of-supply');
    expect(d.supplyType).toBe('inter');
  });

  it('refuses to invent a split when there is nothing to compare', () => {
    const d = decideSupply({ companyGst: MH });
    expect(d.decided).toBe(false);
    expect(d.supplyType).toBe('intra');
    expect(d.basis).toBe('none');
    expect(d.note).toMatch(/Add the customer's GSTIN or state/);

    const neither = decideSupply({});
    expect(neither.decided).toBe(false);
    expect(neither.note).toMatch(/Add your GSTIN and the customer's GSTIN or state/);
  });

  it('ignores a state code that CBIC never published', () => {
    // 88 is not in the table, so it must not be treated as evidence of anything.
    const d = decideSupply({ companyGst: MH, customerGst: '88AABCV1111K1Z5' });
    expect(d.decided).toBe(false);
    expect(d.posCode).toBeNull();
  });
});

describe('codeForStateName', () => {
  it('resolves the everyday spellings', () => {
    expect(codeForStateName('Maharashtra')).toBe('27');
    expect(codeForStateName('maharashtra')).toBe('27');
    expect(codeForStateName('  Tamil Nadu  ')).toBe('33');
    expect(codeForStateName('Telangana')).toBe('36');
  });

  it('accepts a bare code typed into a text field', () => {
    expect(codeForStateName('27')).toBe('27');
  });

  it('gives current Andhra Pradesh 37 and never the legacy 28', () => {
    expect(codeForStateName('Andhra Pradesh')).toBe('37');
    expect(codeForStateName('Andhra Pradesh (old)')).toBe('37');
  });

  it('copes with the merged territory spelled either way', () => {
    expect(codeForStateName('Dadra & Nagar Haveli and Daman & Diu')).toBe('26');
    expect(codeForStateName('Dadra and Nagar Haveli, Daman and Diu')).toBe('26');
  });

  it('returns null for anything it cannot place', () => {
    expect(codeForStateName('')).toBeNull();
    expect(codeForStateName(null)).toBeNull();
    expect(codeForStateName('Somewhere Else')).toBeNull();
    expect(codeForStateName('99')).toBe('99');   // Other Territory is a real code
  });
});
