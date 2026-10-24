import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

export type SettleResult =
  | { ok: true; alreadyPaid: boolean; credits: number; balance: number | null }
  | { ok: false; reason: 'unknown_order' | 'unknown_payment' | 'amount_mismatch' | 'payment_reused' }

/**
 * Grants the credits for a paid Razorpay order, exactly once.
 *
 * Both the webhook and the browser-side confirmation call this. The flip to
 * `paid` is a conditional update guarded by `status: 'created'`, so whichever
 * arrives second finds nothing to claim and grants nothing. Settlement is keyed
 * by the order id we wrote before payment, never by the amount.
 */
export async function settleCreditPurchase(
  orderId: string,
  paymentId: string,
  amountMinor?: number
): Promise<SettleResult> {
  const purchase = await prisma.creditPurchase.findUnique({ where: { orderId } })
  if (!purchase) return { ok: false, reason: 'unknown_order' }
  if (purchase.status === 'paid') {
    return { ok: true, alreadyPaid: true, credits: 0, balance: null }
  }
  if (!paymentId) return { ok: false, reason: 'unknown_payment' }
  if (amountMinor !== undefined && amountMinor !== purchase.amountMinor) {
    return { ok: false, reason: 'amount_mismatch' }
  }
  // One payment can only ever fund one order: a refunded payment id replayed
  // against a second order must not grant a second wallet top-up.
  const reused = await prisma.creditPurchase.findUnique({ where: { paymentId } })
  if (reused && reused.orderId !== orderId) return { ok: false, reason: 'payment_reused' }

  try {
    return await prisma.$transaction(async (tx) => {
      const claimed = await tx.creditPurchase.updateMany({
        where: { orderId, status: 'created' },
        data: { status: 'paid', paymentId, paidAt: new Date() },
      })
      if (claimed.count === 0) {
        return { ok: true as const, alreadyPaid: true, credits: 0, balance: null }
      }

      const wallet = await tx.creditBalance.upsert({
        where: { companyId: purchase.companyId },
        update: { balance: { increment: purchase.credits } },
        create: { companyId: purchase.companyId, balance: purchase.credits },
      })
      await tx.creditTransaction.create({
        data: {
          companyId: purchase.companyId,
          type: 'credit',
          amount: purchase.credits,
          balanceAfter: wallet.balance,
          description: `Credit purchase ${purchase.credits} credits (${paymentId})`,
        },
      })

      return { ok: true as const, alreadyPaid: false, credits: purchase.credits, balance: wallet.balance }
    })
  } catch (error) {
    // Two orders racing on the same payment id fail the unique index instead.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, reason: 'payment_reused' }
    }
    throw error
  }
}
