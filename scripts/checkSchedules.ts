import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const s = await p.blogSchedule.findMany({
    where: { connectedWebsiteId: 'test-cosmetic-site-1' },
    orderBy: { scheduledDate: 'asc' }
  });
  console.log(JSON.stringify(s.map(x => ({
    id: x.id.slice(0, 8),
    status: x.status,
    topic: x.topic.slice(0, 50),
    date: x.scheduledDate
  })), null, 2));
  await p.$disconnect();
})();
