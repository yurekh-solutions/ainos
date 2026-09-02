const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== SkyAV Blog Check ===\n');

  // Check if skyav.in is registered
  const sites = await prisma.connectedWebsite.findMany({
    where: {
      OR: [
        { url: { contains: 'skyav', mode: 'insensitive' } },
        { name: { contains: 'sky', mode: 'insensitive' } },
      ]
    },
    include: { company: true }
  });

  console.log('Connected Websites matching SkyAV:', sites.length);
  sites.forEach(s => {
    console.log(`  - ${s.name} | URL: ${s.url} | Company: ${s.company?.name} | ID: ${s.companyId} | Active: ${s.isActive}`);
  });

  if (sites.length === 0) {
    console.log('\n⚠️ SkyAV NOT registered as ConnectedWebsite!');
    console.log('The blog widget will show "No articles found" because tenant isolation blocks it.');
  }

  // Check published blogs
  if (sites.length > 0) {
    const companyId = sites[0].companyId;
    const blogs = await prisma.blogPost.findMany({
      where: { companyId, status: 'published' },
      select: { title: true, slug: true, status: true, featuredImage: true, publishedAt: true }
    });
    console.log(`\nPublished blogs for SkyAV: ${blogs.length}`);
    blogs.forEach(b => {
      console.log(`  ✅ ${b.title} | Image: ${b.featuredImage ? 'YES' : 'NO'}`);
    });

    // Also check all statuses
    const allBlogs = await prisma.blogPost.findMany({
      where: { companyId },
      select: { title: true, status: true }
    });
    console.log(`\nAll blogs (any status): ${allBlogs.length}`);
    const byStatus = {};
    allBlogs.forEach(b => { byStatus[b.status] = (byStatus[b.status] || 0) + 1; });
    console.log('  By status:', byStatus);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
