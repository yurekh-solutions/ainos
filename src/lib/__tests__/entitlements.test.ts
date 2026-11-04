import { describe, it, expect } from 'vitest';
import {
  decideAccess,
  getEffectiveVerticals,
  getLockedCapabilities,
  type CapabilityAccessMap,
} from '@/lib/entitlements';
import type { Capability } from '@/lib/capabilities';

// A synthetic capability — decideAccess is pure and takes it as input, so we do
// not depend on the real NAV catalog for the decision-matrix assertions.
const invoices: Capability = { key: '/invoices', label: 'Invoices', href: '/invoices', vertical: 'finance' };

const ADMIN = 'yurekhsolutions@gmail.com';
const DEV = 'soniajaiswal2222@gmail.com'; // developer/owner allow-list — full access, no payment
const NOW = Date.parse('2026-01-01T00:00:00.000Z');

function access(overrides: Partial<Parameters<typeof decideAccess>[0]> = {}) {
  return decideAccess({ email: 'member@co.com', user: null, company: null, capability: invoices, now: NOW, ...overrides });
}

describe('decideAccess — decision matrix', () => {
  it('admin bypasses every lock at level 3', () => {
    const company = { capabilityAccess: { '/invoices': { level: 0 } } as CapabilityAccessMap };
    expect(access({ email: ADMIN, company })).toEqual({ allowed: true, level: 3, reason: 'admin' });
  });

  it('unknown capability (not in catalog) is never locked', () => {
    expect(access({ capability: null })).toEqual({ allowed: true, level: 2, reason: 'unknown' });
  });

  it('absent grant = open (preserves pre-engine behaviour)', () => {
    expect(access({ company: { capabilityAccess: {} } })).toEqual({ allowed: true, level: 2, reason: 'open' });
  });

  it('locked grant (level 0) denies', () => {
    const company = { capabilityAccess: { '/invoices': { level: 0 } } as CapabilityAccessMap };
    expect(access({ company })).toEqual({ allowed: false, level: 0, reason: 'locked' });
  });

  it('subscribed + premium grants allow at their level', () => {
    expect(access({ company: { capabilityAccess: { '/invoices': { level: 2 } } as CapabilityAccessMap } }))
      .toEqual({ allowed: true, level: 2, reason: 'subscribed' });
    expect(access({ company: { capabilityAccess: { '/invoices': { level: 3 } } as CapabilityAccessMap } }))
      .toEqual({ allowed: true, level: 3, reason: 'subscribed' });
  });

  it('expired grant (until < now) denies even at level 2', () => {
    const company = { capabilityAccess: { '/invoices': { level: 2, until: '2020-01-01T00:00:00.000Z' } } as CapabilityAccessMap };
    expect(access({ company })).toEqual({ allowed: false, level: 0, reason: 'expired' });
  });

  it('not-yet-expired grant still allows', () => {
    const company = { capabilityAccess: { '/invoices': { level: 2, until: '2030-01-01T00:00:00.000Z' } } as CapabilityAccessMap };
    expect(access({ company })).toEqual({ allowed: true, level: 2, reason: 'subscribed' });
  });

  it('owner whose vertical is not enabled by the company is blocked', () => {
    const company = { enabledVerticals: ['crm'] };
    const owner = { role: 'owner' };
    expect(access({ company, user: owner })).toEqual({ allowed: false, level: 0, reason: 'vertical' });
  });

  it('member restricted to another vertical is blocked even when company enables it', () => {
    const company = { enabledVerticals: ['finance', 'crm'] };
    const member = { role: 'member', allowedVerticals: ['crm'] };
    expect(access({ company, user: member })).toEqual({ allowed: false, level: 0, reason: 'vertical' });
  });

  it('member inside an enabled + granted vertical is allowed', () => {
    const company = { enabledVerticals: ['finance'], capabilityAccess: { '/invoices': { level: 2 } } as CapabilityAccessMap };
    const member = { role: 'member', allowedVerticals: ['finance'] };
    expect(access({ company, user: member })).toEqual({ allowed: true, level: 2, reason: 'subscribed' });
  });

  it('empty company/user verticals mean "everything" (no backfill needed)', () => {
    expect(access({ company: { enabledVerticals: [] }, user: { role: 'member', allowedVerticals: [] } }))
      .toEqual({ allowed: true, level: 2, reason: 'open' });
  });

  it('à-la-carte company with empty enabledVerticals locks every workspace', () => {
    const company = { enabledVerticals: [], aLaCarteEnabled: true };
    expect(access({ company, user: { role: 'owner' } }))
      .toEqual({ allowed: false, level: 0, reason: 'vertical' });
  });

  it('à-la-carte company unlocks only a purchased vertical (no capability grant = open)', () => {
    const company = { enabledVerticals: ['finance'], aLaCarteEnabled: true };
    expect(access({ company, user: { role: 'owner' } }))
      .toEqual({ allowed: true, level: 2, reason: 'open' });
  });

  it('developer/owner allow-list email bypasses the à-la-carte lock entirely', () => {
    const company = { enabledVerticals: [], aLaCarteEnabled: true };
    expect(access({ email: DEV, company, user: { role: 'owner' } }))
      .toEqual({ allowed: true, level: 3, reason: 'admin' });
  });
});

