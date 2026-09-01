const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const total = await p.blogPost.count({ where: { status: 'published' } });
  const bySite = await p.blogPost.groupBy({
    by: ['companyId'],
    where: { status: 'published' },
    _count: true,
  });
  console.log(`Total published blogs: ${total}`);
  console.log('By company:', JSON.stringify(bySite, null, 2));
  await p.$disconnect();
})();
