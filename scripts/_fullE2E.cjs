// Comprehensive E2E test for all new AINOS features
// Run: node --env-file=.env scripts/_fullE2E.cjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const STAMP = Date.now();
const EMAIL = `e2e.test${STAMP}@ainos.test`;
const PASSWORD = 'E2E@Test123';
let COOKIE_JAR = {};
let COMPANY_ID = null;

// ─── Helpers ───────────────────────────────────────────────────────────────
function mergeCookies(res) {
  const setCookies = res.headers.getSetCookie?.() || [];
  for (const raw of setCookies) {
    const [pair] = raw.split(';');
    const [k, ...v] = pair.split('=');
    if (k && v.length) COOKIE_JAR[k.trim()] = v.join('=').trim();
  }
}
function cookieHeader() {
  return Object.entries(COOKIE_JAR).map(([k, v]) => `${k}=${v}`).join('; ');
}
async function api(method, path, body, extraHeaders = {}) {
  const opts = { method, headers: { Cookie: cookieHeader(), ...extraHeaders }, redirect: 'manual' };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, opts);
  mergeCookies(res);
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

// ─── Phase 1: Provision test user ──────────────────────────────────────────
async function provisionUser() {
  console.log('\n=== PHASE 1: Provision test user ===');
  const bcrypt = require('bcryptjs');
  const hashedPw = await bcrypt.hash(PASSWORD, 12);

  // Create company directly in DB (bypasses email verification gate)
  const company = await prisma.company.create({
    data: {
      name: 'E2E Test Corp',
      email: EMAIL,
      phone: '9999999999',
      companyType: 'Private Limited',
      onboardingStatus: 'approved',
      createdBy: EMAIL,
      autoBlog: 1, invoiceGen: 1, crmAccess: 1, inventoryMgmt: 1,
      hrPayroll: 1, emailMarketing: 1, aiAssistant: 1, websiteGen: 1,
      subscriptionStatus: 'trialing',
    },
  });
  COMPANY_ID = company.id;

  // Create user with password
  await prisma.user.create({
    data: {
      name: 'E2E Tester',
      email: EMAIL,
      phone: '9999999999',
      password: hashedPw,
      role: 'owner',
      companyId: COMPANY_ID,
      emailVerifiedAt: new Date(),
    },
  });

  // Create credit balance
  await prisma.creditBalance.create({
    data: { companyId: COMPANY_ID, balance: 100 },
  }).catch(() => {});

  console.log(`  created user: ${EMAIL}`);
  console.log(`  approved company: ${COMPANY_ID}`);
}

// ─── Phase 2: Authenticate ─────────────────────────────────────────────────
async function authenticate() {
  console.log('\n=== PHASE 2: Authenticate ===');
  // Get CSRF token
  const csrfRes = await fetch(BASE + '/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  mergeCookies(csrfRes);
  console.log(`  CSRF token obtained`);

  // Login with credentials
  const loginRes = await fetch(BASE + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieHeader(),
    },
    body: new URLSearchParams({
      csrfToken, email: EMAIL, password: PASSWORD,
      callbackUrl: '/dashboard', json: 'true',
    }),
    redirect: 'manual',
  });
  mergeCookies(loginRes);
  console.log(`  login callback: ${loginRes.status}`);

  // Verify session
  const sessionRes = await api('GET', '/api/auth/session');
  const loggedIn = sessionRes.data?.user?.email === EMAIL;
  console.log(`  session check: ${loggedIn ? 'OK' : 'FAIL'} (${sessionRes.data?.user?.email})`);
  if (!loggedIn) { console.log('  Session data:', sessionRes.data); process.exit(1); }
}

