import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { isDeveloperEmail } from '@/lib/dev-access';
import { findUserByEmail } from '@/lib/identity';
import { ALL_VERTICAL_KEYS } from '@/lib/verticals';
import { CAPABILITIES, capabilityForKey, type Capability } from '@/lib/capabilities';

/**
 * UNIFIED ENTITLEMENT ENGINE — the single source of truth for "who can use what".
 *
 * Two layers, combined here so no caller ever has to reconcile them itself:
 *   1. Vertical layer  = Company.enabledVerticals ∩ User.allowedVerticals
 *      (empty at either layer means "everything", so existing accounts keep full
 *       access with no backfill; owners/admins inherit the company set).
 *   2. Capability layer = Company.capabilityAccess { [href]: { level, until } }
 *      (null/absent key means OPEN — nothing is locked until a plan explicitly
 *       grants/locks it, so shipping this engine changes no existing behavior).
 *
 * The legacy 8 int level-flags on Company are still handled by tool-guard's
 * credit/level engine and are intentionally NOT folded in here yet (Phase 4 wires
 * per-tool billing into this map).
 */

// ── Vertical layer (moved from access.ts; access.ts now re-exports these) ──
interface UserVerticalFields {
  role?: string | null;
  isAdmin?: boolean | null;
  allowedVerticals?: string[] | null;
}
interface CompanyVerticalFields {
  enabledVerticals?: string[] | null;
  aLaCarteEnabled?: boolean | null;
}

/**
 * The set of workspaces a COMPANY is entitled to. The à-la-carte flag is the
 * safe flip switch: legacy companies (flag false) keep today's "empty = all
 * open" convention byte-for-byte; self-serve signups (flag true) start with
 * NOTHING open and only a WorkspaceSubscription unlocks a vertical.
 */
function companyVerticalSet(company: CompanyVerticalFields | null): string[] {
  if (company?.enabledVerticals?.length) return company.enabledVerticals;
  return company?.aLaCarteEnabled ? [] : ALL_VERTICAL_KEYS;
}

export function getEffectiveVerticals(
  user: UserVerticalFields | null,
  company: CompanyVerticalFields | null,
  email?: string | null,
): string[] {
  if (isAdmin(email) || isDeveloperEmail(email)) return ALL_VERTICAL_KEYS;
  const companySet = companyVerticalSet(company);
  if (user?.isAdmin || user?.role === 'owner' || user?.role === 'admin') return companySet;
  const userSet = user?.allowedVerticals?.length ? user.allowedVerticals : ALL_VERTICAL_KEYS;
  return companySet.filter(v => userSet.includes(v));
}

/** Load company flags for a user row and compute the workspace list. */
export async function getVerticalsForUser(
  user: (UserVerticalFields & { companyId?: string | null }) | null,
  email?: string | null,
): Promise<string[]> {
  if (!user) return ALL_VERTICAL_KEYS;
  if (isAdmin(email) || isDeveloperEmail(email)) return ALL_VERTICAL_KEYS;
  let company: CompanyVerticalFields | null = null;
  if (user.companyId) {
    company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { enabledVerticals: true, aLaCarteEnabled: true },
    });
  }
  return getEffectiveVerticals(user, company, email);
}

/** Single vertical check used by middleware and APIs. */
export async function canAccessVertical(email: string | null | undefined, verticalKey: string): Promise<boolean> {
  if (!email || !verticalKey) return false;
  if (isAdmin(email) || isDeveloperEmail(email)) return true;
  const user = await findUserByEmail(email);
  if (!user) return false;
  const verticals = await getVerticalsForUser(user, user.email);
  return verticals.includes(verticalKey);
}

// ── Capability layer (new) ──
export interface CapabilityGrant {
  level: number;            // 0 = locked, 1 = basic, 2 = subscribed, 3 = premium
  until?: string | null;    // ISO expiry; past = expired → locked
}
export type CapabilityAccessMap = Record<string, CapabilityGrant>;

interface CompanyAccessFields extends CompanyVerticalFields {
  capabilityAccess?: CapabilityAccessMap | null;
}
interface AccessUserFields extends UserVerticalFields {
  email?: string | null;
}

export type AccessReason = 'admin' | 'open' | 'subscribed' | 'locked' | 'expired' | 'vertical' | 'unknown';

