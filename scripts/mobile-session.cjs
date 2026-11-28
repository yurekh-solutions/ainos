/**
 * Creates (or refreshes) a local QA tenant and writes its session cookie, so
 * the mobile audit can reach the signed-in screens.
 *
 * Usage: node --env-file=.env scripts/mobile-session.cjs
 * Then:  node scripts/mobile-audit.cjs --routes=scripts/mobile-app-routes.txt --cookie=_mobile-cookie.txt --widths=390
 *
 * The tenant is test-only data in the dev database; the cookie file is
 * git-ignored because it is a live session token.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const BASE = (process.env.AUDIT_BASE || 'http://127.0.0.1:3000').trim();
const EMAIL = process.env.AUDIT_EMAIL || 'mobile.audit@ainos-test.com';
const COOKIE_FILE = path.join(__dirname, '..', '_mobile-cookie.txt');
const prisma = new PrismaClient();

async function ensureTenant(password) {
  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

  if (existing) {
    await prisma.user.update({
      where: { email: EMAIL },
      data: { password: hash, emailVerifiedAt: new Date() },
    });
    if (existing.companyId) {
      await prisma.company.update({
        where: { id: existing.companyId },
        data: { onboardingStatus: 'approved' },
      });
    }
    return existing.companyId;
  }

  const company = await prisma.company.create({
    data: {
      name: 'Mobile Audit Co',
      companyType: 'Private Limited',
      email: EMAIL,
      phone: '9876500000',
      address: 'Audit Address',
      country: 'India',
      createdBy: 'MOBILE-AUDIT',
      onboardingStatus: 'approved',
    },
  });
  await prisma.user.create({
    data: {
      email: EMAIL,
      name: 'Mobile Audit',
      password: hash,
      role: 'owner',
      companyId: company.id,
      emailVerifiedAt: new Date(),
    },
  });
  return company.id;
}

async function login(password) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const jar = new Map();
  const absorb = (res) => {
    for (const entry of res.headers.getSetCookie()) {
      const kv = entry.split(';')[0];
      const index = kv.indexOf('=');
      jar.set(kv.slice(0, index).trim(), kv.slice(index + 1));
    }
  };
  absorb(csrfRes);

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
    },
    body: new URLSearchParams({
      csrfToken,
      email: EMAIL,
      password,
      callbackUrl: `${BASE}/dashboard`,
      json: 'true',
    }),
    redirect: 'manual',
  });
  absorb(res);

  const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  if (!/session-token/.test(cookie)) {
    throw new Error(`login did not return a session token (status ${res.status})`);
  }
  return cookie;
}

async function main() {
  const password = process.env.QA_PASSWORD;
  if (!password) throw new Error('QA_PASSWORD env is required (run with --env-file=.env)');

  const companyId = await ensureTenant(password);
  const cookie = await login(password);
  const probe = await fetch(`${BASE}/dashboard`, { headers: { cookie }, redirect: 'manual' });
  if (probe.status !== 200) {
    throw new Error(`session check failed: /dashboard returned ${probe.status}`);
  }

  fs.writeFileSync(COOKIE_FILE, cookie, 'utf8');
  console.log(`session ready for ${EMAIL} (company ${companyId})`);
}

main()
  .catch((error) => {
    console.error('SESSION_ERROR', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());