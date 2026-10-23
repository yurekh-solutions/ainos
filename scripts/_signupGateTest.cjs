// End-to-end signup gate test on the local dev server, with cleanup.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.join(__dirname, '..');

for (const f of ['.env', '.env.local']) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'http://localhost:3007';
const EMAIL = 'qa.signupgate@ainos-test.com';
const PHONE = '9876500022';
const COMPANY = 'QA Signup Gate Co';

const secret = process.env.OTP_SECRET || process.env.NEXTAUTH_SECRET || 'ainos-dev-otp-secret';

function b64(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function proof(channel, target, purpose) {
  const payload = { channel, target, purpose, exp: Date.now() + 30 * 60 * 1000 };
  const body = b64(JSON.stringify(payload));
  const sig = b64(crypto.createHmac('sha256', secret).update(body).digest());
  return `${body}.${sig}`;
}

async function post(pathname, body) {
  const res = await fetch(BASE + pathname, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text.slice(0, 200); }
  return { status: res.status, body: parsed };
}

const base = {
  name: 'QA Signup Gate',
  email: EMAIL,
  phone: PHONE,
  password: 'TestPass123!',
  companyName: COMPANY,
  companyType: 'proprietary',
  companyEmail: EMAIL,
  companyPhone: PHONE,
  companyAddress: '1 Test Street, Test City',
  country: 'India',
};

(async () => {
  await cleanup();

  console.log('1) no proof (expect 400 EMAIL_NOT_VERIFIED) ->',
    JSON.stringify(await post('/api/auth/register-company', base)));

  console.log('2) tampered proof (expect 400) ->', JSON.stringify(await post('/api/auth/register-company', {
    ...base, emailProof: b64(JSON.stringify({ channel: 'email', target: EMAIL, purpose: 'signup_email', exp: Date.now() + 60000 })) + '.bogus',
  })));

  console.log('3) proof for a different email (expect 400) ->', JSON.stringify(await post('/api/auth/register-company', {
    ...base, emailProof: proof('email', 'someone.else@ainos-test.com', 'signup_email'),
  })));

  const ok = await post('/api/auth/register-company', {
    ...base,
    emailProof: proof('email', EMAIL, 'signup_email'),
    phoneProof: proof('phone', '91' + PHONE, 'signup_phone'),
  });
  console.log('4) valid proof (expect 201) ->', ok.status, '| company:', ok.body?.company?.name,
    '| uploadToken:', ok.body?.company?.uploadToken ? 'present' : 'missing',
    '| user:', ok.body?.user?.email);

  const created = await prisma.user.findFirst({ where: { email: EMAIL }, include: { company: true } });
  console.log('5) db row ->', created
    ? `user=${created.email} role=${created.role} emailVerified=${!!created.emailVerifiedAt} phoneVerified=${!!created.phoneVerifiedAt} company=${created.company?.name}`
    : 'MISSING');

  await cleanup();
  console.log('6) cleanup done — test rows removed');
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('ERR', e.message);
  try { await cleanup(); await prisma.$disconnect(); } catch {}
});

async function cleanup() {
  const user = await prisma.user.findFirst({ where: { email: EMAIL } });
  if (user) {
    if (user.companyId) {
      await prisma.creditBalance.deleteMany({ where: { companyId: user.companyId } });
    }
    await prisma.user.delete({ where: { id: user.id } });
  }
  const companies = await prisma.company.findMany({ where: { name: COMPANY } });
  for (const c of companies) {
    await prisma.creditBalance.deleteMany({ where: { companyId: c.id } });
    await prisma.company.delete({ where: { id: c.id } });
  }
  await prisma.verificationCode.deleteMany({ where: { target: { in: [EMAIL, '91' + PHONE] } } });
}
