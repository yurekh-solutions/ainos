import { describe, expect, it } from 'vitest';
import { readContactRows } from '../finance/customerImport';

// A customer list is whatever the office already keeps: a CRM export, a sheet
// a salesman typed, a download from a phone. What it must not be is a fifth
// way of storing contacts, so every row here has to come out shaped exactly
// like a scanned business card.

describe('reading a contact sheet', () => {
  it('turns a plain list into contact drafts', () => {
    const [row] = readContactRows([
      { Name: 'Anita Rao', Email: 'Anita@Rao.in', Phone: '9845011223', Company: 'Rao Textiles' },
    ]);

    expect(row.row).toBe(2); // the heading is row 1, so the first contact is row 2
    expect(row.problem).toBeNull();
    expect(row.draft).toMatchObject({
      name: 'Anita Rao',
      email: 'anita@rao.in',
      phone: '9845011223',
      company: 'Rao Textiles',
    });
  });

  it('recognises the headings an office actually types', () => {
    const [row] = readContactRows([{
      'Customer Name': 'Rakesh Menon',
      'Mobile No': '+91 98450 11223',
      'E-Mail': 'rakesh@menon.co',
      'GST No': '29AABCS1234F1Z5',
      'Remarks': 'Met at the Bengaluru expo',
    }]);

    expect(row.problem).toBeNull();
    expect(row.draft?.name).toBe('Rakesh Menon');
    expect(row.draft?.phone).toBe('+91 98450 11223');
    expect(row.draft?.email).toBe('rakesh@menon.co');
    // The GSTIN carries both the state and the PAN, so nothing has to be asked.
    expect(row.draft?.state).toBe('Karnataka');
    expect(row.draft?.panNumber).toBe('AABCS1234F');
    expect(row.draft?.notes).toContain('Met at the Bengaluru expo');
  });

  it('uses the firm as the name when the list holds only firms', () => {
    const [row] = readContactRows([{ Company: 'Sharma Provision', Phone: '9811122334' }]);
    expect(row.draft?.name).toBe('Sharma Provision');
  });

  it('uses the email handle as a last resort', () => {
    const [row] = readContactRows([{ Email: 'info@sharma.in' }]);
    expect(row.draft?.name).toBe('info');
  });

  it('names the row it cannot identify instead of dropping it quietly', () => {
    const [row] = readContactRows([{ Phone: '9820012345' }]);
    expect(row.draft).toBeNull();
    expect(row.problem).toMatch(/No name, company or email/);
  });

  it('ignores spacer and totals lines without calling them failures', () => {
    expect(readContactRows([{ Total: 42 }, {}, { Sr: 1, Particulars: 'nothing we know' }])).toHaveLength(0);
  });

  it('keeps the sheet value for state when no GSTIN decides it', () => {
    const [row] = readContactRows([{ Name: 'Delhi Buyer', State: 'Delhi' }]);
    expect(row.draft?.state).toBe('Delhi');
  });

  it('keeps a PAN that stands on its own, and refuses a malformed one', () => {
    const [good, bad] = readContactRows([
      { Name: 'Pan Only', PAN: 'aabcu9603r' },
      { Name: 'Bad Pan', PAN: 'ABC123' },
    ]);
    expect(good.draft?.panNumber).toBe('AABCU9603R');
    expect(bad.draft?.panNumber).toBeNull();
    expect(bad.warnings.join(' ')).toMatch(/not in the ABCDE1234F shape/);
  });

  it('keeps a six-digit pin code and warns about anything else', () => {
    const [good, bad] = readContactRows([
      { Name: 'Pinned', Pincode: '400 050' },
      { Name: 'Unpinned', Pincode: '40' },
    ]);
    expect(good.draft?.pincode).toBe('400050');
    expect(bad.draft?.pincode).toBeNull();
    expect(bad.warnings.join(' ')).toMatch(/6-digit Indian pin code/);
  });

  it('maps the words people use for a stage onto the three the book knows', () => {
    const rows = readContactRows([
      { Name: 'A', Status: 'Prospect' },
      { Name: 'B', Status: 'Dormant' },
      { Name: 'C', Status: 'someone wrote this here' },
      { Name: 'D' },
    ]);
    expect(rows.map((r) => r.status)).toEqual(['lead', 'inactive', 'active', 'active']);
  });

  it('saves the contact but says the email looked wrong', () => {
    const [row] = readContactRows([{ Name: 'No Mail', Email: 'not-an-email' }]);
    expect(row.draft?.name).toBe('No Mail');
    expect(row.draft?.email).toBeNull();
    expect(row.warnings.join(' ')).toMatch(/email did not look valid/);
  });

  it('numbers every row the way the spreadsheet numbers them', () => {
    const rows = readContactRows([
      { Name: 'First' },
      { Name: 'Second' },
      { Name: 'Third' },
    ]);
    expect(rows.map((r) => r.row)).toEqual([2, 3, 4]);
  });
});
