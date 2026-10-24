// Field service E2E — auth, create, list, dispatch transitions, delete.
// Run: node --env-file=.env scripts/_fieldServiceE2E.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const stamp = Date.now();
const EMAIL = `qa.field.${stamp}@ainos-test.com`;
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
  results.push({ name, pass });
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
      password: 'FieldQa123',
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
  const company = await prisma.company.findFirst({
    where: { onboardingStatus: 'approved' },
    orderBy: { createdAt: 'asc' },
  });
  if (!company) throw new Error('No approved company to attach the QA user to');

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: 'QA Field Tester',
      password: await bcrypt.hash('FieldQa123', 10),
      role: 'user',
      companyId: company.id,
      emailVerifiedAt: new Date(),
    },
  });

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  try {
    if (!check('login', await login(), true)) throw new Error('login failed');

    let res = await req('GET', '/api/field-service');
    check('GET list', res.status, 200, res.text);
    check('list shape', Array.isArray(res.json?.jobs), true);
    check('summary present', typeof res.json?.summary?.openTotal, 'number');
    check('dispatcher flag false for plain user', res.json?.canDispatch, false);

    res = await req('POST', '/api/field-service', {
      title: `QA site visit ${stamp}`,
      customerName: 'QA Customer',
      address: 'Plot 4, Indore',
      technician: 'QA Tech',
      priority: 'high',
      scheduledFor: tomorrow,
      labourCost: 500,
      partsCost: 250,
    });
    check('POST create', res.status, 201, res.text);
    const jobId = res.json?.id;
    check('job number generated', /^FS-\d{4}$/.test(res.json?.jobNumber || ''), true, res.json?.jobNumber);
    check('created scheduled', res.json?.status, 'scheduled');
    check('cost stored', (res.json?.labourCost || 0) + (res.json?.partsCost || 0), 750);

    res = await req('POST', '/api/field-service', { title: '' });
    check('reject empty title', res.status, 400, res.text);

    res = await req('GET', `/api/field-service?id=${jobId}`);
    check('GET single', res.status, 200, res.text);
    check('single matches', res.json?.job?.id, jobId);

    res = await req('PUT', '/api/field-service', { id: jobId, technician: 'QA Tech 2' });
    check('plain user may edit details', res.status, 200, res.text);

    res = await req('PUT', '/api/field-service', { id: jobId, status: 'in_progress' });
    check('plain user cannot dispatch', res.status, 403, res.text);

    await prisma.user.update({ where: { id: user.id }, data: { role: 'owner' } });

    res = await req('PUT', '/api/field-service', { id: jobId, status: 'in_progress' });
    check('owner starts job', res.status, 200, res.text);

    res = await req('PUT', '/api/field-service', { id: jobId, status: 'completed' });
    check('owner completes job', res.status, 200, res.text);
    check('completedAt stamped', Boolean(res.json?.completedAt), true);

    res = await req('GET', '/api/field-service?status=completed');
    check('status filter works', res.json?.jobs?.some((job) => job.id === jobId), true);

    res = await req('GET', `/api/field-service?q=QA%20site`);
    check('search works', res.json?.jobs?.some((job) => job.id === jobId), true);

    const stale = cookie;
    cookie = '';
    res = await req('GET', '/api/field-service');
    check('unauthenticated blocked', res.status, 401);
    cookie = stale;

    res = await req('DELETE', `/api/field-service?id=${jobId}`);
    check('owner deletes job', res.status, 200, res.text);

    res = await req('GET', `/api/field-service?id=${jobId}`);
    check('deleted is gone', res.status, 404);
  } finally {
    await prisma.serviceJob.deleteMany({ where: { companyId: company.id, title: { startsWith: 'QA site visit' } } });
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
