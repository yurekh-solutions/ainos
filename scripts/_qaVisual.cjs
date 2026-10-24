// Seeds a tenant with realistic content so the UI can be exercised in a real
// browser at mobile / tablet widths, then removes it again.
//
//   node --env-file=.env scripts/_qaVisual.cjs seed
//   node --env-file=.env scripts/_qaVisual.cjs clean
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const EMAIL = 'qa.visual@ainos-test.com';
const PASSWORD = 'VisualQa12345';
const COMPANY = 'Vardhman Traders QA';

const money = (n) => Math.round(n * 100) / 100;

async function seed() {
  await clean();

  const company = await prisma.company.create({
    data: {
      name: COMPANY,
      companyType: 'Private Limited',
      email: EMAIL,
      phone: '9876543210',
      address: '14 Mahatma Gandhi Road, Indore, Madhya Pradesh 452001',
      country: 'India',
      createdBy: 'qa-visual',
      onboardingStatus: 'approved',
    },
  });

  await prisma.user.create({
    data: {
      email: EMAIL,
      name: 'Rohit Vardhman',
      password: await bcrypt.hash(PASSWORD, 10),
      role: 'owner',
      companyId: company.id,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.creditBalance.create({ data: { companyId: company.id, balance: 450 } });

  const customers = [
    ['Shree Balaji Enterprises', 'accounts@shreebalaji.co.in', '9822011234', '27AABCS1429P1ZV'],
    ['Krishna Textiles Private Limited', 'purchase@krishnatextiles.in', '9893044556', '24AACCK2841R1Z9'],
    ['Deshmukh Agro Industries', 'deshmukh.agro@gmail.com', '9922017788', '27AAGFD9210L1ZM'],
    ['Sunrise Packaging Solutions LLP', 'hello@sunrisepack.in', '9765012233', '29AAJFS3321B1ZP'],
    ['Nandini Dairy Distributors', 'orders@nandinidairy.in', '9034012244', '27AAECN1102K1ZR'],
    ['Patel Hardware & Sanitary Stores', 'patelhardware@yahoo.co.in', '9879023311', '24AADFP8823M1ZQ'],
    ['Ganpati Foods Wholesale', 'ganpati.foods@gmail.com', '9981027711', '27AAHCG2231N1ZT'],
    ['Meera Beauty Studio', 'studio@meerabeauty.in', '9098701234', ''],
  ];
  for (const [name, email, phone, gst] of customers) {
    await prisma.customer.create({
      data: {
        name, email, phone, gstNumber: gst || null, companyId: company.id,
        address: 'Shop 4, Sarafa Bazaar, Indore, MP 452002', state: 'Madhya Pradesh', pincode: '452002',
      },
    });
  }

  const invoices = [
    ['QA-2026-0001', 'Shree Balaji Enterprises', 48250.5, 'paid', 18],
    ['QA-2026-0002', 'Krishna Textiles Private Limited', 128900, 'sent', 12],
    ['QA-2026-0003', 'Deshmukh Agro Industries', 8640, 'draft', 4],
    ['QA-2026-0004', 'Sunrise Packaging Solutions LLP', 22500, 'overdue', 45],
    ['QA-2026-0005', 'Nandini Dairy Distributors', 5420.75, 'paid', 22],
    ['QA-2026-0006', 'Patel Hardware & Sanitary Stores', 96300, 'sent', 8],
  ];
  for (const [invoiceNumber, customerName, total, status, age] of invoices) {
    const sub = money(total / 1.18);
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerName,
        customerEmail: 'billing@example.in',
        customerAddress: 'Industrial Area Phase 2, Indore, MP 452001',
        items: [{ name: 'Mixed batch', quantity: 1, price: sub, gstRate: 18 }],
        subtotal: sub,
        tax: money(total - sub),
        total,
        totalAmount: total,
        status,
        invoiceDate: new Date(Date.now() - age * 86400000),
        dueDate: new Date(Date.now() + (30 - age) * 86400000),
        companyId: company.id,
        createdBy: 'qa-visual',
      },
    });
  }

  const leads = [
    ['Aarav Kulkarni', 'aarav@technova.in', 'website', 'qualified', 62],
    ['Fatima Sheikh', 'fatima.sheikh@gmail.com', 'referral', 'contacted', 48],
    ['Vikram Rathore', 'vikram@rathorelogistics.in', 'organic', 'new', 30],
    ['Sanjana Iyer', 'sanjana.iyer@outlook.com', 'social', 'negotiation', 75],
    ['Harshit Jain', 'harshit@jainexports.co.in', 'manual', 'won', 88],
  ];
  for (const [name, email, source, status, score] of leads) {
    await prisma.lead.create({
      data: { name, email, source, status, score, companyId: company.id, phone: '9812345678' },
    });
  }

  const products = [
    ['Cotton Fabric Roll 60s', 'QA-SKU-001', 1450, 340, 18],
    ['Stainless Steel Bottle 1L', 'QA-SKU-002', 349, 120, 12],
    ['Organic Turmeric Powder 500g', 'QA-SKU-003', 210, 96, 5],
    ['LED Bulb 9W Cool White', 'QA-SKU-004', 149, 88, 18],
  ];
  for (const [name, sku, price, stock, gst] of products) {
    await prisma.product.create({
      data: { name, sku, price, stock, gstRate: gst, category: 'general', companyId: company.id },
    });
  }

  const employees = [
    ['Anil Kumar Sharma', 'anil.sharma@vardhmantraders.in', 'Accounts', 'Accountant', 34000],
    ['Pooja Verma', 'pooja.verma@vardhmantraders.in', 'Sales', 'Sales Executive', 28000],
    ['Imran Qureshi', 'imran.q@vardhmantraders.in', 'Operations', 'Warehouse Supervisor', 31000],
  ];
  for (const [name, email, department, position, salary] of employees) {
    await prisma.employee.create({
      data: { name, email, department, position, salary, companyId: company.id, joinDate: new Date('2024-06-01') },
    });
  }

  console.log(`seeded ${COMPANY} (${company.id})`);
  console.log(`login: ${EMAIL} / ${PASSWORD}`);
}

/** Child rows have no cascade, so remove them explicitly before the company. */
async function clean() {
  const company = await prisma.company.findFirst({ where: { name: COMPANY } });
  if (!company) {
    console.log('no QA tenant to remove');
    return;
  }
  const where = { where: { companyId: company.id } };
  const steps = [
    ['invoice', () => prisma.invoice.deleteMany(where)],
    ['product', () => prisma.product.deleteMany(where)],
    ['employee', () => prisma.employee.deleteMany(where)],
    ['lead', () => prisma.lead.deleteMany(where)],
    ['customer', () => prisma.customer.deleteMany(where)],
    ['creditTransaction', () => prisma.creditTransaction.deleteMany(where)],
    ['creditPurchase', () => prisma.creditPurchase.deleteMany(where)],
    ['creditBalance', () => prisma.creditBalance.deleteMany(where)],
    ['toolRun', () => prisma.toolRun.deleteMany(where)],
    ['auditLog', () => prisma.auditLog.deleteMany(where)],
    ['user', () => prisma.user.deleteMany(where)],
    ['company', () => prisma.company.delete({ where: { id: company.id } })],
  ];
  for (const [label, run] of steps) {
    try { await run(); } catch (error) { console.log(`  skip ${label}: ${error.message.split('\n')[0]}`); }
  }
  console.log('QA tenant removed');
}

const mode = process.argv[2] || 'seed';
(mode === 'clean' ? clean() : seed())
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
