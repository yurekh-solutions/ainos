// Diagnostic: schedule statuses + missing preview images per company
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.blogSchedule.findMany({
    select: { status: true, previewImage: true, companyId: true, topic: true, scheduledDate: true },
  });
  const byCompany = {};
  rows.forEach(r => {
    const key = r.companyId || 'none';
    byCompany[key] = byCompany[key] || {};
    const k = `${r.status}${r.previewImage ? '+img' : '-noimg'}`;
    byCompany[key][k] = (byCompany[key][k] || 0) + 1;
  });
  console.log(JSON.stringify(byCompany, null, 2));
  const stuck = rows.filter(r => r.status === 'failed' || (r.status === 'generating'));
  console.log('failed/generating rows:', stuck.length);
  stuck.slice(0, 10).forEach(s => console.log(' ', s.status, s.topic.slice(0, 50)));
  await prisma.$disconnect();
})();
