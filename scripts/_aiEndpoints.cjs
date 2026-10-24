// Exercise the free AI endpoints (chat + captions). Paid media generation is
// deliberately excluded. Run: node --env-file=.env scripts/_aiEndpoints.cjs
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const stamp = Date.now();
const EMAIL = `ai.audit.${stamp}@ainos-test.com`;
const PASSWORD = 'AiAudit12345';
let cookie = '';

async function call(method, pathname, body, timeoutMs = 120000) {
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

function report(name, ok, res, detail = '') {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name} -> ${res.status} (${res.ms}ms) ${detail}${ok ? '' : ' :: ' + res.text.slice(0, 240)}`);
  return ok;
}

async function main() {
  const password = await bcrypt.hash(PASSWORD, 10);
  const company = await prisma.company.create({
    data: {
      name: `AIAUDIT Co ${stamp}`,
      companyType: 'Private Limited',
      email: EMAIL,
      createdBy: 'AIAUDIT',
      onboardingStatus: 'approved',
    },
  });
  await prisma.user.create({
    data: { email: EMAIL, name: 'AI Auditor', password, role: 'owner', companyId: company.id, emailVerifiedAt: new Date() },
  });
  // Paid AI endpoints now bill credits, so the tenant needs a funded wallet.
  await prisma.creditBalance.create({ data: { companyId: company.id, balance: 200 } });
  cookie = await login(EMAIL);

  // an invoice to give the assistant something real to reason about
  const invoice = await call('POST', '/api/invoices', {
    customerName: 'Ravi Traders',
    items: [{ name: 'Setup fee', quantity: 1, price: 5000, gstRate: 18 }],
    dueDate: new Date().toISOString().slice(0, 10),
    status: 'sent',
  });

  let pass = 0;
  const total = 4;

  const chat = await call('POST', '/api/ai-chat', { message: 'How many invoices do I have and what is the total value?' });
  const reply = chat.json?.reply || chat.json?.message || chat.json?.response || '';
  if (report('ai-chat answers from real data', chat.status === 200 && typeof reply === 'string' && reply.length > 10, chat, `reply chars=${String(reply).length}`)) pass++;

  const chatGuard = await call('POST', '/api/ai-chat', {});
  if (report('ai-chat rejects empty message', chatGuard.status === 400, chatGuard)) pass++;

  const caption = await call('POST', '/api/social-caption', {
    topic: 'New GST billing software for small shops',
    tone: 'engaging',
    platforms: ['instagram', 'linkedin'],
    language: 'english',
  });
  const platforms = Array.isArray(caption.json?.platforms) ? caption.json.platforms : [];
  if (report('social-caption returns one per platform', caption.status === 200 && platforms.length === 2, caption, `platforms=${platforms.map((p) => p.platform).join(',')}`)) pass++;

  const captionGuard = await call('POST', '/api/social-caption', { tone: 'engaging' });
  if (report('social-caption requires a topic', captionGuard.status === 400, captionGuard)) pass++;

  console.log(`\n${pass}/${total} ai checks passed${invoice.status >= 400 ? ' (fixture invoice failed: ' + invoice.text.slice(0, 100) + ')' : ''}`);

  try {
    await prisma.invoice.deleteMany({ where: { companyId: company.id } });
    await prisma.creditTransaction.deleteMany({ where: { companyId: company.id } });
    await prisma.creditBalance.deleteMany({ where: { companyId: company.id } });
    await prisma.user.deleteMany({ where: { companyId: company.id } });
    await prisma.company.delete({ where: { id: company.id } });
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
