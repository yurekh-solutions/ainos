const fs = require('fs');
const path = require('path');

function loadEnv(file, override) {
  const p = path.join(__dirname, '..', file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const v = m[2].trim().replace(/^["']|["']$/g, '');
    if (override || !(m[1] in process.env)) process.env[m[1]] = v;
  }
}
loadEnv('.env', false);
loadEnv('.env.local', true);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const db = process.env.DATABASE_URL || '';
  console.log('DB host:', (db.match(/@([^/?]+)/) || [,'?'])[1]);

  const target = process.argv[2] || 'yurekhsolution@gmail.com';
  const u = await prisma.user.findUnique({ where: { email: target } });
  console.log('--- target user ---');
  console.log(JSON.stringify({
    found: !!u,
    email: u?.email,
    hasPassword: !!u?.password,
    googleId: u?.googleId || null,
    companyId: u?.companyId || null,
    role: u?.role,
    createdAt: u?.createdAt,
  }, null, 2));

  const counts = {
    totalUsers: await prisma.user.count(),
    withPassword: await prisma.user.count({ where: { password: { not: null } } }),
    googleOnlyNoPassword: await prisma.user.count({ where: { password: null } }),
  };
  console.log('--- counts ---');
  console.log(JSON.stringify(counts, null, 2));

  const googleOnly = await prisma.user.findMany({
    where: { password: null },
    select: { email: true, googleId: true, companyId: true, createdAt: true },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
  console.log('--- google-only users (password null) ---');
  for (const g of googleOnly) console.log(`${g.email} | googleId=${g.googleId ? 'yes' : 'no'} | company=${g.companyId || 'none'} | ${g.createdAt?.toISOString?.() || g.createdAt}`);

  await prisma.$disconnect();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
