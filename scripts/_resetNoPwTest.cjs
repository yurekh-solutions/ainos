/**
 * Verifies that a password-less account (legacy Google row) can now request a
 * reset instead of being told to "continue with Google".
 * Creates a throwaway user, calls the API, inspects the token, then cleans up.
 */
const fs = require('fs');
const path = require('path');
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
const BASE = process.argv[2] || 'http://localhost:3000';
const EMAIL = `qa.nopw.${Date.now()}@ainos-test.com`;

(async () => {
  const user = await prisma.user.create({
    data: { email: EMAIL, name: 'No Password QA', role: 'user' },
  });

  try {
    const res = await fetch(`${BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL }),
    });
    const data = await res.json();
    console.log('response      ', res.status, JSON.stringify(data));

    const after = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, resetToken: true, resetTokenExpiry: true },
    });
    console.log('hasPassword   ', !!after.password);
    console.log('token issued  ', !!after.resetToken);
    console.log('expiry set    ', !!after.resetTokenExpiry);

    const ok = res.status === 200 && !!after.resetToken && !after.password;
    console.log(ok ? '\nOK: password-less account can reset' : '\nFAIL: reset still blocked');
    if (!ok) process.exitCode = 1;
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
    console.log('cleanup       user removed');
  }
})().catch(async (e) => {
  console.error('ERR', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
