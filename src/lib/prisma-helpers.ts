import { prisma } from './prisma'

export async function getUserFromSession(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { company: true }
  })
}

export async function getCompanyFromUser(email: string) {
  const user = await getUserFromSession(email)
  if (!user?.companyId) return null
  return user.company
}

export async function ensureUser(email: string, name: string) {
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({
      data: { email, name }
    })
  }
  return user
}

export async function ensureCompany(email: string, name: string, companyName?: string) {
  const user = await ensureUser(email, name)
  if (!user.companyId) {
    const company = await prisma.company.create({
      data: {
        name: companyName || `${name}'s Company`,
        createdBy: user.id
      }
    })
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: company.id }
    })
    return company
  }
  return prisma.company.findUnique({ where: { id: user.companyId } })
}

export async function ensureCreditBalance(companyId: string) {
  let balance = await prisma.creditBalance.findUnique({ where: { companyId } })
  if (!balance) {
    balance = await prisma.creditBalance.create({
      data: { companyId, balance: 100 }
    })
  }
  return balance
}
