const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the admin user (yurekh solutions admin)
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'yurekh' } },
    include: { company: true }
  });

  if (!user) {
    console.error('❌ No user found. Please log in first.');
    process.exit(1);
  }

  const companyId = user.companyId;
  console.log(`✅ Seeding for: ${user.email} (Company: ${companyId})`);

  // ─── CUSTOMERS ───
  const customers = [
    { name: 'Rajesh Enterprises', email: 'rajesh@rajeshent.in', phone: '9876543210', company: 'Rajesh Enterprises Pvt Ltd', address: '42 MG Road, Pune, Maharashtra 411001', gstNumber: '27AABCU9603R1ZM', panNumber: 'AABCU9603R', state: 'Maharashtra', pincode: '411001', status: 'active' },
    { name: 'Priya Sharma', email: 'priya.sharma@gmail.com', phone: '9123456780', company: '', address: '15 Koramangala, Bangalore, Karnataka 560034', gstNumber: '29ABCDE1234F1Z5', panNumber: 'ABCDE1234F', state: 'Karnataka', pincode: '560034', status: 'active' },
    { name: 'Amit Kumar Agarwal', email: 'amit@agarwaltraders.com', phone: '9988776655', company: 'Agarwal Traders', address: '88 Salt Lake, Kolkata, West Bengal 700091', gstNumber: '19XYZAB5678C1Z3', panNumber: 'XYZAB5678C', state: 'West Bengal', pincode: '700091', status: 'active' },
    { name: 'Sneha Patil', email: 'sneha.patil@outlook.com', phone: '9765432108', company: '', address: '23 Bandra West, Mumbai, Maharashtra 400050', gstNumber: '', panNumber: '', state: 'Maharashtra', pincode: '400050', status: 'active' },
    { name: 'Vikram Singh Rathore', email: 'vikram@rathoreindustries.in', phone: '9001234567', company: 'Rathore Industries', address: '7 Civil Lines, Jaipur, Rajasthan 302001', gstNumber: '08MNOPQ2468D1Z1', panNumber: 'MNOPQ2468D', state: 'Rajasthan', pincode: '302001', status: 'active' },
    { name: 'Ananya Reddy', email: 'ananya.reddy@techsolutions.io', phone: '9345678901', company: 'TechSolutions Pvt Ltd', address: '56 HITEC City, Hyderabad, Telangana 500081', gstNumber: '36RSTUV1357G1Z2', panNumber: 'RSTUV1357G', state: 'Telangana', pincode: '500081', status: 'active' },
    { name: 'Mohd. Irfan Khan', email: 'irfan@khanexports.com', phone: '9876501234', company: 'Khan Exports', address: '12 Jama Masjid Rd, Delhi 110006', gstNumber: '07WXYZA9753E1Z4', panNumber: 'WXYZA9753E', state: 'Delhi', pincode: '110006', status: 'active' },
    { name: 'Lakshmi Narayanan', email: 'lakshmi@narayanan.co.in', phone: '9567890123', company: 'Narayanan & Associates', address: '34 T. Nagar, Chennai, Tamil Nadu 600017', gstNumber: '33BCDEF4567H1Z8', panNumber: 'BCDEF4567H', state: 'Tamil Nadu', pincode: '600017', status: 'active' }
  ];

  console.log('\n📦 Creating customers...');
  const createdCustomers = [];
  for (const c of customers) {
    const created = await prisma.customer.create({ data: { ...c, companyId } });
    createdCustomers.push(created);
    console.log(`  ✅ ${created.name}`);
  }

  // ─── PRODUCTS ───
  const products = [
    { name: 'Website Design & Development', sku: 'WEB-001', category: 'Services', description: 'Full-stack responsive website with CMS, SEO optimization, and mobile-first design', price: 50000, cost: 20000, costPrice: 20000, mrp: 60000, hsnCode: '998314', barcode: '8901234560001', gstRate: 18, stock: 999, unit: 'service', status: 'active' },
    { name: 'Social Media Marketing Package', sku: 'SMM-001', category: 'Marketing', description: 'Monthly social media management — content creation, scheduling, analytics for 3 platforms', price: 25000, cost: 8000, costPrice: 8000, mrp: 30000, hsnCode: '998315', barcode: '8901234560002', gstRate: 18, stock: 999, unit: 'service', status: 'active' },
    { name: 'Logo & Brand Identity Design', sku: 'DES-001', category: 'Design', description: 'Complete brand identity — logo, color palette, typography, brand guidelines document', price: 15000, cost: 5000, costPrice: 5000, mrp: 18000, hsnCode: '998316', barcode: '8901234560003', gstRate: 18, stock: 999, unit: 'service', status: 'active' },
    { name: 'SEO Optimization (Monthly)', sku: 'SEO-001', category: 'Marketing', description: 'On-page + off-page SEO, keyword research, backlink building, monthly performance report', price: 20000, cost: 6000, costPrice: 6000, mrp: 25000, hsnCode: '998317', barcode: '8901234560004', gstRate: 18, stock: 999, unit: 'service', status: 'active' },
    { name: 'E-Commerce Store Setup', sku: 'ECOM-001', category: 'Services', description: 'Complete e-commerce setup with payment gateway, inventory management, and order tracking', price: 75000, cost: 30000, costPrice: 30000, mrp: 90000, hsnCode: '998314', barcode: '8901234560005', gstRate: 18, stock: 999, unit: 'service', status: 'active' },
    { name: 'Business Card Printing (500 pcs)', sku: 'PRN-001', category: 'Printing', description: 'Premium 350 GSM matte business cards with spot UV finish, 500 pieces', price: 1500, cost: 600, costPrice: 600, mrp: 2000, hsnCode: '4908', barcode: '8901234560006', gstRate: 18, stock: 200, unit: 'pcs', status: 'active' },
    { name: 'Annual Maintenance Contract', sku: 'AMC-001', category: 'Services', description: '12-month website maintenance — bug fixes, security patches, uptime monitoring, 4hr SLA', price: 36000, cost: 12000, costPrice: 12000, mrp: 42000, hsnCode: '998314', barcode: '8901234560007', gstRate: 18, stock: 999, unit: 'service', status: 'active' },
    { name: 'Product Photography (per product)', sku: 'PHO-001', category: 'Design', description: 'Professional product photography — 5 angles, white background, retouched high-res images', price: 2500, cost: 800, costPrice: 800, mrp: 3000, hsnCode: '998318', barcode: '8901234560008', gstRate: 18, stock: 999, unit: 'service', status: 'active' },
    { name: 'Google Ads Management', sku: 'ADS-001', category: 'Marketing', description: 'Monthly Google Ads campaign management — keyword research, ad copy, bid optimization, reporting', price: 18000, cost: 5000, costPrice: 5000, mrp: 22000, hsnCode: '998315', barcode: '8901234560009', gstRate: 18, stock: 999, unit: 'service', status: 'active' },
    { name: 'Content Writing (per blog)', sku: 'CON-001', category: 'Services', description: 'SEO-optimized 1500-word blog post with keyword research, meta description, and internal linking', price: 3000, cost: 1000, costPrice: 1000, mrp: 4000, hsnCode: '998319', barcode: '8901234560010', gstRate: 18, stock: 999, unit: 'service', status: 'active' },
    { name: 'Hosting & Domain (Annual)', sku: 'HST-001', category: 'Hosting', description: 'Premium cloud hosting + domain registration, SSL certificate, daily backups, 99.9% uptime', price: 8000, cost: 3500, costPrice: 3500, mrp: 10000, hsnCode: '998314', barcode: '8901234560011', gstRate: 18, stock: 500, unit: 'service', status: 'active' },
    { name: 'WhatsApp Chatbot Setup', sku: 'BOT-001', category: 'Services', description: 'Custom WhatsApp Business API chatbot with auto-reply, catalog, and order tracking integration', price: 30000, cost: 10000, costPrice: 10000, mrp: 38000, hsnCode: '998314', barcode: '8901234560012', gstRate: 18, stock: 999, unit: 'service', status: 'active' }
  ];

  console.log('\n🛒 Creating products...');
  const createdProducts = [];
  for (const p of products) {
    const created = await prisma.product.create({ data: { ...p, companyId } });
    createdProducts.push(created);
    console.log(`  ✅ ${created.name} (₹${created.price?.toLocaleString('en-IN')})`);
  }

  // ─── EXPENSES ───
  const expenses = [
    { category: 'Software', description: 'Adobe Creative Suite — Annual Team License', amount: 54000, date: new Date('2026-01-15'), status: 'approved' },
    { category: 'Office', description: 'WeWork Coworking Space — Monthly Rent (8 seats)', amount: 96000, date: new Date('2026-01-01'), status: 'approved' },
    { category: 'Salaries', description: 'Developer Salaries — January 2026 (3 team members)', amount: 240000, date: new Date('2026-01-31'), status: 'approved' },
    { category: 'Marketing', description: 'Google Ads Campaign — AINOS Platform Promotion', amount: 15000, date: new Date('2026-02-05'), status: 'approved' },
    { category: 'Software', description: 'AWS Cloud Hosting — Monthly Bill', amount: 12500, date: new Date('2026-02-01'), status: 'approved' },
    { category: 'Travel', description: 'Client Meeting — Mumbai to Pune (Rajesh Enterprises)', amount: 3500, date: new Date('2026-02-10'), status: 'approved' },
    { category: 'Utilities', description: 'Electricity + Internet — Office Feb 2026', amount: 8500, date: new Date('2026-02-28'), status: 'approved' },
    { category: 'Marketing', description: 'LinkedIn Premium Campaign — Brand Awareness', amount: 20000, date: new Date('2026-03-01'), status: 'pending' },
    { category: 'Software', description: 'Figma Enterprise — Design Team (5 seats)', amount: 37500, date: new Date('2026-03-05'), status: 'approved' },
    { category: 'Salaries', description: 'Designer Salary — February 2026', amount: 65000, date: new Date('2026-02-28'), status: 'approved' },
    { category: 'Office', description: 'Office Supplies — Printer Cartridges, Stationery', amount: 4200, date: new Date('2026-03-12'), status: 'pending' },
    { category: 'Legal', description: 'CA Consultation — GST Filing & Compliance Review', amount: 15000, date: new Date('2026-03-15'), status: 'approved' },
    { category: 'Software', description: 'Notion Team Plan — Project Management', amount: 9600, date: new Date('2026-03-20'), status: 'approved' },
    { category: 'Marketing', description: 'Instagram Sponsored Posts — Client Acquisition', amount: 12000, date: new Date('2026-03-22'), status: 'pending' },
    { category: 'Utilities', description: 'Phone Bills — Team Mobile Reimbursement (6 members)', amount: 7200, date: new Date('2026-03-25'), status: 'approved' }
  ];

  console.log('\n💸 Creating expenses...');
  for (const e of expenses) {
    const created = await prisma.expense.create({ data: { ...e, companyId } });
    console.log(`  ✅ ${created.description} — ₹${created.amount.toLocaleString('en-IN')}`);
  }

  // ─── SUMMARY ───
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalProductValue = createdProducts.reduce((s, p) => s + (p.price || 0), 0);

  console.log('\n══════════════════════════════════════════');
  console.log('  ✅ SEED COMPLETE');
  console.log('══════════════════════════════════════════');
  console.log(`  👥 Customers: ${createdCustomers.length}`);
  console.log(`  🛒 Products:  ${createdProducts.length} (total catalog value: ₹${totalProductValue.toLocaleString('en-IN')})`);
  console.log(`  💸 Expenses:  ${expenses.length} (total: ₹${totalExpense.toLocaleString('en-IN')})`);
  console.log('══════════════════════════════════════════');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
