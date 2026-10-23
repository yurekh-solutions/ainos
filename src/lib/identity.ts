import { prisma } from '@/lib/prisma';

/**
 * Emails are stored lowercase. Every read path must be case-insensitive,
 * otherwise a user who registered as "Name@Gmail.com" cannot sign in (or
 * reset) after typing "name@gmail.com".
 */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/** Case-insensitive user lookup — the single canonical way to find an account. */
export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return prisma.user.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } },
  });
}

/**
 * Phone numbers are stored in a single canonical shape: digits only, with the
 * country code, no "+", spaces or dashes. Defaults to India (91) when the
 * caller omitted a country code, which matches the onboarding form.
 */
export function normalizePhone(phone: string, defaultCountryCode = '91'): string {
  const digits = (phone || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.length === 10) return defaultCountryCode + digits;
  if (digits.length === 11 && digits.startsWith('0')) return defaultCountryCode + digits.slice(1);
  return digits;
}

/** Human-readable form for display and email templates. */
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length === 12 && normalized.startsWith('91')) {
    return `+91 ${normalized.slice(2, 7)} ${normalized.slice(7)}`;
  }
  return normalized ? `+${normalized}` : '';
}
