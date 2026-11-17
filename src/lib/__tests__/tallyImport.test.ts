import { describe, expect, it } from 'vitest';
import {
  normalizeRow, parseSheetNumber, parseSheetDate, groupVouchers, priceVoucher, voucherProblem,
} from '../finance/tallyImport';

// An accountant's old books arrive as whatever their Tally export produced, and
// every one of those files used to fail in a different quiet way: a date cell
// read as the number 46037, a header called "Particulars" instead of "Item",
// ₹1,23,456 with the symbol in it, one bill spread over three lines. These are
// the shapes the importer has to survive, and the GST heads it has to land in
// once they are read.

const MH_CO = { gstNumber: '27AAACS1234A1Z5', state: 'Maharashtra' };
const MH_BUYER = '27ABCDE1234F1Z5';
const DELHI_BUYER = '07ABCDE1234F1Z5';

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

describe('normalizeRow', () => {
  it('folds Tally header spellings onto one canonical key', () => {
    const row = normalizeRow({
      'Voucher No': 'INV-9', 'Particulars': 'Consulting', 'Ledger Name': 'Delhi Corp',
      'GSTIN No': '07ABCDE1234F1Z5', 'GST % Of Value': 18, 'HSN/SAC': '9983',
    });
    expect(row.voucherNumber).toBe('INV-9');
    expect(row.item).toBe('Consulting');
    expect(row.partyName).toBe('Delhi Corp');
    expect(row.partyGst).toBe('07ABCDE1234F1Z5');
    expect(row.gstRate).toBe(18);
    expect(row.hsn).toBe('9983');
  });

  it('drops columns it does not understand and empty cells', () => {
    const row = normalizeRow({ 'Narration For This Voucher': 'x', 'Party Name': '  ', 'Date': '2026-01-15' });
    expect(row.partyName).toBeUndefined();
    expect(row.date).toBe('2026-01-15');
    expect(Object.keys(row)).toEqual(['date']);
  });
});

describe('parseSheetNumber', () => {
  it('reads money the way a sheet writes it', () => {
    expect(parseSheetNumber('₹1,23,456.00')).toBe(123456);
    expect(parseSheetNumber('Rs. 50000')).toBe(50000);
    expect(parseSheetNumber(' 40,000 ')).toBe(40000);
    expect(parseSheetNumber(2500)).toBe(2500);
    expect(parseSheetNumber('0')).toBe(0);
  });

  it('refuses to invent a number out of text', () => {
    expect(parseSheetNumber('as discussed')).toBeNull();
    expect(parseSheetNumber('')).toBeNull();
    expect(parseSheetNumber(null)).toBeNull();
  });
});

describe('parseSheetDate', () => {
  it('reads a real date cell, an Excel serial and the hand-typed Indian forms', () => {
    expect(day(parseSheetDate(new Date(Date.UTC(2026, 0, 15))))).toBe('2026-01-15');
    expect(day(parseSheetDate(46037))).toBe('2026-01-15');
    expect(day(parseSheetDate('15-01-2026'))).toBe('2026-01-15');
    expect(day(parseSheetDate('15/1/2026'))).toBe('2026-01-15');
    expect(day(parseSheetDate('1/15/26'))).toBe('2026-01-15');
    expect(day(parseSheetDate('2026-01-15'))).toBe('2026-01-15');
    expect(day(parseSheetDate('15-Jan-2026'))).toBe('2026-01-15');
  });

  it('returns null rather than an Invalid Date that would kill the row', () => {
    expect(parseSheetDate('not a date')).toBeNull();
    expect(parseSheetDate('31-02-2026')).toBeNull();
    expect(parseSheetDate('')).toBeNull();
  });
});

describe('groupVouchers', () => {
  const line = (row: Record<string, unknown>) => normalizeRow(row);

  it('puts several sheet lines of one voucher number into one bill', () => {
    const vouchers = groupVouchers([
      line({ 'Voucher No': 'INV-1', Date: '15-01-2026', 'Party Name': 'Rajesh Enterprises', Item: 'Design', Qty: 1, Rate: 50000, 'GST%': 18 }),
      line({ 'Voucher No': 'INV-1', Item: 'Maintenance', Qty: 12, Rate: 2500, 'GST%': 18 }),
      line({ 'Voucher No': 'INV-2', Date: '02-02-2026', 'Party Name': 'Delhi Traders', Item: 'Consulting', Qty: 1, Rate: 40000, 'GST%': 18 }),
    ]);
    expect(vouchers.length).toBe(2);
    expect(vouchers[0].items.length).toBe(2);
    expect(vouchers[0].rows).toEqual([2, 3]);
    // The second line carried no date or party; it inherits them from the first.
    expect(day(vouchers[0].date)).toBe('2026-01-15');
    expect(vouchers[1].items.length).toBe(1);
  });

  it('continues a bill when the voucher number is left blank but the party repeats', () => {
    const vouchers = groupVouchers([
      line({ 'Voucher No': 'INV-1', 'Party Name': 'Rajesh', Item: 'A', Qty: 1, Rate: 100, 'GST%': 18 }),
      line({ 'Party Name': 'rajesh', Item: 'B', Qty: 1, Rate: 200, 'GST%': 18 }),
      line({ 'Party Name': 'Someone Else', Item: 'C', Qty: 1, Rate: 300, 'GST%': 18 }),
    ]);
    expect(vouchers.length).toBe(2);
    expect(vouchers[0].items.map((i) => i.name)).toEqual(['A', 'B']);
  });

  it('backs the tax out of a tax-inclusive amount when there is no rate', () => {
    const vouchers = groupVouchers([
      line({ 'Party Name': 'Rajesh', Item: 'Design', 'Grand Total': 59000, 'GST%': 18 }),
    ]);
    const it = vouchers[0].items[0];
    expect(it.taxableValue).toBe(50000);
    expect(it.taxAmount).toBe(9000);
  });

  it('treats Tally\'s per-line Amount as the taxable value, not as a grand total', () => {
    const vouchers = groupVouchers([
      line({ 'Party Name': 'Rajesh', Item: 'Design', Qty: 2, Rate: 25000, Amount: 50000, 'GST%': 18 }),
    ]);
    const pricing = priceVoucher(vouchers[0], MH_CO);
    expect(pricing.subtotal).toBe(50000);
    expect(pricing.totalAmount).toBe(59000);
    // A line Amount of 50000 is smaller than the bill, so it is not flagged as
    // a disagreeing grand total.
    expect(pricing.warnings.filter((w) => /does not match/.test(w))).toEqual([]);
  });
});

