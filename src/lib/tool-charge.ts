import { prisma } from './prisma'
import { deductCredits } from './credits'
import { TOOL_CREDIT_COSTS } from './billing'

export type ToolChargeCheck =
  | { ok: true; cost: number; balance: number | null }
  | { ok: false; cost: number; balance: number; error: string }

export function toolCreditCost(key: string): number {
  return TOOL_CREDIT_COSTS[key]?.credits ?? 0
}

/**
 * Affordability check, run before spending a provider call. Read-only: it
 * reserves nothing, so two concurrent runs can both pass and only the first
 * one to finish will actually be charged.
 */
export async function assertToolCredits(companyId: string | null, key: string): Promise<ToolChargeCheck> {
  const cost = toolCreditCost(key)
  if (!cost) return { ok: true, cost: 0, balance: null }
  if (!companyId) return { ok: false, cost, balance: 0, error: 'Company not found' }

  const wallet = await prisma.creditBalance.findUnique({
    where: { companyId },
    select: { balance: true },
  })
  const balance = wallet?.balance ?? 0
  if (balance < cost) return { ok: false, cost, balance, error: 'Insufficient credits' }
  return { ok: true, cost, balance }
}

/** Charges a run that has already produced its result, so failures stay uncharged. */
export async function chargeToolRun(
  companyId: string | null,
  key: string,
  label?: string
): Promise<ToolChargeCheck> {
  const cost = toolCreditCost(key)
  if (!cost) return { ok: true, cost: 0, balance: null }
  if (!companyId) return { ok: false, cost, balance: 0, error: 'Company not found' }

  const result = await deductCredits(companyId, cost, `Tool: ${label || key}`)
  return result.success
    ? { ok: true, cost, balance: result.balance }
    : { ok: false, cost, balance: result.balance, error: result.error || 'Insufficient credits' }
}
