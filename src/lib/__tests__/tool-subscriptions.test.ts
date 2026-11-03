import { describe, it, expect } from 'vitest';
import {
  TOOL_OFFERINGS,
  TOOL_EDITIONS,
  toolMonthlyInr,
  toolPriceMinor,
  normSeats,
  MAX_TOOL_SEATS,
} from '@/lib/tool-subscriptions';

const invoices = TOOL_OFFERINGS.find((o) => o.key === '/invoices')!; // base 799
const PREMIUM = TOOL_EDITIONS.find((e) => e.name === 'Premium')!;     // multiplier 2.5

describe('normSeats', () => {
  it('floors, clamps to >=1 and <= MAX_TOOL_SEATS, and defaults bad input to 1', () => {
    expect(normSeats(undefined)).toBe(1);
    expect(normSeats(3.9)).toBe(3);
    expect(normSeats(0)).toBe(1);
    expect(normSeats(-5)).toBe(1);
    expect(normSeats(Number.NaN)).toBe(1);
    expect(normSeats(MAX_TOOL_SEATS + 1)).toBe(MAX_TOOL_SEATS);
    expect(normSeats(5000)).toBe(MAX_TOOL_SEATS);
  });
});

describe('toolMonthlyInr — per-seat scaling', () => {
  it('standard = base × 1 × seats', () => {
    expect(toolMonthlyInr(invoices, 2, 1)).toBe(799);
    expect(toolMonthlyInr(invoices, 2, 5)).toBe(3995); // 5 seats → the checkout case
  });
  it('premium applies the 2.5× edition multiplier before seats', () => {
    expect(toolMonthlyInr(invoices, PREMIUM.level, 1)).toBe(Math.round(799 * 2.5));
    expect(toolMonthlyInr(invoices, PREMIUM.level, 3)).toBe(Math.round(799 * 2.5 * 3));
  });
  it('seats defaults to 1 when omitted', () => {
    expect(toolMonthlyInr(invoices, 2)).toBe(799);
  });
});

describe('toolPriceMinor — paise + annual (10 months charged)', () => {
  it('monthly standard is base × 100', () => {
    expect(toolPriceMinor(invoices, 2, 'monthly', 1)).toBe(79900);
  });
  it('annual charges 10 months (2 free)', () => {
    expect(toolPriceMinor(invoices, 2, 'annual', 1)).toBe(799 * 10 * 100);
  });
  it('annual scales with seats too', () => {
    expect(toolPriceMinor(invoices, 2, 'annual', 5)).toBe(799 * 5 * 10 * 100);
  });
  it('premium annual combines edition multiplier, seats and 10-month charge', () => {
    const monthly = Math.round(799 * 2.5 * 3);
    expect(toolPriceMinor(invoices, PREMIUM.level, 'annual', 3)).toBe(monthly * 10 * 100);
  });
});
