// Quick DB connectivity check
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.company.count();
  console.log('DB OK. Company count:', count);
}

main().catch((e) => {
  console.error('DB FAILED:', e.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