describe('priceVoucher', () => {
  const voucher = (partyGst: string | null) =>
    groupVouchers([normalizeRow({
      'Party Name': 'Buyer', 'Party GSTIN': partyGst, Item: 'Goods', Qty: 1, Rate: 10000, 'GST%': 18,
    })])[0];

  it('splits a same-state bill into CGST + SGST', () => {
    const p = priceVoucher(voucher(MH_BUYER), MH_CO);
    expect(p.supplyType).toBe('intra');
    expect(p.placeOfSupply).toBe('27');
    expect(p.cgst).toBe(900);
    expect(p.sgst).toBe(900);
    expect(p.igst).toBe(0);
    expect(p.warnings).toEqual([]);
  });

  it('books a Delhi buyer entirely on IGST', () => {
    const p = priceVoucher(voucher(DELHI_BUYER), MH_CO);
    expect(p.supplyType).toBe('inter');
    expect(p.igst).toBe(1800);
    expect(p.cgst).toBe(0);
    expect(p.sgst).toBe(0);
  });

  it('uses UTGST for a Chandigarh seller billing in Chandigarh', () => {
    const p = priceVoucher(
      groupVouchers([normalizeRow({
        'Party Name': 'Chd Buyer', 'Party GSTIN': '04AABCT9999K1ZP', Item: 'Goods', Qty: 1, Rate: 10000, 'GST%': 18,
      })])[0],
      { gstNumber: '04AABCS1234A1Z5', state: 'Chandigarh' },
    );
    expect(p.supplyType).toBe('intra');
    expect(p.cgst).toBe(900);
    expect(p.utgst).toBe(900);
    expect(p.sgst).toBe(0);
  });

  it('reads place of supply off the state column when the buyer has no GSTIN', () => {
    const v = groupVouchers([normalizeRow({
      'Party Name': 'Unregistered', 'Place of Supply': 'Delhi', Item: 'Goods', Qty: 1, Rate: 10000, 'GST%': 5,
    })])[0];
    const p = priceVoucher(v, MH_CO);
    expect(p.placeOfSupply).toBe('07');
    expect(p.supplyType).toBe('inter');
    expect(p.igst).toBe(500);
  });

  it('says so when the seller has no GSTIN and the split can only be guessed', () => {
    const p = priceVoucher(voucher(DELHI_BUYER), { gstNumber: null, state: null });
    expect(p.supplyType).toBe('intra');
    expect(p.warnings.join(' ')).toMatch(/Add your own GSTIN under Company details/);
  });

  it('flags a GSTIN that cannot be real instead of trusting it', () => {
    const p = priceVoucher(voucher('27AAA'), MH_CO);
    expect(p.warnings.join(' ')).toMatch(/not a valid 15-character GSTIN/);
  });

  it('keeps the line items over a sheet total that disagrees', () => {
    const v = groupVouchers([normalizeRow({
      'Party Name': 'Buyer', 'Party GSTIN': MH_BUYER, Item: 'Goods', Qty: 1, Rate: 10000, 'GST%': 18, 'Grand Total': 70000,
    })])[0];
    const p = priceVoucher(v, MH_CO);
    expect(p.totalAmount).toBe(11800);
    expect(p.warnings.join(' ')).toMatch(/does not match ₹11,800 from the line items/);
  });
});

describe('voucherProblem', () => {
  it('names the rows that cannot become a bill', () => {
    // Separate voucher numbers, otherwise these three lines would be read as
    // three items of one bill rather than three broken bills.
    const [noParty, noMoney, badDate] = groupVouchers([
      normalizeRow({ 'Voucher No': 'P1', Item: 'Goods', Qty: 1, Rate: 100 }),
      normalizeRow({ 'Voucher No': 'P2', 'Party Name': 'Rajesh', Item: 'Goods' }),
      normalizeRow({ 'Voucher No': 'P3', 'Party Name': 'Rajesh', Item: 'Goods', Qty: 1, Rate: 100, Date: 'under discussion' }),
    ]);
    expect(voucherProblem(noParty)).toMatch(/Party name is empty/);
    expect(voucherProblem(noMoney)).toMatch(/No item with a rate/);
    expect(voucherProblem(badDate)).toMatch(/Date "under discussion" is not readable/);
  });

  it('accepts a plain readable line', () => {
    const [ok] = groupVouchers([normalizeRow({
      'Party Name': 'Rajesh', Date: '15-01-2026', Item: 'Goods', Qty: 1, Rate: 100, 'GST%': 18,
    })]);
    expect(voucherProblem(ok)).toBeNull();
  });
});
