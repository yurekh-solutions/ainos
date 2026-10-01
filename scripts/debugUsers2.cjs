const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({ 
    where: { email: { contains: 'yurekh' } },
    select: { id: true, email: true, name: true, companyId: true }
  });
  
  console.log('Found ' + users.length + ' users:\n');
  users.forEach((u, i) => {
    console.log((i + 1) + '. ' + u.email);
    console.log('   ID: ' + u.id);
    console.log('   CompanyId: ' + (u.companyId || 'NULL') + '\n');
  });

  const cid = '1dc98fef-7271-4c0c-b89c-e565c7d0d4f0';
  const c = await p.customer.count({ where: { companyId: cid } });
  console.log('Data in company ' + cid + ': ' + c + ' customers');

  if (c > 0) {
    for (const u of users) {
      if (u.companyId !== cid) {
        await p.user.update({ where: { id: u.id }, data: { companyId: cid } });
        console.log('Updated ' + u.email + ' to company ' + cid);
      }
    }
  }
  
  await p.$disconnect();
}

main();
