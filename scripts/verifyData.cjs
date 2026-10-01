const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '4ebc11e4-ba1a-4ec5-8e65-ec25eaa4daee';
  
  // Migrate invoices with null companyId
  const nullInvoices = await prisma.invoice.count({ where: { companyId: null } });
  if (nullInvoices > 0) {
    await prisma.invoice.updateMany({
      where: { companyId: null },
      data: { companyId }
    });
    console.log(`Migrated ${nullInvoices} invoices`);
  }

  // Verify user has companyId
  const user = await prisma.user.findFirst({ where: { email: { contains: 'yurekh' } } });
  console.log(`User companyId: ${user.companyId}`);

  // Final counts
  const counts = {
    customers: await prisma.customer.count({ where: { companyId } }),
    products: await prisma.product.count({ where: { companyId } }),
    expenses: await prisma.expense.count({ where: { companyId } }),
    invoices: await prisma.invoice.count({ where: { companyId } })
  };

  console.log(`\nData for company ${companyId}:`);
  console.log(`  Customers: ${counts.customers}`);
  console.log(`  Products:  ${counts.products}`);
  console.log(`  Expenses:  ${counts.expenses}`);
  console.log(`  Invoices:  ${counts.invoices}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
