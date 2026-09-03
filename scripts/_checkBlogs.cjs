const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const blogs = await p.blogPost.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: { title: true, content: true, excerpt: true },
  });
  blogs.forEach((x, i) => {
    console.log(`\n=== BLOG ${i + 1}: ${x.title} ===`);
    console.log('EXCERPT:', x.excerpt?.substring(0, 200));
    console.log('\nCONTENT (first 1000 chars):');
    console.log(x.content?.substring(0, 1000));
    console.log('\n---END---');
  });
  await p.disconnect();
}
main().catch(e => { console.error(e); p.disconnect(); });
