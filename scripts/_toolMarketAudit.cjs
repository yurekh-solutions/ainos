// Tools marketplace audit: does every active tool have a real handler, and do
// the handlers actually run? Run: node --env-file=.env scripts/_toolMarketAudit.cjs
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const stamp = Date.now();
const EMAIL = `tool.audit.${stamp}@ainos-test.com`;
const PASSWORD = 'ToolAudit12345';

let cookie = '';

async function call(method, pathname, body, timeoutMs = 90000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(BASE + pathname, {
      method,
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
      signal: ac.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, json, text, ms: Date.now() - started };
  } catch (error) {
    return { status: 0, json: null, text: error.message, ms: Date.now() - started };
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

function registeredHandlers() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'tool-runner.ts'), 'utf8');
  const block = source.split('const HANDLERS')[1] || '';
  const slugs = [...block.matchAll(/'([a-z0-9-]+)'\s*:/g)].map((m) => m[1]);
  return new Set(slugs);
}

async function main() {
  // ── 1. registry coverage ──
  const handlers = registeredHandlers();
  const tools = await prisma.tool.findMany({ orderBy: { name: 'asc' } });
  const active = tools.filter((tool) => tool.isActive);
  const orphaned = active.filter((tool) => !handlers.has(tool.slug));
  const undeclared = [...handlers].filter((slug) => !tools.some((tool) => tool.slug === slug));

  console.log(`tools in db: ${tools.length} (active ${active.length})`);
  console.log(`handlers registered: ${handlers.size}`);
  console.log(`known tool catalogue:\n${tools.map((tool) => `  - ${tool.slug} | ${tool.name} | ${tool.creditCost} cr | ${tool.isActive ? 'active' : 'inactive'} | ${handlers.has(tool.slug) ? 'handler' : 'NO HANDLER'}`).join('\n')}`);
  if (orphaned.length) console.log(`ORPHANED (active but unexecutable): ${orphaned.map((tool) => tool.slug).join(', ')}`);
  if (undeclared.length) console.log(`handler without a tools row: ${undeclared.join(', ')}`);

  // ── 2. seed a tenant with credits ──
  const password = await bcrypt.hash(PASSWORD, 10);
  const company = await prisma.company.create({
    data: {
      name: `TOOLAUDIT Co ${stamp}`,
      companyType: 'Private Limited',
      email: EMAIL,
      createdBy: 'TOOLAUDIT',
      onboardingStatus: 'approved',
    },
  });
  const user = await prisma.user.create({
    data: { email: EMAIL, name: 'Tool Auditor', password, role: 'owner', companyId: company.id, emailVerifiedAt: new Date() },
  });
  await prisma.creditBalance.create({ data: { companyId: company.id, balance: 100 } });
  cookie = await login(EMAIL);

  const session = await call('GET', '/api/auth/session');
  if (!session.text.includes(EMAIL)) {
    console.log('ABORT: login failed', session.status, session.text.slice(0, 160));
    return cleanup(company.id);
  }

  // Fixture data so the data-driven tools have something to chew on.
  await call('POST', '/api/customers', { name: 'Audit Customer', email: 'audit@example.com', phone: '9876500000' });
  await call('POST', '/api/leads', { name: 'Audit Lead', email: 'lead@example.com', phone: '9876500001', source: 'referral', status: 'qualified' });

  const cases = [
    ['data-export', { dataset: 'customers', format: 'csv' }, 'recordCount'],
    ['lead-scoring-ai', {}, 'scored'],
    ['invoice-generator', { customerName: 'Audit Customer', items: [{ description: 'Consulting', quantity: 2, price: 500 }], taxRate: 18 }, 'total'],
  ];
  // The AI writer calls an external provider and can take 30s+; opt in explicitly.
  if (!process.env.SKIP_AI) cases.push(['ai-content-writer', { topic: 'Why small businesses need invoicing software' }, 'wordCount']);
  if (!process.env.SKIP_AI) cases.push(['social-media-generator', { topic: 'Diwali offer on annual plans' }, 'posts']);

  console.log('\n---- execution ----');
  for (const [slug, input, expectField] of cases) {
    const before = (await prisma.creditBalance.findUnique({ where: { companyId: company.id } }))?.balance ?? 0;
    const res = await call('POST', '/api/tools/execute', { toolSlug: slug, input }, 120000);
    const after = (await prisma.creditBalance.findUnique({ where: { companyId: company.id } }))?.balance ?? 0;
    const ok = res.status === 200 && res.json?.success === true;
    const hasField = expectField ? res.json?.output?.[expectField] !== undefined : true;
    console.log(`[${ok && hasField ? 'PASS' : 'FAIL'}] ${slug} -> ${res.status} (${res.ms}ms) credits ${before}->${after} field=${expectField} ${hasField ? 'present' : 'MISSING'}${ok ? '' : ' :: ' + res.text.slice(0, 180)}`);
  }

  const runs = await prisma.toolRun.count({ where: { companyId: company.id } });
  console.log(`tool run log rows: ${runs}`);

  // Handlers that need an external file or a live mail provider: prove they are
  // reachable by asserting their input guard, without sending anything.
  const guards = [
    ['invoice-extractor', {}, 'Provide either fileUrl or base64'],
    ['email-campaign-sender', {}, 'Subject is required'],
  ];
  console.log('\n---- input guards ----');
  for (const [slug, input, expected] of guards) {
    const res = await call('POST', '/api/tools/execute', { toolSlug: slug, input });
    const ok = res.status === 400 && String(res.json?.error || '').includes(expected);
    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${slug} guard -> ${res.status} ${res.text.slice(0, 120)}`);
  }

  const missing = await call('POST', '/api/tools/execute', { toolSlug: 'does-not-exist', input: {} });
  console.log(`[${missing.status === 400 ? 'PASS' : 'FAIL'}] unknown slug rejected -> ${missing.status} ${missing.text.slice(0, 100)}`);

  await cleanup(company.id, user.id);
}

async function cleanup(companyId, userId) {
  try {
    await prisma.toolRun.deleteMany({ where: { companyId } });
    await prisma.creditTransaction.deleteMany({ where: { companyId } });
    await prisma.creditBalance.deleteMany({ where: { companyId } });
    await prisma.invoice.deleteMany({ where: { companyId } });
    await prisma.lead.deleteMany({ where: { companyId } });
    await prisma.customer.deleteMany({ where: { companyId } });
    await prisma.auditLog.deleteMany({ where: { companyId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    else await prisma.user.deleteMany({ where: { companyId } });
    await prisma.company.delete({ where: { id: companyId } });
    console.log('cleanup done');
  } catch (error) {
    console.log('cleanup skipped:', error.message);
  }
}

main()
  .catch((error) => console.error('FATAL:', error.message))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
