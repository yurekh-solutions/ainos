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

(async () => {
  const total = await prisma.user.count();
  const users = await prisma.user.findMany({
    select: { email: true, role: true, companyId: true, password: true, resetToken: true, createdAt: true },
    take: 40,
    orderBy: { createdAt: 'desc' },
  });
  console.log('total users:', total);
  for (const u of users) {
    let status = '-';
    if (u.companyId) {
      const c = await prisma.company.findUnique({
        where: { id: u.companyId },
        select: { onboardingStatus: true, name: true },
      });
      status = c ? c.onboardingStatus + ' / ' + c.name : 'missing-company';
    }
    console.log([u.email, u.role, u.password ? 'HAS_PW' : 'NO_PW', status, u.resetToken ? 'TOKEN_SET' : ''].join(' | '));
  }
  await prisma.$disconnect();
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
