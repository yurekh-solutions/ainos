import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const blogs = await p.blogPost.findMany({
    where: {
      companyId: '1364d021-5be6-4b22-955c-cccce711b3ed',
      schedules: { some: { connectedWebsiteId: 'test-cosmetic-site-1' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log(`Found ${blogs.length} cosmetic blogs\n`);
  for (const b of blogs) {
    const content = b.content || '';
    const wc = content.split(/\s+/).filter(Boolean).length;
    const h2 = (content.match(/^## /gm) || []).length;
    const h3 = (content.match(/^### /gm) || []).length;
    const img = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
    let tagCount = 0;
    try { tagCount = Array.isArray(b.tags) ? b.tags.length : (typeof b.tags === 'string' ? JSON.parse(b.tags).length : 0); } catch { tagCount = 0; }
    const isJSONLiteral = content.trim().startsWith('{');
    console.log(`[${wc}w H2:${h2} H3:${h3} img:${img} tags:${tagCount}${isJSONLiteral ? ' ⚠JSON' : ''}] ${b.title.slice(0, 60)}`);
  }
  await p.$disconnect();
})();
