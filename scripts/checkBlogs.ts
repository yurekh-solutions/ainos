import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  // Get latest published blogs
  const blogs = await p.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { company: { select: { name: true } } }
  });
  for (const b of blogs) {
    const wordCount = (b.content || '').split(/\s+/).filter(Boolean).length;
    const h2Count = (b.content || '').match(/<h2/gi)?.length || 0;
    const h3Count = (b.content || '').match(/<h3/gi)?.length || 0;
    const imgCount = (b.content || '').match(/<img/gi)?.length || 0;
    const hasImage = !!b.featuredImage;
    console.log('---');
    console.log('Company:', b.company?.name);
    console.log('Title:', b.title);
    console.log('Slug:', b.slug);
    console.log('Words:', wordCount, 'H2:', h2Count, 'H3:', h3Count, 'InlineImg:', imgCount, 'FeaturedImg:', hasImage ? 'YES' : 'NO');
    console.log('FeaturedImage:', b.featuredImage?.slice(0, 80));
    console.log('Tags:', JSON.stringify(b.tags));
    console.log('Status:', b.status);
  }
  await p.$disconnect();
})();
