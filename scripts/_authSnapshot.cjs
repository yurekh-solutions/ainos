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
  const counts = {
    ts: new Date().toISOString(),
    users: await prisma.user.count(),
    usersWithPassword: await prisma.user.count({ where: { password: { not: null } } }),
    usersPasswordLess: await prisma.user.count({ where: { password: null } }),
    companies: await prisma.company.count(),
  };
  console.log(JSON.stringify(counts));
  await prisma.$disconnect();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
