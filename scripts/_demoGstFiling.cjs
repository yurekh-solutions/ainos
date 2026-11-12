// Demo tenant for the Finance > GST Reports > "File It Yourself" tab.
// Seeds one realistic marketplace-seller month through the real APIs, shows the
// pack with a genuine blocking defect, then repairs it and rebuilds — the same
// arc a seller follows. The tenant is left in place so the tab can be opened in
// a browser with the login printed at the end.
// Re-running wipes and rebuilds only this demo tenant.
// Run: node --env-file=.env scripts/_demoGstFiling.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const BASE = 'http://localhost:3000';
const EMAIL = 'demo.gst@ainos.test';
const PASSWORD = 'Demo@1234';
const GSTIN = '27AABCS5678F1Z3';          // state 27
let jar = {};
let COMPANY_ID = null;

const inr = (n) => `Rs ${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const NOW = new Date();
const WIN = `startDate=${isoDay(NOW).slice(0, 7)}-01&endDate=${isoDay(NOW)}`;

function merge(res) {
  for (const raw of (res.headers.getSetCookie?.() || [])) {
    const [pair] = raw.split(';'); const [k, ...v] = pair.split('=');
    if (k && v.length) jar[k.trim()] = v.join('=').trim();
  }
}
const cookie = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
async function api(method, path, body) {
  const opts = { method, headers: { Cookie: cookie() }, redirect: 'manual' };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(BASE + path, opts); merge(res);
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function wipe(c) {
  // Dependency order: the double-entry postings reference chart accounts, and
  // notes reference invoices, so those go first or Postgres refuses the delete.
  const journals = await prisma.journalEntry.findMany({ where: { companyId: c }, select: { id: true } });
  const accs = await prisma.account.findMany({ where: { companyId: c }, select: { id: true } });
  const soft = (p) => p.catch(() => {});
  await soft(prisma.ledgerEntry.deleteMany({ where: { OR: [{ journalId: { in: journals.map((j) => j.id) } }, { accountId: { in: accs.map((a) => a.id) } }] } }));
  await soft(prisma.journalEntry.deleteMany({ where: { companyId: c } }));
  await soft(prisma.gstFiling.deleteMany({ where: { companyId: c } }));
  await soft(prisma.creditNote.deleteMany({ where: { companyId: c } }));
  await soft(prisma.invoice.deleteMany({ where: { companyId: c } }));
  await soft(prisma.expense.deleteMany({ where: { companyId: c } }));
  await soft(prisma.customer.deleteMany({ where: { companyId: c } }));
  await soft(prisma.bankTransaction.deleteMany({ where: { companyId: c } }));
  await soft(prisma.bankAccount.deleteMany({ where: { companyId: c } }));
  await soft(prisma.account.updateMany({ where: { companyId: c }, data: { parentId: null } }));
  await soft(prisma.account.deleteMany({ where: { companyId: c } }));
  await soft(prisma.user.deleteMany({ where: { companyId: c } }));
  await soft(prisma.company.deleteMany({ where: { id: c } }));
}

async function provision() {
  console.log('\n=== 1. DEMO TENANT ===');
  // Wipe only the previous copy of this demo tenant.
  const old = await prisma.user.findUnique({ where: { email: EMAIL }, select: { companyId: true } });
  if (old?.companyId) await wipe(old.companyId);
  const company = await prisma.company.create({
    data: {
      name: 'Sharma Trading Co', gstNumber: GSTIN, state: 'Maharashtra', gstinStateCode: '27',
      email: EMAIL, phone: '9820000111', companyType: 'Private Limited',
      onboardingStatus: 'approved', createdBy: EMAIL, currency: 'INR',
      invoiceGen: 1, crmAccess: 1, subscriptionStatus: 'trialing',
    },
  });
  COMPANY_ID = company.id;
  await prisma.user.create({
    data: {
      name: 'Demo Seller', email: EMAIL, phone: '9820000111',
      password: await bcrypt.hash(PASSWORD, 10), role: 'owner',
      companyId: COMPANY_ID, emailVerifiedAt: new Date(),
    },
  });
  const csrf = await fetch(BASE + '/api/auth/csrf'); merge(csrf);
  const { csrfToken } = await csrf.json();
  const r = await fetch(BASE + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie() },
    body: new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD, callbackUrl: '/dashboard', json: 'true' }),
    redirect: 'manual',
  }); merge(r);
  const s = await api('GET', '/api/auth/session');
  console.log(`  signed in as ${s.data?.user?.email || 'FAILED'}`);
  console.log(`  company: ${company.name} (${GSTIN})`);
}

async function seedBooks() {
  console.log('\n=== 2. THE SELLER\'S MONTH (created through the normal invoice / expense forms) ===');
  const inv = async (label, body) => {
    const res = await api('POST', '/api/invoices', body);
    console.log(`  ${res.status === 201 ? 'ok ' : 'ERR'}  ${label.padEnd(34)} ${res.data?.invoiceNumber || ''}  tax ${res.data?.taxTotal ?? '-'}`);
    return res;
  };
  await inv('B2B within state, 12%', {
    customerName: 'Nexa Retail Pvt Ltd', customerGst: '27ABCDE1234F1Z5', supplyType: 'intra', status: 'paid',
    items: [{ productName: 'Cotton Kurti', price: 950, quantity: 40, gstRate: 12, hsnCode: '61091000' }],
  });
  const kerala = await inv('B2B other state, 18%', {
    customerName: 'Kerala Super Bazaar', customerGst: '32CCCCC5678D1Z5', supplyType: 'inter', status: 'sent',
    items: [{ productName: 'Kitchen Containers', price: 1200, quantity: 25, gstRate: 18, hsnCode: '3924' }],
  });
  await inv('Export consignment', {
    customerName: 'Dubai Home Supplies', customerGst: '07FGHIJ5678K1Z5', supplyType: 'inter', isExport: true, status: 'sent',
    items: [{ productName: 'Export Lot', price: 5000, quantity: 10, gstRate: 18, hsnCode: '61091000' }],
  });
  await inv('Nil-rated produce', {
    customerName: 'Mandai Wholesale', placeOfSupply: '27', supplyType: 'intra', status: 'sent',
    items: [{ productName: 'Fresh Vegetables', price: 42000, quantity: 1, gstRate: 0, hsnCode: '0701' }],
  });
  await inv('Large B2C order, other state', {
    customerName: 'Walkin Retail (unregistered)', placeOfSupply: '07', supplyType: 'inter', status: 'paid',
    items: [{ productName: 'Festive Box', price: 310000, quantity: 1, gstRate: 18, hsnCode: '4901' }],
  });
  await inv('Small counter sale', {
    customerName: 'Counter Sale', placeOfSupply: '27', supplyType: 'intra', status: 'sent',
    items: [{ productName: 'Loose Apparel', price: 2200, quantity: 1, gstRate: 5, hsnCode: '6109' }],
  });
  const broken = await inv('MISSING GSTIN + place of supply', {
    customerName: 'New Buyer Not Captured', supplyType: 'intra', status: 'sent',
    items: [{ productName: 'Sample Kit', price: 6000, quantity: 1, gstRate: 18, hsnCode: '6109' }],
  });

  console.log('\n  Purchases — the tax on these becomes your credit:');
  const exp = async (title, vendor, amount, taxAmount, approve) => {
    const e = await api('POST', '/api/expenses', { title, vendor, amount, taxAmount, paymentMethod: 'bank' });
    if (approve && e.data?.id) await api('PUT', '/api/expenses', { id: e.data.id, status: 'approved' });
    console.log(`  ${approve ? 'approved ' : 'PENDING  '} ${title.padEnd(30)} tax ${inr(taxAmount)}${approve ? '' : '  (not counted)'}`);
  };
  await exp('Amazon referral fees', 'Amazon Seller Services', 59000, 10620, true);
  await exp('Flipkart logistics', 'Flipkart Internet', 23600, 4248, true);
  await exp('Team dinner', 'Restobar', 8000, 1440, false);

  const cn = await api('POST', '/api/credit-notes', {
    invoiceId: kerala.data.id, customerName: 'Kerala Super Bazaar',
    subtotal: 12000, cgstAmount: 0, sgstAmount: 0, igstAmount: 2160, total: 14160, reason: '25 units returned',
  });
  console.log(`\n  Credit note issued against a delivered sale: ${cn.data?.noteNumber || 'FAILED'} (${inr(2160)} IGST back)`);
  return { broken: broken.data };
}

function showPack(tag, pack) {
  console.log(`\n=== ${tag} ===`);
  console.log(`  Tax period            ${pack.period}   (filed as ${pack.scheme})`);
  console.log(`  Invoices considered   ${pack.summary.invoiceCount}`);
  console.log(`  Output tax on sales   ${inr(pack.summary.outputTax)}`);
  console.log(`  Credit notes netted   ${inr(pack.gstr3b.table3.t315.downward)}`);
  console.log(`  Input credit claimed  ${inr(pack.summary.itcEligible)}`);
  console.log(`  Credit usable now     ${inr(pack.gstr3b.summary.itcUsed)}`);
  console.log(`  CASH TO PAY           ${inr(pack.summary.netTaxPayable)}`);
  if (pack.summary.creditCarriedForward > 0) {
    console.log(`  Credit left over      ${inr(pack.summary.creditCarriedForward)}  (CGST/SGST credit cannot pay an IGST liability)`);
  }
  for (const r of pack.due.returns) console.log(`  ${r.form} due`.padEnd(24) + r.dueDate);
  console.log(`  Late fee + interest if filed today: ${inr(pack.fees.total)} (${pack.fees.daysLate} day(s) past due)`);

  const v = pack.validation;
  console.log(`\n  Data check: ${v.checked} invoices, ${v.blocking.length} blocking, ${v.warnings.length} warning(s), clean=${v.clean}`);
  for (const b of v.blocking) console.log(`    BLOCK  ${b.invoiceNumber} · ${b.field} — ${b.message}`);
  for (const w of v.warnings) console.log(`    warn   ${w.invoiceNumber} · ${w.field} — ${w.message}`);

  const doc = pack.gstr1.docdata;
  const count = Object.entries(doc).filter(([, x]) => Array.isArray(x) && x.length).map(([k, x]) => `${k}:${x.length}`);
  console.log(`\n  Portal JSON sections filled: ${count.join('  ')}`);
  const first = (doc.b2b || [])[0];
  if (first) console.log(`  Sample B2B row: ${first.inum} pos=${first.pos} val=${first.val} gstin=${first.rchgs} tax=${first.itms.reduce((s, i) => s + i.iamt + i.camt + i.samt, 0)}`);
}

async function main() {
  await provision();
  const { broken } = await seedBooks();

  const first = await api('GET', `/api/gst-reports/filing-pack?${WIN}`);
  showPack('3. PACK BEFORE THE FIX — the tab flags what the portal would reject', first.data);

  console.log('\n=== 4. FIX THE FLAGGED ROW (what the "Fix" link takes you to) ===');
  const fixed = await api('PUT', '/api/invoices', { id: broken.id, customerGstNumber: '27DDDDD2345E1Z5', placeOfSupply: '27' });
  console.log(`  ${broken.invoiceNumber} now carries GSTIN 27DDDDD2345E1Z5 :: ${fixed.status === 200 ? 'saved' : 'FAILED'}`);

  const second = await api('GET', `/api/gst-reports/filing-pack?${WIN}`);
  showPack('5. PACK AFTER THE FIX — ready to upload', second.data);

  const t = second.data.gstr3b.table3;
  console.log('\n=== 6. WHAT TO TYPE ON gst.gov.in (GSTR-3B) ===');
  console.log(`  3.1.0 Outward supplies (non-GST / exempt)      ${inr(t.t312.exempt)}`);
  console.log(`  3.1.3 Inter-state supplies  IGST               ${inr(t.t313.igst)}`);
  console.log(`  3.1.4 Intra-state supplies  CGST / SGST        ${inr(t.t314.cgst)} / ${inr(t.t314.sgst)}`);
  console.log(`  3.1.5 Zero-rated on payment of tax             ${inr(t.t316.igst)}`);
  console.log(`  3.1.5 Downward adjustments (credit notes)      ${inr(t.t315.downward)}`);
  console.log(`  4.18 Net ITC available                         ${inr(second.data.gstr3b.table4.net.cgst + second.data.gstr3b.table4.net.sgst)}`);
  const u = second.data.gstr3b.utilisation;
  console.log(`  6.1   Paid from credit / paid in cash          ${inr(u.itcUsed.igst + u.itcUsed.cgst + u.itcUsed.sgst)} / ${inr(u.cashPaid.igst + u.cashPaid.cgst + u.cashPaid.sgst)}`);
  console.log('\n  Checklist on screen walks through: GST portal login > Returns Dashboard > GSTR-1 upload > challan > GSTR-3B > verify and file.');
  console.log('\n=== BROWSER DEMO LOGIN ===');
  console.log(`  ${BASE}/auth/signin   ${EMAIL} / ${PASSWORD}`);
  console.log(`  Then: Finance > GST Reports > File It Yourself`);
}

main().catch((e) => { console.error('DEMO ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
