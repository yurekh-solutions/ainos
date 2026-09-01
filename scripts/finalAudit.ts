import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const blogs = await p.blogPost.findMany({
    where: { status: 'published', companyId: '1364d021-5be6-4b22-955c-cccce711b3ed' },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`TOTAL PUBLISHED (main company): ${blogs.length}\n`);
  let jsonBugs = 0, premium = 0, lowQuality = 0;
  for (const b of blogs) {
    const content = b.content || '';
    const wc = content.split(/\s+/).filter(Boolean).length;
    const h2 = (content.match(/^## /gm) || []).length;
    const h3 = (content.match(/^### /gm) || []).length;
    const img = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
    let tagCount = 0;
    try { tagCount = Array.isArray(b.tags) ? b.tags.length : (typeof b.tags === 'string' ? JSON.parse(b.tags).length : 0); } catch { tagCount = 0; }
    const isJSONLiteral = content.trim().startsWith('{');
    if (isJSONLiteral) jsonBugs++;
    else if (wc < 2000 || h2 < 5 || tagCount < 3) lowQuality++;
    else premium++;
    const status = isJSONLiteral ? '⚠JSON' : (wc < 2000 ? '⚠SHORT' : '✅');
    console.log(`${status} [${wc}w H2:${h2} H3:${h3} img:${img} tags:${tagCount}] ${b.title.slice(0, 55)}`);
  }
  console.log(`\n=== SUMMARY ===`);
  console.log(`✅ Premium: ${premium}`);
  console.log(`⚠ Low quality: ${lowQuality}`);
  console.log(`⚠ JSON-literal bug: ${jsonBugs}`);
  await p.$disconnect();
})();
