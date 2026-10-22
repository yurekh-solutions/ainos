// AINOS full E2E module test — register, approve, login, CRUD every module.
// Run: node --env-file=.env scripts/_fullTest.cjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const results = [];
let cookie = '';
let csrf = '';

async function req(method, path, body, timeoutMs = 30000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
      signal: ac.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, json, text: text.slice(0, 300), ms: Date.now() - started };
  } catch (e) {
    return { status: 0, json: null, text: e.message, ms: Date.now() - started };
  } finally { clearTimeout(t); }
}

function log(name, r, okStatuses = [200, 201]) {
  const pass = okStatuses.includes(r.status);
  results.push({ name, status: r.status, pass, ms: r.ms, note: pass ? '' : r.text });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} -> ${r.status} (${r.ms}ms)${pass ? '' : ' :: ' + r.text}`);
  return pass;
}

function pickId(r) {
  return r.json && (r.json.id || (r.json.data && r.json.data.id)) || null;
}

const today = new Date().toISOString().slice(0, 10);
const stamp = Date.now();
const TEST_EMAIL = `aitest${stamp}@example.com`;
const P = { name: 'Test Item', title: 'Test Item', email: `t${stamp}@example.com`, phone: '9876500000', description: 'test', notes: 'test', quantity: 2, price: 100, amount: 200, rate: 18, status: 'draft', type: 'product', date: today, address: 'Test Address', city: 'Indore', state: 'MP', gstin: '', category: 'general' };

async function main() {
  // 1. Register company
  const reg = await req('POST', '/api/auth/register-company', {
    name: 'AI Test Owner', email: TEST_EMAIL, phone: '9876500000', password: 'testpass123',
    companyName: `AITEST Co ${stamp}`, companyType: 'Private Limited', companyEmail: TEST_EMAIL,
    companyPhone: '9876500000', companyAddress: 'Test Address', country: 'India',
  }, 60000);
  log('auth/register-company', reg, [200, 201]);
  if (reg.status !== 200 && reg.status !== 201) return console.log('ABORT: registration failed');

  // 2. Approve company (admin gate bypass for test)
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user?.companyId) return console.log('ABORT: no companyId on user');
  await prisma.company.update({ where: { id: user.companyId }, data: { onboardingStatus: 'approved' } });
  console.log('Company approved:', user.companyId);

  // 3. Login via NextAuth credentials
  const csrfRes = await fetch(BASE + '/api/auth/csrf');
  csrf = (await csrfRes.json()).csrfToken;
  const jar = {};
  for (const c of csrfRes.headers.getSetCookie()) { const [kv] = c.split(';'); const [k, ...v] = kv.split('='); jar[k.trim()] = v.join('='); }
  const loginRes = await fetch(BASE + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ') },
    body: new URLSearchParams({ csrfToken: csrf, email: TEST_EMAIL, password: 'testpass123', callbackUrl: BASE + '/dashboard', json: 'true' }),
    redirect: 'manual',
  });
  for (const c of loginRes.headers.getSetCookie()) { const [kv] = c.split(';'); const [k, ...v] = kv.split('='); jar[k.trim()] = v.join('='); }
  cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
  const sess = await req('GET', '/api/auth/session');
  const loggedIn = sess.json && sess.json.user && sess.json.user.email === TEST_EMAIL;
  results.push({ name: 'auth/login (session)', status: loggedIn ? 200 : sess.status, pass: loggedIn, ms: sess.ms, note: loggedIn ? '' : sess.text });
  console.log(`[${loggedIn ? 'PASS' : 'FAIL'}] auth/login -> ${loggedIn ? 'session ok' : sess.text}`);
  if (!loggedIn) return;

  // Health/ping
  log('health', await req('GET', '/api/health'));
  log('ping', await req('GET', '/api/ping'));
  log('company GET', await req('GET', '/api/company'));
  log('user/profile PUT', await req('PUT', '/api/user/profile', { name: 'AI Test Owner' }));
  log('notifications GET', await req('GET', '/api/notifications'));

  // ---------- FINANCE ----------
  let r;
  r = await req('POST', '/api/customers', { name: 'Test Customer', email: P.email, phone: P.phone, address: P.address });
  const customerId = pickId(r);
  log('customers POST', r);
  r = await req('POST', '/api/products', { name: 'Test Product', price: 100, quantity: 10, description: 'test', category: 'general', hsn: '1234', gstRate: 18 });
  const productId = pickId(r);
  if (log('products POST', r) && productId) log('products PUT', await req('PUT', `/api/products/${productId}`, { name: 'Test Product 2', price: 120 }));
  r = await req('POST', '/api/vendors', { name: 'Test Vendor', email: P.email, phone: P.phone, address: P.address });
  const vendorId = pickId(r);
  log('vendors POST', r);
  r = await req('POST', '/api/invoices', { customerName: 'Test Customer', customerEmail: P.email, customerAddress: P.address, items: [{ productId, name: 'Test Product', quantity: 1, price: 100, gstRate: 18 }], dueDate: today, notes: 'test', status: 'sent' });
  const invoiceId = pickId(r);
  log('invoices POST', r);
  if (invoiceId) {
    log('invoices PUT', await req('PUT', '/api/invoices', { id: invoiceId, status: 'paid', paidAmount: 100 }));
    log('invoices DELETE', await req('DELETE', `/api/invoices?id=${invoiceId}`, undefined));
  }
  r = await req('POST', '/api/quotes', { customerId, items: [{ name: 'Test Product', quantity: 1, price: 100 }], validUntil: today, notes: 'test' });
  const quoteId = pickId(r);
  if (log('quotes POST', r) && quoteId) log('quotes PUT', await req('PUT', '/api/quotes', { id: quoteId, status: 'accepted' }));
  r = await req('POST', '/api/sales-orders', { customerId, items: [{ name: 'Test Product', quantity: 1, price: 100 }], orderDate: today, status: 'draft' });
  const soId = pickId(r);
  if (log('sales-orders POST', r) && soId) log('sales-orders PUT', await req('PUT', '/api/sales-orders', { id: soId, status: 'confirmed' }));
  r = await req('POST', '/api/purchase-orders', { vendorId, vendorName: 'Test Vendor', items: [{ name: 'Test Product', quantity: 1, price: 100 }], subtotal: 100, tax: 18, total: 118, orderDate: today, status: 'draft' });
  const poId = pickId(r);
  log('purchase-orders POST', r);
  r = await req('POST', '/api/expenses', { description: 'Test Expense', amount: 500, category: 'office', date: today, vendor: 'Test Vendor', paymentMethod: 'cash' });
  const expenseId = pickId(r);
  if (log('expenses POST', r) && expenseId) log('expenses PUT', await req('PUT', '/api/expenses', { id: expenseId, amount: 600 }));
  r = await req('POST', '/api/delivery-challans', { customerId, customerName: 'Test Customer', items: [{ name: 'Test Product', quantity: 1 }], challanDate: today });
  const dcId = pickId(r);
  if (log('delivery-challans POST', r) && dcId) log('delivery-challans PUT', await req('PUT', '/api/delivery-challans', { id: dcId, status: 'delivered' }));
  r = await req('POST', '/api/credit-notes', { customerId, amount: 50, reason: 'test', date: today });
  const cnId = pickId(r);
  log('credit-notes POST', r);
  r = await req('POST', '/api/debit-notes', { vendorId, amount: 50, reason: 'test', date: today });
  const dnId = pickId(r);
  log('debit-notes POST', r);
  r = await req('POST', '/api/accounts', { code: `A${stamp % 100000}`, name: 'Test Account', type: 'asset', description: 'test' });
  const accountId = pickId(r);
  if (log('accounts POST', r) && accountId) log('accounts PUT', await req('PUT', '/api/accounts', { id: accountId, name: 'Test Account 2' }));
  r = await req('POST', '/api/journal-entries', { date: today, description: 'test entry', reference: 'REF1', entries: [{ accountId, debit: 100, credit: 0 }, { accountId, debit: 0, credit: 100 }] });
  const jeId = pickId(r);
  log('journal-entries POST', r);
  r = await req('POST', '/api/bank-accounts', { name: 'Test Bank', accountNumber: `ACC${stamp}`, balance: 1000, ifscCode: 'TEST0000001', bankName: 'Test Bank' });
  const bankId = pickId(r);
  log('bank-accounts POST', r);
  r = await req('POST', '/api/warehouses', { name: 'Test Warehouse', location: 'Indore', capacity: 100 });
  const whId = pickId(r);
  log('warehouses POST', r);
  log('stock GET', await req('GET', '/api/stock'));
  log('gst-reports GET', await req('GET', '/api/gst-reports'));
  log('daybook GET', await req('GET', '/api/daybook?date=' + today));
  log('reports GET', await req('GET', '/api/reports'));
  log('payment-reminders GET', await req('GET', '/api/payment-reminders'));
  log('recurring-invoices GET', await req('GET', '/api/recurring-invoices'));
  r = await req('POST', '/api/invoice-templates', { name: 'AITEST Template', colors: { primary: '#5b21b6' }, isDefault: false });
  const itId = pickId(r);
  if (log('invoice-templates POST', r) && itId) log('invoice-templates DELETE', await req('DELETE', `/api/invoice-templates?id=${itId}`, undefined));
  log('barcode POST', await req('POST', '/api/barcode', { text: 'AITEST' }));
  log('tally export GET', await req('GET', '/api/tally?export=true'));

  // ---------- CRM ----------
  r = await req('POST', '/api/leads', { name: 'Test Lead', email: P.email, phone: P.phone, source: 'website', status: 'new', value: 5000, notes: 'test' });
  const leadId = pickId(r);
  if (log('leads POST', r) && leadId) log('leads PUT', await req('PUT', '/api/leads', { id: leadId, status: 'contacted' }));
  r = await req('POST', '/api/contacts', { name: 'Test Contact', email: P.email, phone: P.phone, company: 'AITEST' });
  const contactId = pickId(r);
  log('contacts POST', r);
  r = await req('POST', '/api/deals', { title: 'Test Deal', value: 10000, customerId, stage: 'qualification', status: 'open' });
  const dealId = pickId(r);
    log('deals POST', r);
  r = await req('POST', '/api/follow-ups', { leadId, title: 'Test Follow-up', dueDate: today, type: 'call', notes: 'test' });
  const fuId = pickId(r);
  log('follow-ups POST', r);

  // ---------- HR ----------
  r = await req('POST', '/api/employees', { name: 'Test Employee', email: P.email, phone: P.phone, role: 'developer', department: 'tech', salary: 30000, joinDate: today });
  const empId = pickId(r);
    log('employees POST', r);
  if (empId) {
    log('attendance POST', await req('POST', '/api/attendance', { employeeId: empId, date: today, status: 'present', checkIn: '09:00', checkOut: '18:00' }));
    log('leaves POST', await req('POST', '/api/leaves', { employeeId: empId, leaveType: 'sick', startDate: today, endDate: today, reason: 'test' }));
    log('payroll POST', await req('POST', '/api/payroll', { period: today.slice(0, 7), startDate: today, endDate: today, totalAmount: 30000, status: 'pending' }));
    log('timesheets POST', await req('POST', '/api/timesheets', { employeeId: empId, date: today, hours: 8, project: 'internal', notes: 'test' }));
  }
  log('team GET', await req('GET', '/api/team'));

  // ---------- PROJECTS / SUPPORT ----------
  r = await req('POST', '/api/projects', { name: 'Test Project', description: 'test', status: 'active', startDate: today, deadline: today, customerId });
  const projId = pickId(r);
  if (log('projects POST', r) && projId) {
    log('projects PATCH', await req('PATCH', `/api/projects/${projId}`, { status: 'on_hold' }));
    r = await req('POST', '/api/tasks', { projectId: projId, title: 'Test Task', status: 'todo', priority: 'high', dueDate: today });
    const taskId = pickId(r);
    if (log('tasks POST', r) && taskId) log('tasks PATCH', await req('PATCH', `/api/tasks/${taskId}`, { status: 'done' }));
  }
  r = await req('POST', '/api/helpdesk', { subject: 'Test Ticket', description: 'test', priority: 'medium', customerEmail: P.email, customerId });
  const ticketId = pickId(r);
    log('helpdesk POST', r);
  r = await req('POST', '/api/knowledge-base', { title: 'Test Article', content: 'test content', category: 'general', status: 'published' });
  const kbId = pickId(r);
  if (log('knowledge-base POST', r) && kbId) log('knowledge-base PUT', await req('PUT', '/api/knowledge-base', { id: kbId, title: 'Test Article 2' }));
  r = await req('POST', '/api/service-requests', { title: 'Test SR', description: 'test', type: 'installation', customerId, status: 'new' });
  const srId = pickId(r);
  log('service-requests POST', r);
  r = await req('POST', '/api/candidates', { name: 'Test Candidate', email: P.email, phone: P.phone, position: 'developer', status: 'applied', source: 'website' });
  const candId = pickId(r);
  if (log('candidates POST', r) && candId) log('candidates PUT', await req('PUT', '/api/candidates', { id: candId, status: 'screening' }));

  // ---------- ECOMMERCE ----------
  r = await req('POST', '/api/ecommerce/stores', { name: 'AITEST Store', description: 'test', status: 'active', url: `aitest${stamp}.example.com` });
  const storeId = pickId(r);
  log('ecommerce/stores POST', r);
  r = await req('POST', '/api/ecommerce/products', { name: 'Test Ecom Product', price: 199, stock: 5, storeId, description: 'test', status: 'active' });
  const ecomProductId = pickId(r);
  log('ecommerce/products POST', r);
  r = await req('POST', '/api/ecommerce/coupons', { code: `AITEST${stamp % 100000}`, discountType: 'percent', discountValue: 10, status: 'active', storeId });
  const couponId = pickId(r);
  log('ecommerce/coupons POST', r);
  r = await req('POST', '/api/ecommerce/orders', { storeId, items: [{ productId: ecomProductId, quantity: 1, price: 199 }], customerName: 'Test Buyer', customerEmail: P.email, total: 199, status: 'pending' });
  const ecomOrderId = pickId(r);
  if (log('ecommerce/orders POST', r) && ecomOrderId) log('ecommerce/orders PUT', await req('PUT', `/api/ecommerce/orders?id=${ecomOrderId}`, { status: 'confirmed' }));
  log('ecommerce/reviews GET', await req('GET', '/api/ecommerce/reviews'));

  // ---------- POS ----------
  r = await req('POST', '/api/pos/products', { name: 'Test POS Item', price: 50, barcode: `PB${stamp}`, category: 'general', stock: 20 });
  const posProductId = pickId(r);
  log('pos/products POST', r);
  r = await req('POST', '/api/pos/sessions', { registerName: 'AITEST Register', openingCash: 500, status: 'open' });
  const sessionId = pickId(r);
  log('pos/sessions POST', r);
  if (sessionId) {
    r = await req('POST', '/api/pos/orders', { sessionId, items: [{ productId: posProductId, name: 'Test POS Item', quantity: 1, price: 50 }], total: 50, paymentMethod: 'cash' });
    const posOrderId = pickId(r);
    log('pos/orders POST', r);
    log('pos/sessions PUT close', await req('PUT', `/api/pos/sessions?id=${sessionId}`, { status: 'closed', closingCash: 550 }));
  }

  // ---------- MANUFACTURING ----------
  r = await req('POST', '/api/manufacturing?type=boms', { name: 'Test BOM', product: 'Test Product', quantity: 1, components: [] });
  const bomId = pickId(r);
  if (log('manufacturing/boms POST', r) && bomId) {
    log('manufacturing/boms PUT', await req('PUT', `/api/manufacturing?id=${bomId}&type=boms`, { name: 'Test BOM 2', product: 'Test Product 2', quantity: 2 }));
  }
  r = await req('POST', '/api/manufacturing?type=orders', { productName: 'Test Product', quantity: 5, plannedDate: today });
  const moId = pickId(r);
  if (log('manufacturing/orders POST', r) && moId) {
    log('manufacturing/orders PUT', await req('PUT', `/api/manufacturing?id=${moId}&type=orders`, { status: 'in_progress', quantity: 6 }));
  }
  r = await req('POST', '/api/manufacturing?type=quality', { productName: 'Test Product', checkType: 'visual' });
  const qcId = pickId(r);
  if (log('manufacturing/quality POST', r) && qcId) log('manufacturing/quality PUT', await req('PUT', `/api/manufacturing?id=${qcId}&type=quality`, { result: 'passed' }));
  r = await req('POST', '/api/manufacturing?type=scrap', { product: 'Test Product', quantity: 1, reason: 'damaged' });
  const scrapId = pickId(r);
  log('manufacturing/scrap POST', r);
  r = await req('POST', '/api/manufacturing?type=workcenters', { name: 'Test WC', capacity: 10, costPerHour: 100 });
  const wcId = pickId(r);
  if (log('manufacturing/workcenters POST', r) && wcId) log('manufacturing/workcenters PUT', await req('PUT', `/api/manufacturing?id=${wcId}&type=workcenters`, { name: 'Test WC 2', capacity: 20 }));

  // ---------- MARKETING / CONTENT ----------
  r = await req('POST', '/api/calendar', { title: 'Test Event', date: today, type: 'meeting', description: 'test' });
  const calId = pickId(r);
  if (log('calendar POST', r) && calId) log('calendar PUT', await req('PUT', '/api/calendar', { id: calId, title: 'Test Event 2' }));
  log('calendar GET', await req('GET', '/api/calendar'));
  log('compliance GET', await req('GET', '/api/compliance'));
  log('automations GET', await req('GET', '/api/automations'));
  log('email-campaigns GET', await req('GET', '/api/email-campaigns'));
  log('blog-posts GET', await req('GET', '/api/blog-posts'));
  log('tools GET', await req('GET', '/api/tools'));
  log('ai-tools GET', await req('GET', '/api/ai-tools'));
  log('seo/overview GET', await req('GET', '/api/seo/overview'));

  // ---------- TOOL EXECUTOR (real handlers) ----------
  r = await req('POST', '/api/tools/execute', { toolSlug: 'lead-scoring-ai', input: {} }, 60000);
  log('tools/execute lead-scoring-ai', r);
  r = await req('POST', '/api/tools/execute', { toolSlug: 'data-export', input: { dataset: 'customers', format: 'csv' } }, 60000);
  log('tools/execute data-export', r);
  r = await req('POST', '/api/tools/execute', { toolSlug: 'invoice-generator', input: { customerName: 'Tool Customer', items: [{ name: 'Tool Item', quantity: 1, price: 250 }] } }, 60000);
  log('tools/execute invoice-generator', r);

  // ---------- CLEANUP (created rows via API) ----------
  const dels = [
    ['scrap', scrapId, '/api/manufacturing?id=', '&type=scrap'],
    ['wc', wcId, '/api/manufacturing?id=', '&type=workcenters'],
    ['qc', qcId, '/api/manufacturing?id=', '&type=quality'],
    ['mo', moId, '/api/manufacturing?id=', '&type=orders'],
    ['bom', bomId, '/api/manufacturing?id=', '&type=boms'],
    ['coupon', couponId, '/api/ecommerce/coupons?id=', ''],
    ['ecomProduct', ecomProductId, '/api/ecommerce/products?id=', ''],
    ['ecomOrder', ecomOrderId, '/api/ecommerce/orders?id=', ''],
    ['store', storeId, '/api/ecommerce/stores?id=', ''],
    ['posProduct', posProductId, '/api/pos/products?id=', ''],
    ['sr', srId, '/api/service-requests?id=', ''],
    ['kb', kbId, '/api/knowledge-base?id=', ''],
    ['ticket', ticketId, '/api/helpdesk?id=', ''],
    ['cand', candId, '/api/candidates?id=', ''],
    ['fu', fuId, '/api/follow-ups?id=', ''],
    ['deal', dealId, '/api/deals?id=', ''],
    ['contact', contactId, '/api/contacts?id=', ''],
    ['lead', leadId, '/api/leads?id=', ''],
    ['po', poId, '/api/purchase-orders?id=', ''],
    ['so', soId, '/api/sales-orders?id=', ''],
    ['quote', quoteId, '/api/quotes?id=', ''],
    ['dc', dcId, '/api/delivery-challans?id=', ''],
    ['cn', cnId, '/api/credit-notes?id=', ''],
    ['dn', dnId, '/api/debit-notes?id=', ''],
    ['je', jeId, '/api/journal-entries?id=', ''],
    ['bank', bankId, '/api/bank-accounts?id=', ''],
    ['expense', expenseId, '/api/expenses?id=', ''],
    ['wh', whId, '/api/warehouses?id=', ''],
    ['product', productId, '/api/products/', ''],
    ['vendor', vendorId, '/api/vendors?id=', ''],
    ['customer', customerId, '/api/customers?id=', ''],
  ];
  for (const [label, id, prefix, suffix] of dels) {
    if (!id) continue;
    const d = await req('DELETE', prefix + id + suffix, undefined);
    if (![200, 201].includes(d.status)) console.log(`[cleanup-skip] ${label}: ${d.status} ${d.text.slice(0, 120)}`);
  }
  console.log('Cleanup done (API-deleted created rows).');

  // ---------- CLEANUP: previous AITEST leftovers + this run's company ----------
  try {
    const testCompanies = await prisma.company.findMany({ where: { name: { startsWith: 'AITEST Co' } } });
    for (const c of testCompanies) {
      for (const m of ['posOrder', 'posSession', 'contact', 'purchaseOrder', 'creditNote', 'debitNote', 'journalEntry', 'warehouse', 'customer', 'product', 'vendor', 'expense', 'lead', 'deal', 'employee', 'helpdeskTicket', 'serviceRequest', 'calendarEvent', 'candidate', 'knowledgeArticle']) {
        try { await prisma[m].deleteMany({ where: { companyId: c.id } }); } catch {}
      }
      await prisma.user.deleteMany({ where: { companyId: c.id } });
      await prisma.company.delete({ where: { id: c.id } }).catch(() => {});
    }
    await prisma.user.deleteMany({ where: { email: { startsWith: 'aitest' } } });
    console.log('Prisma cleanup done for', testCompanies.length, 'AITEST companies.');
  } catch (e) { console.log('Prisma cleanup skipped:', e.message); }

  // ---------- SUMMARY ----------
  const pass = results.filter(r => r.pass).length;
  const fail = results.filter(r => !r.pass);
  console.log(`\n===== SUMMARY: ${pass}/${results.length} passed, ${fail.length} failed =====`);
  if (fail.length) {
    console.log('FAILED:');
    for (const f of fail) console.log(`  - ${f.name} -> ${f.status} :: ${f.note.slice(0, 160)}`);
  }
}

main()
  .catch(e => console.error('FATAL:', e.message))
  .finally(async () => {
    try { await prisma.$disconnect(); } catch {}
    process.exit(0);
  });
