const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the admin user
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'yurekh' } }
  });

  if (!user) {
    console.error('No user found');
    process.exit(1);
  }

  console.log(`User: ${user.email}`);
  console.log(`User ID: ${user.id}`);
  console.log(`User companyId: ${user.companyId}`);

  // Check if user has a company, if not create one
  let companyId = user.companyId;
  if (!companyId) {
    console.log('No company found, creating one...');
    const company = await prisma.company.create({
      data: {
        name: 'Yurekh Solutions',
        email: user.email,
        createdBy: user.id
      }
    });
    companyId = company.id;
    
    // Update user with company
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId }
    });
    console.log(`Created company: ${companyId}`);
  }

  console.log(`\nUsing companyId: ${companyId}`);

  // Count existing data
  const existingCustomers = await prisma.customer.count({ where: { companyId } });
  const existingProducts = await prisma.product.count({ where: { companyId } });
  const existingExpenses = await prisma.expense.count({ where: { companyId } });

  console.log(`\nExisting data for this company:`);
  console.log(`  Customers: ${existingCustomers}`);
  console.log(`  Products: ${existingProducts}`);
  console.log(`  Expenses: ${existingExpenses}`);

  // Update null companyId records to this company
  const nullCustomers = await prisma.customer.count({ where: { companyId: null } });
  const nullProducts = await prisma.product.count({ where: { companyId: null } });
  const nullExpenses = await prisma.expense.count({ where: { companyId: null } });

  if (nullCustomers > 0 || nullProducts > 0 || nullExpenses > 0) {
    console.log(`\nFound orphaned records (companyId=null), migrating...`);
    
    if (nullCustomers > 0) {
      await prisma.customer.updateMany({
        where: { companyId: null },
        data: { companyId }
      });
      console.log(`  Migrated ${nullCustomers} customers`);
    }
    if (nullProducts > 0) {
      await prisma.product.updateMany({
        where: { companyId: null },
        data: { companyId }
      });
      console.log(`  Migrated ${nullProducts} products`);
    }
    if (nullExpenses > 0) {
      await prisma.expense.updateMany({
        where: { companyId: null },
        data: { companyId }
      });
      console.log(`  Migrated ${nullExpenses} expenses`);
    }
  }

  // Also update invoices with null companyId
  const nullInvoices = await prisma.invoice.count({ where: { companyId: null } });
  if (nullInvoices > 0) {
    await prisma.invoice.updateMany({
      where: { companyId: null },
      data: { companyId }
    });
    console.log(`  Migrated ${nullInvoices} invoices`);
  }

  // Final count
  const finalCustomers = await prisma.customer.count({ where: { companyId } });
  const finalProducts = await prisma.product.count({ where: { companyId } });
  const finalExpenses = await prisma.expense.count({ where: { companyId } });
  const finalInvoices = await prisma.invoice.count({ where: { companyId } });

  console.log(`\n══════════════════════════════════════════`);
  console.log(`  FINAL DATA FOR COMPANY ${companyId}`);
  console.log(`══════════════════════════════════════════`);
  console.log(`  Customers: ${finalCustomers}`);
  console.log(`  Products:  ${finalProducts}`);
  console.log(`  Expenses:  ${finalExpenses}`);
  console.log(`  Invoices:  ${finalInvoices}`);
  console.log(`══════════════════════════════════════════`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