describe('getEffectiveVerticals', () => {
  it('admin sees all verticals', () => {
    const all = getEffectiveVerticals({ role: 'member' }, { enabledVerticals: ['crm'] }, ADMIN);
    expect(all.length).toBeGreaterThan(1);
  });
  it('owner inherits the company set', () => {
    expect(getEffectiveVerticals({ role: 'owner' }, { enabledVerticals: ['finance', 'crm'] }, 'a@b.co')).toEqual(['finance', 'crm']);
  });
  it('member is intersected with their allowed verticals', () => {
    expect(getEffectiveVerticals({ role: 'member', allowedVerticals: ['crm'] }, { enabledVerticals: ['finance', 'crm'] }, 'a@b.co')).toEqual(['crm']);
  });
  it('à-la-carte company with no purchases gets NO verticals (locked from signup)', () => {
    expect(getEffectiveVerticals({ role: 'owner' }, { enabledVerticals: [], aLaCarteEnabled: true }, 'a@b.co')).toEqual([]);
  });
  it('legacy company (no à-la-carte flag) with empty set still means everything', () => {
    expect(getEffectiveVerticals({ role: 'owner' }, { enabledVerticals: [] }, 'a@b.co').length).toBeGreaterThan(1);
  });
  it('developer/owner allow-list email sees all verticals regardless of company state', () => {
    expect(getEffectiveVerticals({ role: 'owner' }, { enabledVerticals: [], aLaCarteEnabled: true }, DEV).length).toBeGreaterThan(1);
  });
});

describe('getLockedCapabilities', () => {
  it('returns catalog keys the vertical grants but the capability lock denies', () => {
    const owner = { role: 'owner' };
    const company = { enabledVerticals: ['finance'], capabilityAccess: { '/invoices': { level: 0 } } as CapabilityAccessMap };
    const locked = getLockedCapabilities(owner, company, 'a@b.co');
    expect(locked).toContain('/invoices');
    expect(locked).not.toContain('/crm/leads');
  });
  it('returns nothing for admin', () => {
    const company = { enabledVerticals: ['finance'], capabilityAccess: { '/invoices': { level: 0 } } as CapabilityAccessMap };
    expect(getLockedCapabilities({ role: 'owner' }, company, ADMIN)).toEqual([]);
  });
  it('leads capability in an enabled vertical with no grant is not locked', () => {
    const company = { enabledVerticals: ['crm'], capabilityAccess: {} } as const;
    expect(getLockedCapabilities({ role: 'owner' }, company as never, 'a@b.co')).not.toContain('/crm/leads');
  });
});
