import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { findUserByEmail } from '@/lib/identity';
import { ALL_VERTICAL_KEYS } from '@/lib/verticals';

/**
 * Two-layer vertical (workspace) access:
 *   effective = Company.enabledVerticals ∩ User.allowedVerticals
 * An empty array at either layer means "everything" — so existing accounts
 * keep full access without any backfill. Company owners and company admins
 * bypass the user layer; platform admins bypass both layers.
 */

interface UserVerticalFields {
  role?: string | null;
  isAdmin?: boolean | null;
  allowedVerticals?: string[] | null;
}

interface CompanyVerticalFields {
  enabledVerticals?: string[] | null;
}

export function getEffectiveVerticals(
  user: UserVerticalFields | null,
  company: CompanyVerticalFields | null,
  email?: string | null,
): string[] {
  const companySet = company?.enabledVerticals?.length ? company.enabledVerticals : ALL_VERTICAL_KEYS;
  // Platform admins see everything, in every company.
  if (isAdmin(email)) return ALL_VERTICAL_KEYS;
  // Owners and company admins inherit every vertical the company holds.
  if (user?.isAdmin || user?.role === 'owner' || user?.role === 'admin') return companySet;
  const userSet = user?.allowedVerticals?.length ? user.allowedVerticals : ALL_VERTICAL_KEYS;
  return companySet.filter(v => userSet.includes(v));
}

/** Load company flags for a user row and compute the workspace list. */
export async function getVerticalsForUser(user: (UserVerticalFields & { companyId?: string | null }) | null, email?: string | null): Promise<string[]> {
  if (!user) return ALL_VERTICAL_KEYS;
  // Platform admins and users without a company don't need the company row.
  let company: CompanyVerticalFields | null = null;
  if (user.companyId && !isAdmin(email)) {
    company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { enabledVerticals: true },
    });
  }
  return getEffectiveVerticals(user, company, email);
}

/** Single check used by middleware and APIs for one email + vertical key. */
export async function canAccessVertical(email: string | null | undefined, verticalKey: string): Promise<boolean> {
  if (!email || !verticalKey) return false;
  if (isAdmin(email)) return true;
  const user = await findUserByEmail(email);
  if (!user) return false;
  const verticals = await getVerticalsForUser(user, user.email);
  return verticals.includes(verticalKey);
}
