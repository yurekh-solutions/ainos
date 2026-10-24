// Provision (or cleanup) an approved demo company for browser smoke-testing.
// Run:   node --env-file=.env scripts/_smokeUser.cjs            -> create + approve
//        node --env-file=.env scripts/_smokeUser.cjs --cleanup  -> delete all SMOKE companies
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const stamp = Date.now();
const EMAIL = `smoke.demo${stamp}@ainos.test`;
const PASSWORD = 'Smoke@12345';

async function main() {
  if (process.argv.includes('--cleanup')) {
    const companies = await prisma.company.findMany({ where: { name: { startsWith: 'SMOKE Demo' } } });
    for (const c of companies) {
      for (const m of ['invoice', 'customer', 'product', 'expense', 'lead', 'contact', 'deal', 'employee', 'calendarEvent', 'helpdeskTicket']) {
        try { await prisma[m].deleteMany({ where: { companyId: c.id } }); } catch {}
      }
      await prisma.user.deleteMany({ where: { companyId: c.id } });
      await prisma.company.delete({ where: { id: c.id } }).catch(() => {});
      console.log('deleted company', c.name);
    }
    return;
  }

  const res = await fetch(BASE + '/api/auth/register-company', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Smoke Owner', email: EMAIL, phone: '9876500011', password: PASSWORD,
      companyName: 'SMOKE Demo Traders', companyType: 'Private Limited',
      companyEmail: EMAIL, companyPhone: '9876500011', companyAddress: 'MG Road, Pune', country: 'India',
    }),
  });
  console.log('register:', res.status);
  if (res.status !== 200 && res.status !== 201) { console.log(await res.text()); process.exit(1); }

  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user?.companyId) { console.log('ERROR: no companyId on user'); process.exit(1); }
  await prisma.company.update({ where: { id: user.companyId }, data: { onboardingStatus: 'approved' } });
  console.log('approved company:', user.companyId);
  console.log('LOGIN_EMAIL=' + EMAIL);
  console.log('LOGIN_PASSWORD=' + PASSWORD);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
