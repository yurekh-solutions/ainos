const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get user's actual companyId
  const user = await prisma.user.findFirst({ where: { email: { contains: 'yurekh' } } });
  const correctCompanyId = user.companyId;
  const wrongCompanyId = '4ebc11e4-ba1a-4ec5-8e65-ec25eaa4daee';

  console.log(`User's actual companyId: ${correctCompanyId}`);
  console.log(`Data was seeded to: ${wrongCompanyId}`);

  if (correctCompanyId === wrongCompanyId) {
    console.log('Same company, no migration needed');
    return;
  }

  // Migrate all data from wrong company to correct company
  console.log('\nMigrating data...');
  
  const custCount = await prisma.customer.count({ where: { companyId: wrongCompanyId } });
  const prodCount = await prisma.product.count({ where: { companyId: wrongCompanyId } });
  const expCount = await prisma.expense.count({ where: { companyId: wrongCompanyId } });
  const invCount = await prisma.invoice.count({ where: { companyId: wrongCompanyId } });

  if (custCount > 0) {
    await prisma.customer.updateMany({ where: { companyId: wrongCompanyId }, data: { companyId: correctCompanyId } });
    console.log(`  Migrated ${custCount} customers`);
  }
  if (prodCount > 0) {
    await prisma.product.updateMany({ where: { companyId: wrongCompanyId }, data: { companyId: correctCompanyId } });
    console.log(`  Migrated ${prodCount} products`);
  }
  if (expCount > 0) {
    await prisma.expense.updateMany({ where: { companyId: wrongCompanyId }, data: { companyId: correctCompanyId } });
    console.log(`  Migrated ${expCount} expenses`);
  }
  if (invCount > 0) {
    await prisma.invoice.updateMany({ where: { companyId: wrongCompanyId }, data: { companyId: correctCompanyId } });
    console.log(`  Migrated ${invCount} invoices`);
  }

  // Also migrate any null companyId records
  const nullCust = await prisma.customer.count({ where: { companyId: null } });
  const nullProd = await prisma.product.count({ where: { companyId: null } });
  const nullExp = await prisma.expense.count({ where: { companyId: null } });
  const nullInv = await prisma.invoice.count({ where: { companyId: null } });

  if (nullCust > 0 || nullProd > 0 || nullExp > 0 || nullInv > 0) {
    console.log('\nMigrating orphaned (null) records...');
    if (nullCust > 0) await prisma.customer.updateMany({ where: { companyId: null }, data: { companyId: correctCompanyId } });
    if (nullProd > 0) await prisma.product.updateMany({ where: { companyId: null }, data: { companyId: correctCompanyId } });
    if (nullExp > 0) await prisma.expense.updateMany({ where: { companyId: null }, data: { companyId: correctCompanyId } });
    if (nullInv > 0) await prisma.invoice.updateMany({ where: { companyId: null }, data: { companyId: correctCompanyId } });
    console.log(`  Migrated null records`);
  }

  // Delete the wrongly created company
  await prisma.company.delete({ where: { id: wrongCompanyId } });
  console.log(`\nDeleted wrong company ${wrongCompanyId}`);

  // Final verification
  const final = {
    customers: await prisma.customer.count({ where: { companyId: correctCompanyId } }),
    products: await prisma.product.count({ where: { companyId: correctCompanyId } }),
    expenses: await prisma.expense.count({ where: { companyId: correctCompanyId } }),
    invoices: await prisma.invoice.count({ where: { companyId: correctCompanyId } })
  };

  console.log(`\n══════════════════════════════════════════`);
  console.log(`  FINAL DATA (companyId: ${correctCompanyId})`);
  console.log(`══════════════════════════════════════════`);
  console.log(`  Customers: ${final.customers}`);
  console.log(`  Products:  ${final.products}`);
  console.log(`  Expenses:  ${final.expenses}`);
  console.log(`  Invoices:  ${final.invoices}`);
  console.log(`══════════════════════════════════════════`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
