/**
 * Thin re-export shim. The vertical-access logic now lives in the unified
 * entitlement engine (@/lib/entitlements) so there is a single source of truth
 * for "who can use what". Existing import sites (middleware dynamic-imports
 * canAccessVertical, auth-options imports getVerticalsForUser, admin APIs, etc.)
 * keep importing from @/lib/access unchanged.
 */
export {
  getEffectiveVerticals,
  getVerticalsForUser,
  canAccessVertical,
} from '@/lib/entitlements';
