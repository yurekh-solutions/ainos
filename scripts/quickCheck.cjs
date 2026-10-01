const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const u = await p.user.findFirst({ where: { email: { contains: 'yurekh' } } });
  console.log('User companyId:', u.companyId);
  
  const c = await p.customer.count({ where: { companyId: u.companyId } });
  const pr = await p.product.count({ where: { companyId: u.companyId } });
  const e = await p.expense.count({ where: { companyId: u.companyId } });
  const inv = await p.invoice.count({ where: { companyId: u.companyId } });
  
  console.log('Customers:', c);
  console.log('Products:', pr);
  console.log('Expenses:', e);
  console.log('Invoices:', inv);
  
  // List customer names
  const customers = await p.customer.findMany({ where: { companyId: u.companyId }, select: { name: true } });
  console.log('\nCustomer names:', customers.map(c => c.name).join(', '));
  
  await p.$disconnect();
}

main();
