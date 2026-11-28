import { describe, it, expect } from 'vitest';
import { hasLiveAccess, ONE_BUNDLE, APPS, ALL_APP_KEYS, priceForSelection } from '@/lib/billing';

// The rule that decides whether asking to buy can switch a customer off. Every
// case here is a state a real row can be in; the pending/expired ones are the
// ones where /api/billing is allowed to change the status, and the live ones are
// the ones where it must not.

const NOW = new Date('2026-11-23T12:00:00.000Z');
const future = new Date('2026-12-05T12:00:00.000Z');
const past = new Date('2026-11-01T12:00:00.000Z');

const row = (status: string, over: Partial<{ trialEndsAt: Date | null; currentPeriodEnd: Date | null }> = {}) => ({
  status, trialEndsAt: null, currentPeriodEnd: null, ...over,
});

describe('hasLiveAccess', () => {
  it('keeps a trial that has not run out', () => {
    expect(hasLiveAccess(row('trialing', { trialEndsAt: future }), NOW)).toBe(true);
  });

  it('gives up on a trial the moment it runs out', () => {
    expect(hasLiveAccess(row('trialing', { trialEndsAt: past }), NOW)).toBe(false);
    expect(hasLiveAccess(row('trialing'), NOW)).toBe(false);
  });

  it('honours a paid period that has not run out', () => {
    expect(hasLiveAccess(row('active', { currentPeriodEnd: future }), NOW)).toBe(true);
  });

  it('treats every unpaid or ended state as no access', () => {
    for (const status of ['pending', 'expired', 'cancelled', 'past_due', '']) {
      expect(hasLiveAccess(row(status, { trialEndsAt: future, currentPeriodEnd: future }), NOW)).toBe(false);
    }
  });

  it('answers false rather than throwing when there is no subscription at all', () => {
    expect(hasLiveAccess(null, NOW)).toBe(false);
  });
});

describe('the rupee price sheet', () => {
  it('prices AINOS One as one company price, below the sum of its apps', () => {
    const separate = priceForSelection({ apps: ALL_APP_KEYS });
    expect(ONE_BUNDLE.priceInr).toBeLessThan(separate);
    expect(priceForSelection({ plan: 'one' })).toBe(ONE_BUNDLE.priceInr);
  });

  it('charges every app it sells, so a selection never totals zero', () => {
    for (const key of ALL_APP_KEYS) {
      expect(APPS[key].priceInr).toBeGreaterThan(0);
      expect(priceForSelection({ apps: [key] })).toBe(APPS[key].priceInr);
    }
  });

  it('counts an app once even if it is asked for twice', () => {
    // Pricing must not depend on the caller remembering to de-duplicate, or a
    // customer could be quoted two apps and pay for one by accident.
    const twice = priceForSelection({ apps: ['crm', 'crm'] });
    expect(twice).toBe(priceForSelection({ apps: ['crm'] }));
  });
});