// ─── Phase 3: Test all 15 new API routes ───────────────────────────────────
const API_ROUTES = [
  { name: 'customers',     postBody: { name: 'Test Customer', email: 'cust@test.com', phone: '1234567890' } },
  { name: 'contacts',      postBody: { name: 'Test Contact', email: 'contact@test.com', phone: '1234567890', stage: 'lead' } },
  { name: 'deals',         postBody: { title: 'Test Deal', value: 50000, stage: 'prospecting' } },
  { name: 'employees',     postBody: { name: 'Test Employee', email: 'emp@test.com', phone: '1234567890', role: 'developer' } },
  { name: 'attendance',    postBody: { date: new Date().toISOString(), status: 'present', checkIn: '09:00' } },
  { name: 'leaves',        postBody: { employeeName: 'Test Employee', fromDate: new Date().toISOString(), toDate: new Date().toISOString(), reason: 'Sick', type: 'sick' } },
  { name: 'bank-accounts', postBody: { name: 'Test Savings Account', accountNumber: '1234567890', ifscCode: 'TEST0001234', bankName: 'Test Bank', balance: 50000 } },
  { name: 'credit-notes',  postBody: { customerName: 'Test Customer', amount: 1000, reason: 'Overpayment' } },
  { name: 'debit-notes',   postBody: { vendorName: 'Test Vendor', amount: 500, reason: 'Additional charges' } },
  { name: 'purchase-orders', postBody: { vendorName: 'Test Vendor', totalAmount: 25000, status: 'draft' } },
  { name: 'warehouses',    postBody: { name: 'Test Warehouse', location: 'Pune', capacity: 1000 } },
  { name: 'stock',         postBody: { name: 'Test Product', sku: 'TP-001', quantity: 100, unit: 'pcs', minStock: 10, reorderLevel: 20 } },
  { name: 'service-requests', postBody: { customerName: 'Test Customer', subject: 'Test Issue', description: 'Something broken', priority: 'medium' } },
  { name: 'helpdesk',      postBody: { subject: 'Test Ticket', description: 'Need help', priority: 'high', category: 'technical' } },
  { name: 'ecommerce/stores', postBody: { storeName: 'Test Store', platform: 'shopify', domain: 'test.myshopify.com' } },
];

async function testApiRoutes() {
  console.log('\n=== PHASE 3: Test API routes ===');
  let pass = 0, fail = 0;
  for (const route of API_ROUTES) {
    // Test GET
    const getRes = await api('GET', `/api/${route.name}`);
    const getOk = getRes.status === 200;
    if (!getOk) {
      console.log(`  FAIL GET /api/${route.name}: ${getRes.status} - ${JSON.stringify(getRes.data)}`);
      fail++;
    } else {
      pass++;
    }

    // Test POST
    const postRes = await api('POST', `/api/${route.name}`, route.postBody);
    const postOk = postRes.status === 201 || postRes.status === 200;
    if (!postOk) {
      console.log(`  FAIL POST /api/${route.name}: ${postRes.status} - ${JSON.stringify(postRes.data)}`);
      fail++;
    } else {
      pass++;
      // If POST succeeded, test PUT and DELETE with the created ID
      const id = postRes.data?.id;
      if (id) {
        // Test PUT
        const putBody = { id, ...route.postBody };
        // Update a field if possible
        if (putBody.name) putBody.name = putBody.name + ' Updated';
        if (putBody.title) putBody.title = putBody.title + ' Updated';
        if (putBody.subject) putBody.subject = putBody.subject + ' Updated';
        if (putBody.storeName) putBody.storeName = putBody.storeName + ' Updated';
        if (putBody.bankName) putBody.bankName = putBody.bankName + ' Updated';
        const putRes = await api('PUT', `/api/${route.name}`, putBody);
        const putOk = putRes.status === 200;
        if (!putOk) {
          console.log(`  FAIL PUT /api/${route.name}: ${putRes.status} - ${JSON.stringify(putRes.data)}`);
          fail++;
        } else { pass++; }

        // Test DELETE
        const delRes = await api('DELETE', `/api/${route.name}?id=${id}`);
        const delOk = delRes.status === 200 || delRes.status === 204;
        if (!delOk) {
          console.log(`  FAIL DELETE /api/${route.name}: ${delRes.status} - ${JSON.stringify(delRes.data)}`);
          fail++;
        } else { pass++; }
      }
    }
  }
  console.log(`  API routes: ${pass} passed, ${fail} failed`);
  return { pass, fail };
}

// ─── Phase 4: Test dashboard pages ─────────────────────────────────────────
const DASHBOARD_PAGES = [
  '/dashboard',
  '/crm/leads',
  '/crm/follow-ups',
  '/customers',
  '/invoices',
  '/finance/challans',
  '/hr/employees',
  '/products',
  '/products/new',
  '/marketing/events',
  '/tools',
  '/ai/chat',
];

