const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find ALL users with yurekh in email
  const users = await p.user.findMany({ 
    where: { email: { contains: 'yurekh' } },
    select: { id: true, email: true, name: true, companyId: true }
  });
  
  console.log(`Found ${users.length} users with 'yurekh' in email:\n`);
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email}`);
    console.log(`     ID: ${u.id}`);
    console.log(`     Name: ${u.name}`);
    console.log(`     CompanyId: ${u.companyId || 'NULL'}\n`);
  });

  // Find the company that has the data
  const companyIdWithData = '1dc98fef-7271-4c0c-b89c-e565c7d0d4f0';
  const c = await p.customer.count({ where: { companyId: companyIdWithData } });
  const pr = await p.product.count({ where: { companyId: companyIdWithData } });
  const e = await p.expense.count({ where: { companyId: companyIdWithData } });
  
  console.log(`Data in company ${companyIdWithData}:`);
  console.log(`  Customers: ${c}`);
  console.log(`  Products: ${pr}`);
  console.log(`  Expenses: ${e}`);

  // Update all yurekh users to have this companyId
  if (c > 0) {
    console.log('\nUpdating all yurekh users to use this company...');
    for (const u of users) {
      if (u.companyId !== companyIdWithData) {
        await p.user.update({ where: { id: u.id }, data: { companyId: companyIdWithData } });
        console.log(`  Updated ${u.email}`);
      }
    }
  }
  
  await p.$disconnect();
}

main();
