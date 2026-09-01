import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const blogs = await p.blogPost.findMany({
    where: { companyId: '1364d021-5be6-4b22-955c-cccce711b3ed' },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
  const b = blogs[0];
  console.log('TITLE:', b.title);
  console.log('SLUG:', b.slug);
  console.log('FEATURED:', b.featuredImage);
  console.log('TAGS:', b.tags);
  console.log('---');
  // Show first 30 lines of content with image references highlighted
  const lines = (b.content || '').split('\n');
  let shown = 0;
  for (const line of lines) {
    if (line.includes('![')) {
      console.log('📷', line.slice(0, 200));
    } else if (shown < 30) {
      console.log(line.slice(0, 180));
      shown++;
    }
  }
  await p.$disconnect();
})();
