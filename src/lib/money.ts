import type { Prisma } from '@prisma/client';

/**
 * Manual money helpers.
 *
 * The five operational apps (rental, approvals, planning, surveys, events) store
 * money in `Decimal(14,2)` columns so arithmetic is exact in Postgres. Prisma
 * hands those columns back as `Decimal` instances, which `JSON.stringify` turns
 * into strings — every API response therefore passes them through `money()` to
 * keep the wire contract numeric.
 */
export const round2 = (value: number): number => Math.round(value * 100) / 100;

export function num(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? round2(parsed) : fallback;
}

export function money(value: Prisma.Decimal | number | string | null | undefined): number {
  return num(value);
}

/** Rounds a money field to the precision the database column will keep. */
export function toMoneyDecimal(value: unknown): number {
  return round2(num(value));
}
