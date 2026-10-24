const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
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

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PROD = 'https://ainos-ywu0.onrender.com';
const TEST_EMAIL = 'qa.resetflow@ainos-test.com';

function post(base, p, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(base + p);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        timeout: 90000,
      },
      (res) => {
        let out = '';
        res.on('data', (c) => (out += c));
        res.on('end', () => resolve({ status: res.statusCode, body: out.slice(0, 500) }));
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  // 1. ensure test user exists with known password
  const oldPw = await bcrypt.hash('OldPass123!', 12);
  await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    create: { email: TEST_EMAIL, name: 'QA Reset', password: oldPw, role: 'owner' },
    update: { password: oldPw, resetToken: null, resetTokenExpiry: null },
  });
  console.log('1. test user ready:', TEST_EMAIL);

  // 2. simulate what forgot-password stores: sha256 of a known token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await prisma.user.update({
    where: { email: TEST_EMAIL },
    data: { resetToken: tokenHash, resetTokenExpiry: new Date(Date.now() + 3600e3) },
  });
  console.log('2. token hash stored, plaintext token len =', token.length);

  // 3. call PRODUCTION reset-password with that token
  const resetRes = await post(PROD, '/api/auth/reset-password', { token, newPassword: 'NewPass456!' });
  console.log('3. POST /api/auth/reset-password ->', resetRes.status, resetRes.body);

  // 4. verify password actually changed
  const after = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  const ok = after && after.password ? await bcrypt.compare('NewPass456!', after.password) : false;
  console.log('4. stored password matches NEW password?', ok);
  console.log('   token cleared?', !after.resetToken, '| expiry cleared?', !after.resetTokenExpiry);

  // 5. Now exercise the REAL forgot-password endpoint for this user
  const forgotRes = await post(PROD, '/api/auth/forgot-password', { email: TEST_EMAIL });
  console.log('5. POST /api/auth/forgot-password ->', forgotRes.status, forgotRes.body);

  const afterForgot = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  console.log('6. token set by forgot-password?', !!afterForgot.resetToken, '| expires at', afterForgot.resetTokenExpiry);

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('ERR', e.message);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
