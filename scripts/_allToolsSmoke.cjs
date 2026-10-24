// Sweep every page and API route in the app and report what actually breaks.
// Run: node --env-file=.env scripts/_allToolsSmoke.cjs
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const APP_DIR = path.join(__dirname, '..', 'src', 'app');
const stamp = Date.now();
const EMAIL = `smoke.${stamp}@ainos-test.com`;
const PASSWORD = 'SmokeTest12345';
const PLACEHOLDER = '00000000-0000-0000-0000-000000000000';

const pageFails = [];
const apiFails = [];
let cookie = '';

function walkPages(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_') || entry.name === 'api') continue;
      walkPages(full, acc);
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      acc.push(full);
    }
  }
  return acc;
}

function walkApis(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkApis(full, acc);
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      acc.push(full);
    }
  }
  return acc;
}

function toRoute(file) {
  const rel = path.relative(APP_DIR, path.dirname(file));
  const segments = rel.split(path.sep).filter(Boolean).filter((s) => !s.startsWith('(') && !s.startsWith('@'));
  return '/' + segments.join('/');
}

const isDynamic = (route) => route.includes('[');
const fillDynamic = (route) => route.replace(/\[\[?[^\]]+\]?\]/g, PLACEHOLDER).replace(/\/$/, '');

async function get(pathname, timeoutMs = 45000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(BASE + pathname, { headers: { Cookie: cookie }, redirect: 'manual', signal: ac.signal });
    const text = await res.text();
    return { status: res.status, ms: Date.now() - started, text, type: res.headers.get('content-type') || '' };
  } catch (error) {
    return { status: 0, ms: Date.now() - started, text: error.message, type: '' };
  } finally {
    clearTimeout(timer);
  }
}

async function login(email) {
  const csrfRes = await fetch(BASE + '/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  const jar = {};
  for (const entry of csrfRes.headers.getSetCookie()) {
    const [kv] = entry.split(';');
    const [key, ...value] = kv.split('=');
    jar[key.trim()] = value.join('=');
  }
  const header = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
  const res = await fetch(BASE + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: header() },
    body: new URLSearchParams({ csrfToken, email, password: PASSWORD, callbackUrl: BASE + '/dashboard', json: 'true' }),
    redirect: 'manual',
  });
  for (const entry of res.headers.getSetCookie()) {
    const [kv] = entry.split(';');
    const [key, ...value] = kv.split('=');
    jar[key.trim()] = value.join('=');
  }
  return header();
}

async function seedTenant() {
  const password = await bcrypt.hash(PASSWORD, 10);
  const company = await prisma.company.create({
    data: {
      name: `SMOKE Co ${stamp}`,
      companyType: 'Private Limited',
      email: EMAIL,
      phone: '9876500000',
      address: 'Smoke Address',
      country: 'India',
      createdBy: 'SMOKE',
      onboardingStatus: 'approved',
    },
  });
  await prisma.user.create({
    data: { email: EMAIL, name: 'Smoke Owner', password, role: 'owner', companyId: company.id, emailVerifiedAt: new Date() },
  });
  return company;
}

async function cleanup(companyId) {
  try {
    await prisma.auditLog.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.company.delete({ where: { id: companyId } });
    console.log('cleanup done');
  } catch (error) {
    console.log('cleanup skipped:', error.message);
  }
}

async function main() {
  const company = await seedTenant();
  cookie = await login(EMAIL);
  const session = await get('/api/auth/session');
  if (!session.text.includes(EMAIL)) {
    console.log('ABORT: login failed', session.status, session.text.slice(0, 200));
    return cleanup(company.id);
  }
  console.log(`session ok for ${EMAIL}`);

  // ── pages ──
  const pageFiles = walkPages(APP_DIR).sort();
  const routes = pageFiles.map(toRoute).sort();
  const staticRoutes = routes.filter((route) => !isDynamic(route));
  const dynamicRoutes = routes.filter(isDynamic);
  console.log(`pages found: ${routes.length} (static ${staticRoutes.length}, dynamic ${dynamicRoutes.length})\n`);

  let index = 0;
  for (const route of staticRoutes) {
    index += 1;
    const res = await get(route);
    const ok = res.status >= 200 && res.status < 400;
    if (!ok) pageFails.push({ route, status: res.status, ms: res.ms, note: res.text.slice(0, 160) });
    if (!ok || index % 40 === 0) {
      console.log(`[${ok ? 'OK' : 'FAIL'}] ${res.status} ${route} (${res.ms}ms)${ok ? '' : ' :: ' + res.text.slice(0, 120)}`);
    }
  }

  // Dynamic pages only fail the sweep on a server error; a placeholder id
  // legitimately yields 404 or a not-found state.
  const dynamicProblems = [];
  for (const route of dynamicRoutes) {
    const res = await get(fillDynamic(route));
    if (res.status >= 500 || res.status === 0) dynamicProblems.push({ route, status: res.status, note: res.text.slice(0, 160) });
  }

  // ── apis with a GET handler ──
  const apiFiles = walkApis(path.join(APP_DIR, 'api'));
  const apiRoutes = [];
  for (const file of apiFiles) {
    const source = fs.readFileSync(file, 'utf8');
    if (!/export\s+(async\s+function|const|function)\s+GET/.test(source)) continue;
    const route = toRoute(file);
    if (isDynamic(route)) continue;
    apiRoutes.push(route);
  }
  apiRoutes.sort();
  console.log(`\napi GET routes: ${apiRoutes.length}\n`);

  for (const route of apiRoutes) {
    const res = await get(route, 60000);
    const bad = res.status >= 500 || res.status === 0;
    if (bad) apiFails.push({ route, status: res.status, ms: res.ms, note: res.text.slice(0, 200) });
    if (bad) console.log(`[FAIL] ${res.status} ${route} (${res.ms}ms) :: ${res.text.slice(0, 160)}`);
  }

  // ── report ──
  console.log('\n===== SMOKE SUMMARY =====');
  console.log(`static pages: ${staticRoutes.length - pageFails.length}/${staticRoutes.length} ok`);
  console.log(`dynamic pages with 5xx: ${dynamicProblems.length}/${dynamicRoutes.length}`);
  console.log(`api GET routes: ${apiRoutes.length - apiFails.length}/${apiRoutes.length} ok`);
  if (pageFails.length) {
    console.log('\nPAGE FAILURES:');
    for (const row of pageFails) console.log(`  - ${row.status} ${row.route} :: ${row.note}`);
  }
  if (dynamicProblems.length) {
    console.log('\nDYNAMIC PAGE 5xx:');
    for (const row of dynamicProblems) console.log(`  - ${row.status} ${row.route} :: ${row.note}`);
  }
  if (apiFails.length) {
    console.log('\nAPI FAILURES:');
    for (const row of apiFails) console.log(`  - ${row.status} ${row.route} :: ${row.note}`);
  }

  await cleanup(company.id);
}

main()
  .catch((error) => console.error('FATAL:', error.message))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
