const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ take: 10 });
  console.log('Users found:', users.length);
  users.forEach(u => {
    console.log(`  - ${u.email} (companyId: ${u.companyId || 'NULL'})`);
  });
  
  const companies = await prisma.company.findMany({ take: 10 });
  console.log('\nCompanies found:', companies.length);
  companies.forEach(c => {
    console.log(`  - ${c.name} (id: ${c.id})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