export interface AccessDecision {
  allowed: boolean;
  level: number;
  reason: AccessReason;
}

/**
 * Pure decision function — no DB, trivially unit-testable across the matrix
 * (admin / owner / member × open / locked / expired × vertical-in-scope).
 */
export function decideAccess(input: {
  email?: string | null;
  user: AccessUserFields | null;
  company: CompanyAccessFields | null;
  capability: Capability | null;
  now?: number;
}): AccessDecision {
  const now = input.now ?? Date.now();
  if (isAdmin(input.email) || isDeveloperEmail(input.email)) return { allowed: true, level: 3, reason: 'admin' };

  // Unknown capability (not in the catalog) is never locked by this engine.
  if (!input.capability) return { allowed: true, level: 2, reason: 'unknown' };

  const { user, company, capability } = input;

  // 1) Vertical layer
  const companySet = companyVerticalSet(company);
  const verticalInCompany = companySet.includes(capability.vertical);
  const privileged = !!user?.isAdmin || user?.role === 'owner' || user?.role === 'admin';
  let verticalAllowed: boolean;
  if (privileged) {
    verticalAllowed = verticalInCompany;
  } else {
    const userSet = user?.allowedVerticals?.length ? user.allowedVerticals : ALL_VERTICAL_KEYS;
    verticalAllowed = verticalInCompany && userSet.includes(capability.vertical);
  }
  if (!verticalAllowed) return { allowed: false, level: 0, reason: 'vertical' };

  // 2) Capability layer — absent grant = open (preserves today's behavior).
  const grant = company?.capabilityAccess?.[capability.key];
  if (!grant) return { allowed: true, level: 2, reason: 'open' };
  if (grant.until && new Date(grant.until).getTime() < now) return { allowed: false, level: 0, reason: 'expired' };
  if (grant.level <= 0) return { allowed: false, level: 0, reason: 'locked' };
  return { allowed: true, level: grant.level, reason: 'subscribed' };
}

/** Load user + company once and decide access for one capability key. */
export async function resolveAccess(email: string | null | undefined, key: string): Promise<AccessDecision> {
  const capability = capabilityForKey(key);
  if (!capability) return { allowed: true, level: 2, reason: 'unknown' };
  if (!email) return { allowed: false, level: 0, reason: 'vertical' };
  if (isAdmin(email) || isDeveloperEmail(email)) return { allowed: true, level: 3, reason: 'admin' };
  const user = await findUserByEmail(email);
  if (!user) return { allowed: false, level: 0, reason: 'vertical' };
  let company: CompanyAccessFields | null = null;
  if (user.companyId) {
    company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { enabledVerticals: true, capabilityAccess: true, aLaCarteEnabled: true },
    }) as CompanyAccessFields | null;
  }
  return decideAccess({ email, user, company, capability });
}

export async function canAccessCapability(email: string | null | undefined, key: string): Promise<boolean> {
  const d = await resolveAccess(email, key);
  return d.allowed;
}

/**
 * Capability keys the member could otherwise reach (their vertical is granted)
 * but are locked/expired by the company's capabilityAccess. Used to render locks
 * in the sidebar and to gate routes. Empty for every existing company today.
 */
export function getLockedCapabilities(
  user: AccessUserFields | null,
  company: CompanyAccessFields | null,
  email?: string | null,
): string[] {
  if (isAdmin(email) || isDeveloperEmail(email)) return [];
  const verticals = getEffectiveVerticals(user, company, email);
  const locked: string[] = [];
  for (const c of CAPABILITIES) {
    if (!verticals.includes(c.vertical)) continue;
    const d = decideAccess({ email, user, company, capability: c });
    if (!d.allowed) locked.push(c.key);
  }
  return locked;
}

/** Async wrapper for the session callback: loads company entitlements + computes locks. */
export async function getLockedCapabilitiesForUser(
  user: (AccessUserFields & { companyId?: string | null }) | null,
  email?: string | null,
): Promise<string[]> {
  if (!user) return [];
  if (isAdmin(email) || isDeveloperEmail(email)) return [];
  let company: CompanyAccessFields | null = null;
  if (user.companyId) {
    company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { enabledVerticals: true, capabilityAccess: true, aLaCarteEnabled: true },
    }) as CompanyAccessFields | null;
  }
  return getLockedCapabilities(user, company, email);
}
