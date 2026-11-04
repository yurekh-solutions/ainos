/**
 * DEVELOPER / OWNER ACCESS ALLOW-LIST — the single source of truth for accounts
 * that bypass workspace + tool gating and credit deduction entirely (full access,
 * no payment). Kept in its own module so both the tool-credit engine
 * (tool-guard) and the vertical entitlement engine (entitlements) can honour it
 * without importing each other (avoids a circular dependency).
 *
 * This is purely for internal QA / the product owner's demo account — trim the
 * list before a hard public launch. Extra emails can be appended at runtime via
 * DEV_TOOL_ACCESS_EMAILS (comma-separated).
 */
const DEVELOPER_EMAILS: string[] = [
  'soniajaiswal2222@gmail.com',
  'info.ainosio@gmail.com',
];

export function isDeveloperEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  const fromEnv = (process.env.DEV_TOOL_ACCESS_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return DEVELOPER_EMAILS.includes(e) || fromEnv.includes(e);
}
