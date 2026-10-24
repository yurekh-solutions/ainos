// AINOS expenses E2E — auth, create, read, approve, reimburse, delete.
// Run: node --env-file=.env scripts/_expensesE2E.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const stamp = Date.now();
const EMAIL = `qa.expense.${stamp}@ainos-test.com`;
const results = [];
let cookie = '';

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text: text.slice(0, 300) };
}

function check(name, actual, expected, detail = '') {
  const pass = actual === expected;
  results.push({ name, pass, actual, expected, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} -> ${actual} (want ${expected}) ${pass ? '' : detail}`);
  return pass;
}

async function login() {
  const csrfRes = await fetch(BASE + '/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  const jar = {};
  for (const entry of csrfRes.headers.getSetCookie()) {
    const [kv] = entry.split(';');
    const [key, ...value] = kv.split('=');
    jar[key.trim()] = value.join('=');
  }
  const jarHeader = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');

  const loginRes = await fetch(BASE + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: jarHeader() },
    body: new URLSearchParams({
      csrfToken,
      email: EMAIL,
      password: 'ExpenseQa123',
      callbackUrl: BASE + '/dashboard',
      json: 'true',
    }),
    redirect: 'manual',
  });
  for (const entry of loginRes.headers.getSetCookie()) {
    const [kv] = entry.split(';');
    const [key, ...value] = kv.split('=');
    jar[key.trim()] = value.join('=');
  }
  cookie = jarHeader();

  const session = await req('GET', '/api/auth/session');
  return session.json?.user?.email === EMAIL;
}

async function main() {
  // Use an approved tenant: the login gate rejects user rows on pending companies.
  const company = await prisma.company.findFirst({
    where: { onboardingStatus: 'approved' },
    orderBy: { createdAt: 'asc' },
  });
  if (!company) throw new Error('No approved company row to attach the QA user to');

  const hash = await bcrypt.hash('ExpenseQa123', 10);
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: 'QA Expense Tester',
      password: hash,
      role: 'user',
      companyId: company.id,
      emailVerifiedAt: new Date(),
    },
  });

  try {
    const loggedIn = await login();
    if (!check('login', loggedIn, true)) throw new Error('login failed');

    let res = await req('GET', '/api/expenses');
    check('GET list', res.status, 200, res.text);
    check('list shape', Array.isArray(res.json?.expenses), true);
    check('summary present', typeof res.json?.summary?.monthTotal === 'number', true);
    check('approver flag false for plain user', res.json?.canApprove, false);

    res = await req('POST', '/api/expenses', {
      title: `QA travel ${stamp}`,
      amount: 1000,
      taxAmount: 180,
      category: 'Travel',
      vendor: 'QA Vendor',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'upi',
      description: 'QA run',
    });
    check('POST create', res.status, 201, res.text);
    const expenseId = res.json?.id;
    check('created as pending', res.json?.status, 'pending');
    check('created tax stored', res.json?.taxAmount, 180);
    check('submitter recorded', res.json?.submittedBy, EMAIL);

    res = await req('POST', '/api/expenses', { title: '', amount: 10 });
    check('reject empty title', res.status, 400, res.text);

    res = await req('POST', '/api/expenses', { title: 'Bad amount', amount: 0 });
    check('reject zero amount', res.status, 400, res.text);

    res = await req('GET', `/api/expenses?id=${expenseId}`);
    check('GET single', res.status, 200, res.text);
    check('single matches', res.json?.expense?.id, expenseId);

    res = await req('PUT', '/api/expenses', { id: expenseId, title: `QA travel edited ${stamp}` });
    check('submitter may edit pending', res.status, 200, res.text);

    res = await req('PUT', '/api/expenses', { id: expenseId, status: 'approved' });
    check('plain user cannot approve', res.status, 403, res.text);

    res = await req('PUT', '/api/expenses', { id: expenseId, amount: 2500 });
    check('plain user cannot change amount', res.status, 403, res.text);

    await prisma.user.update({ where: { id: user.id }, data: { role: 'owner' } });

    res = await req('PUT', '/api/expenses', { id: expenseId, status: 'approved' });
    check('owner approves', res.status, 200, res.text);
    check('approver stamped', res.json?.approvedBy, EMAIL);
    check('approvedAt stamped', Boolean(res.json?.approvedAt), true);

    res = await req('PUT', '/api/expenses', { id: expenseId, status: 'reimbursed' });
    check('owner reimburses', res.status, 200, res.text);
    check('reimbursedAt stamped', Boolean(res.json?.reimbursedAt), true);

    res = await req('GET', '/api/expenses?status=reimbursed');
    check('status filter works', res.json?.expenses?.some((row) => row.id === expenseId), true);

    res = await req('GET', '/api/expenses?q=QA%20travel');
    check('search filter works', res.json?.expenses?.some((row) => row.id === expenseId), true);

    res = await req('GET', '/api/expenses?from=1999-01-01&to=1999-12-31');
    check('date filter excludes', res.json?.expenses?.some((row) => row.id === expenseId), false);

    const stale = cookie;
    cookie = '';
    res = await req('GET', '/api/expenses');
    check('unauthenticated blocked', res.status, 401);
    cookie = stale;

    res = await req('DELETE', `/api/expenses?id=${expenseId}`);
    check('owner deletes', res.status, 200, res.text);

    res = await req('GET', `/api/expenses?id=${expenseId}`);
    check('deleted is gone', res.status, 404);
  } finally {
    await prisma.expense.deleteMany({ where: { companyId: company.id, title: { startsWith: 'QA travel' } } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }

  const failed = results.filter((entry) => !entry.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
}

main().catch(async (error) => {
  console.error('E2E crashed:', error.message);
  await prisma.$disconnect();
  process.exit(1);
});
