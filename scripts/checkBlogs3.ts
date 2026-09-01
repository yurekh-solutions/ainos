import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const blogs = await p.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  for (const b of blogs) {
    const content = b.content || '';
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const h2Md = (content.match(/^##\s+/gm) || []).length;
    const h3Md = (content.match(/^###\s+/gm) || []).length;
    const imgMd = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
    const tocPresent = content.includes('Table of Contents');
    const faqPresent = content.includes('FAQ') || content.includes('Frequently Asked');
    const ctaPresent = content.includes('Book a') || content.includes('Contact') || content.includes('Schedule');
    const hasImage = !!b.featuredImage;
    console.log('---');
    console.log('Title:', b.title?.slice(0, 60));
    console.log(`Words: ${wordCount} | H2(md): ${h2Md} | H3(md): ${h3Md} | Img(md): ${imgMd}`);
    console.log(`TOC: ${tocPresent} | FAQ: ${faqPresent} | CTA: ${ctaPresent} | FeaturedImg: ${hasImage}`);
    console.log(`Tags: ${(b.tags as string[])?.length || 0}`);
  }
  await p.$disconnect();
})();