async function testDashboardPages() {
  console.log('\n=== PHASE 4: Test dashboard pages ===');
  let pass = 0, fail = 0;
  for (const page of DASHBOARD_PAGES) {
    const res = await api('GET', page, null, { Accept: 'text/html' });
    // Dashboard pages should return 200 (or redirect to login if session expired)
    const ok = res.status === 200 || res.status === 302 || res.status === 307;
    if (!ok) {
      console.log(`  FAIL ${page}: ${res.status}`);
      fail++;
    } else {
      pass++;
    }
  }
  console.log(`  Dashboard pages: ${pass} passed, ${fail} failed`);
  return { pass, fail };
}

// ─── Phase 5: Test auth pages ──────────────────────────────────────────────
async function testAuthPages() {
  console.log('\n=== PHASE 5: Test auth pages ===');
  let pass = 0, fail = 0;
  for (const page of ['/auth/signin', '/auth/register']) {
    const res = await fetch(BASE + page);
    const ok = res.status === 200;
    if (!ok) {
      console.log(`  FAIL ${page}: ${res.status}`);
      fail++;
    } else {
      pass++;
    }
  }
  // Test register-company API validation
  const badRes = await api('POST', '/api/auth/register-company', { email: 'bad' });
  const validationOk = badRes.status === 400;
  if (!validationOk) {
    console.log(`  FAIL register-company validation: expected 400, got ${badRes.status}`);
    fail++;
  } else {
    pass++;
  }
  console.log(`  Auth pages: ${pass} passed, ${fail} failed`);
  return { pass, fail };
}

// ─── Phase 6: Test tool-runner ─────────────────────────────────────────────
async function testToolRunner() {
  console.log('\n=== PHASE 6: Test tool-runner ===');
  // Test the tools execute page
  const res = await api('GET', '/tools/execute/gst-lookup', null, { Accept: 'text/html' });
  const ok = res.status === 200;
  if (!ok) {
    console.log(`  FAIL /tools/execute/gst-lookup: ${res.status}`);
  }
  console.log(`  Tool runner: ${ok ? '1 passed' : '1 failed'}`);
  return { pass: ok ? 1 : 0, fail: ok ? 0 : 1 };
}

// ─── Cleanup ───────────────────────────────────────────────────────────────
async function cleanup() {
  console.log('\n=== CLEANUP ===');
  try {
    // Delete test data
    const models = ['customer', 'contact', 'deal', 'employee', 'attendance', 'leave', 'bankAccount', 'creditNote', 'debitNote', 'purchaseOrder', 'warehouse', 'stock', 'serviceRequest', 'helpdeskTicket', 'ecommerceStore'];
    for (const model of models) {
      try { await prisma[model].deleteMany({ where: { companyId: COMPANY_ID } }); } catch {}
    }
    await prisma.user.deleteMany({ where: { companyId: COMPANY_ID } });
    await prisma.company.delete({ where: { id: COMPANY_ID } }).catch(() => {});
    console.log('  Test data cleaned up');
  } catch (e) {
    console.log('  Cleanup warning:', e.message);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('AINOS Full E2E Test Suite');
  console.log('========================');
  console.log(`Test user: ${EMAIL}`);
  console.log(`Base URL: ${BASE}`);

  await provisionUser();
  await authenticate();
  const apiResults = await testApiRoutes();
  const dashResults = await testDashboardPages();
  const authResults = await testAuthPages();
  const toolResults = await testToolRunner();

  const totalPass = apiResults.pass + dashResults.pass + authResults.pass + toolResults.pass;
  const totalFail = apiResults.fail + dashResults.fail + authResults.fail + toolResults.fail;

  console.log('\n========================');
  console.log(`TOTAL: ${totalPass} passed, ${totalFail} failed`);
  console.log('========================\n');

  await cleanup();
  await prisma.$disconnect();

  if (totalFail > 0) process.exit(1);
}

main().catch(async (e) => {
  console.error('FATAL:', e);
  await cleanup();
  await prisma.$disconnect();
  process.exit(1);
});
