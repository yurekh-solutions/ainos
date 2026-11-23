import { describe, it, expect } from 'vitest';
import {
  buildUpiUri, isValidVpa, manualPayInstructions, upiAmount, UPI_SOFT_LIMIT,
} from '@/lib/upi';
import { amountDue, readPaymentLink } from '@/lib/payment-links';

// These are the rules that decide whether a customer's money reaches the right
// bank account, so every case below mirrors a real failure mode seen in UPI
// apps: a mistyped handle, an amount that gets clipped, or a field that breaks
// the request string.

describe('isValidVpa', () => {
  it('accepts ordinary handles', () => {
    expect(isValidVpa('businessname@okhdfcbank')).toBe(true);
    expect(isValidVpa('raj.enterprises@ybl')).toBe(true);
    expect(isValidVpa('9876543210@paytm')).toBe(true);
    expect(isValidVpa('  skymultimedia@upi  ')).toBe(true);
  });

  it('rejects anything that would send money to the wrong place', () => {
    expect(isValidVpa('')).toBe(false);
    expect(isValidVpa('businessname')).toBe(false);
    expect(isValidVpa('businessname@')).toBe(false);
    expect(isValidVpa('@okhdfcbank')).toBe(false);
    expect(isValidVpa('business@12345')).toBe(false);
    expect(isValidVpa('business name@okhdfcbank')).toBe(false);
    expect(isValidVpa('business@ok hdfcbank')).toBe(false);
    expect(isValidVpa(null)).toBe(false);
    expect(isValidVpa(undefined)).toBe(false);
  });
});

describe('upiAmount', () => {
  it('keeps two decimals and rounds the way a bank does', () => {
    expect(upiAmount(1234.567)).toBe(1234.57);
    expect(upiAmount(1234.564)).toBe(1234.56);
    expect(upiAmount('25000')).toBe(25000);
  });

  it('turns junk and non-positive values into zero instead of NaN', () => {
    expect(upiAmount(0)).toBe(0);
    expect(upiAmount(-500)).toBe(0);
    expect(upiAmount('abc')).toBe(0);
    expect(upiAmount(null)).toBe(0);
    expect(upiAmount(undefined)).toBe(0);
    expect(upiAmount(Number.NaN)).toBe(0);
  });
});

describe('buildUpiUri', () => {
  const base = {
    payeeVpa: 'skymultimedia@okhdfcbank',
    payeeName: 'SKY. VISION & MULTIMEDIA',
    amount: 18450,
    transactionRef: 'INV-2026-007',
    note: 'Invoice payment',
  };

  it('builds the NPCI request string any UPI app understands', () => {
    const uri = buildUpiUri(base);
    expect(uri.startsWith('upi://pay?')).toBe(true);
    expect(uri).toContain('pa=skymultimedia%40okhdfcbank');
    expect(uri).toContain('am=18450.00');
    expect(uri).toContain('tr=INV-2026-007');
    expect(uri.endsWith('cu=INR')).toBe(true);
  });

  it('refuses an unknown or malformed payee handle', () => {
    expect(() => buildUpiUri({ ...base, payeeVpa: 'skymultimedia' })).toThrow(/UPI id/i);
    expect(() => buildUpiUri({ ...base, payeeVpa: '' })).toThrow(/UPI id/i);
  });

  it('refuses an amount that is not payable', () => {
    expect(() => buildUpiUri({ ...base, amount: 0 })).toThrow(/greater than zero/i);
    expect(() => buildUpiUri({ ...base, amount: -1 })).toThrow(/greater than zero/i);
    expect(() => buildUpiUri({ ...base, amount: 1_00_00_00_000 })).toThrow(/too large/i);
  });

  it('never lets a business name inject extra parameters', () => {
    const uri = buildUpiUri({
      ...base,
      payeeName: 'Fake Shop&am=1&tn=hack@evil#upi',
    });
    // One amount parameter, one currency parameter, and the injected text stays
    // inside pn= as escaped data rather than becoming its own field.
    expect(uri.match(/&am=/g)?.length).toBe(1);
    expect(uri.match(/cu=/g)?.length).toBe(1);
    expect(uri.match(/pn=/g)?.length).toBe(1);
    expect(uri).not.toContain('tn=hack');
    const pn = new URLSearchParams(uri.split('?')[1]).get('pn');
    expect(pn).toBe('Fake Shop am 1 tn hack@evil upi');
  });

  it('sanitises a reference the way a bank parser expects', () => {
    const uri = buildUpiUri({ ...base, transactionRef: 'INV/2026 #07 & extra' });
    const tr = new URLSearchParams(uri.split('?')[1]).get('tr');
    expect(tr).toBe('INV202607extra');
  });

  it('drops an empty reference and note instead of sending blank fields', () => {
    const uri = buildUpiUri({ ...base, transactionRef: '   ', note: '' });
    expect(uri).not.toContain('tr=');
    expect(uri).not.toContain('tn=');
  });

  it('falls back to a neutral payee label when no name is stored', () => {
    const uri = buildUpiUri({ ...base, payeeName: '   ' });
    expect(new URLSearchParams(uri.split('?')[1]).get('pn')).toBe('Business');
  });
});

describe('manualPayInstructions', () => {
  it('prints the same numbers a payer would type by hand', () => {
    const lines = manualPayInstructions({
      payeeVpa: 'skymultimedia@okhdfcbank',
      payeeName: 'SKY VISION',
      amount: 123456,
      transactionRef: 'INV-2026-007',
    });
    expect(lines.vpa).toBe('skymultimedia@okhdfcbank');
    expect(lines.amount).toBe('₹1,23,456.00');
    expect(lines.ref).toBe('INV-2026-007');
  });

  it('warns above the limit most banks cap a single pay at', () => {
    expect(UPI_SOFT_LIMIT).toBe(100_000);
  });
});

describe('amountDue', () => {
  it('subtracts what has already been recorded', () => {
    expect(amountDue({ totalAmount: 50_000, paidAmount: 20_000 })).toBe(30_000);
    expect(amountDue({ total: 10_000, paidAmount: 10_000 })).toBe(0);
  });

  it('prefers totalAmount, which is what the rest of Finance reads', () => {
    expect(amountDue({ total: 1000, totalAmount: 9_000, paidAmount: 0 })).toBe(9_000);
  });

  it('never returns a negative balance or a rounding tail', () => {
    expect(amountDue({ totalAmount: 1_000, paidAmount: 1_500 })).toBe(0);
    expect(amountDue({ totalAmount: 0.1 + 0.2, paidAmount: 0 })).toBe(0.3);
    expect(amountDue({})).toBe(0);
  });
});

describe('readPaymentLink token guard', () => {
  it('rejects a malformed token before asking the database anything', async () => {
    // No query can run here: these inputs never reach Prisma, so a probe or a
    // path traversal attempt gets the same answer as a wrong token.
    await expect(readPaymentLink('short')).resolves.toBeNull();
    await expect(readPaymentLink('../../etc/passwd')).resolves.toBeNull();
    await expect(readPaymentLink('')).resolves.toBeNull();
    await expect(readPaymentLink('   ')).resolves.toBeNull();
    await expect(readPaymentLink('x'.repeat(200))).resolves.toBeNull();
  });
});
