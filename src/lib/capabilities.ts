import { NAV_GROUPS } from '@/components/layout/navigation';

/**
 * Unified capability catalog — the single list of individually-gateable tools.
 * Derived directly from NAV_GROUPS so there is zero duplication with the
 * sidebar/dashboard navigation. A capability key is the tool's route href
 * (e.g. "/crm/leads", "/invoices"), which is stable and already used everywhere.
 */
export interface Capability {
  /** Stable id = the tool's href. */
  key: string;
  label: string;
  href: string;
  /** Owning vertical (NAV_GROUPS group key), e.g. 'crm' | 'finance'. */
  vertical: string;
  tier?: 'core' | 'advanced';
}

export const CAPABILITIES: Capability[] = NAV_GROUPS.flatMap(g =>
  g.items.map(i => ({ key: i.href, label: i.label, href: i.href, vertical: g.key, tier: i.tier })),
);

const BY_KEY = new Map(CAPABILITIES.map(c => [c.key, c] as const));

export function capabilityForKey(key?: string | null): Capability | null {
  return key ? BY_KEY.get(key) ?? null : null;
}

export function capabilitiesForVertical(vertical: string): Capability[] {
  return CAPABILITIES.filter(c => c.vertical === vertical);
}

/** Longest-prefix match of a pathname to its owning capability; null = shared route. */
export function capabilityForPath(pathname: string): Capability | null {
  let best: Capability | null = null;
  let bestLen = -1;
  for (const c of CAPABILITIES) {
    if (pathname === c.href || pathname.startsWith(`${c.href}/`)) {
      if (c.href.length > bestLen) {
        best = c;
        bestLen = c.href.length;
      }
    }
  }
  return best;
}

export const ALL_CAPABILITY_KEYS: string[] = CAPABILITIES.map(c => c.key);
