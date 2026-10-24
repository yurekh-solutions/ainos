const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const counts = {
    rentalOrders: await prisma.rentalOrder.count(),
    approvalRequests: await prisma.approvalRequest.count(),
    shifts: await prisma.shift.count(),
    surveys: await prisma.survey.count(),
    surveyResponses: await prisma.surveyResponse.count(),
    events: await prisma.event.count(),
    eventRegistrations: await prisma.eventRegistration.count(),
  };
  console.log('rows', counts);

  const roles = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
  console.log('user roles', roles.map((r) => `${r.role || 'null'}=${r._count._all}`).join(' '));

  const levels = await prisma.company.groupBy({
    by: ['invoiceGen', 'crmAccess', 'inventoryMgmt', 'hrPayroll', 'emailMarketing'],
    _count: { _all: true },
  });
  console.log('entitlement combos');
  for (const row of levels) {
    console.log(
      `  inv=${row.invoiceGen} crm=${row.crmAccess} invMgmt=${row.inventoryMgmt} hr=${row.hrPayroll} email=${row.emailMarketing} -> ${row._count._all} companies`,
    );
  }
  await prisma.$disconnect();
})();
