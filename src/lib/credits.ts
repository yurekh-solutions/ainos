import { prisma } from './prisma'

export async function getCreditBalance(companyId: string): Promise<number> {
  const balance = await prisma.creditBalance.findUnique({ where: { companyId } })
  return balance?.balance ?? 0
}

export async function addCredits(companyId: string, amount: number, description: string) {
  const current = await getCreditBalance(companyId)
  const newBalance = current + amount

  await prisma.$transaction([
    prisma.creditBalance.upsert({
      where: { companyId },
      update: { balance: newBalance },
      create: { companyId, balance: newBalance }
    }),
    prisma.creditTransaction.create({
      data: { companyId, type: 'credit', amount, balanceAfter: newBalance, description }
    })
  ])

  return newBalance
}

export async function deductCredits(companyId: string, amount: number, description: string): Promise<{ success: boolean; balance: number; error?: string }> {
  const current = await getCreditBalance(companyId)
  if (current < amount) {
    return { success: false, balance: current, error: 'Insufficient credits' }
  }

  const newBalance = current - amount

  await prisma.$transaction([
    prisma.creditBalance.update({
      where: { companyId },
      data: { balance: newBalance }
    }),
    prisma.creditTransaction.create({
      data: { companyId, type: 'debit', amount: -amount, balanceAfter: newBalance, description }
    })
  ])

  return { success: true, balance: newBalance }
}

export async function getCreditHistory(companyId: string, limit = 50) {
  return prisma.creditTransaction.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}
