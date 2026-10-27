import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Aiven's smaller Postgres plans cap max_connections low. Prisma's default pool
// size is (physical CPU cores × 2 + 1), which on a shared Render container can
// open more connections than the database allows — exhausting the slots and
// silently failing writes such as blog generation. Cap the pool and let queries
// wait for a free connection instead of erroring. Skip if the URL already sets it.
function withPoolLimit(url: string | undefined): string | undefined {
  if (!url) return url
  if (/connection_limit=/i.test(url)) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}connection_limit=5&pool_timeout=30`
}

const dbUrl = withPoolLimit(process.env.DATABASE_URL)

const options: Prisma.PrismaClientOptions = dbUrl
  ? { datasources: { db: { url: dbUrl } } }
  : {}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(options)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
