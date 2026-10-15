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
  const before = await prisma.company.groupBy({ by: ['onboardingStatus'], _count: { _all: true } });
  console.log('BEFORE:', JSON.stringify(before));

  const res = await prisma.company.updateMany({
    data: { onboardingStatus: 'pending' },
  });
  console.log('UPDATED:', res.count);

  const after = await prisma.company.groupBy({ by: ['onboardingStatus'], _count: { _all: true } });
  console.log('AFTER:', JSON.stringify(after));

  await prisma.$disconnect();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
