const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBlogSystem() {
  console.log('=== Blog System Test ===\n');

  // Test 1: Recent Blogs
  const blogs = await prisma.blogPost.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      publishedAt: true,
      category: true,
      companyId: true,
      featuredImage: true,
    },
  });
  console.log(`✅ Total Recent Blogs: ${blogs.length}`);
  blogs.forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.title.substring(0, 60)}...`);
    console.log(`     Status: ${b.status} | Category: ${b.category}`);
    console.log(`     Image: ${b.featuredImage ? '✅' : '❌'} | Published: ${b.publishedAt ? '✅' : '❌'}`);
  });

  // Test 2: Connected Websites
  const websites = await prisma.connectedWebsite.findMany({
    select: {
      id: true,
      name: true,
      url: true,
      isActive: true,
      companyId: true,
      publishMethod: true,
      deliveryEmail: true,
    },
  });
  console.log(`\n✅ Connected Websites: ${websites.length}`);
  websites.forEach((w, i) => {
    console.log(`  ${i + 1}. ${w.name} (${w.url})`);
    console.log(`     Active: ${w.isActive ? '✅' : '❌'} | Method: ${w.publishMethod}`);
    console.log(`     Email: ${w.deliveryEmail || 'N/A'}`);
  });

  // Test 3: Schedule Status
  const schedules = await prisma.blogSchedule.groupBy({
    by: ['status'],
    _count: true,
  });
  console.log('\n✅ Schedule Status:');
  schedules.forEach(s => {
    console.log(`  ${s.status}: ${s._count}`);
  });

  // Test 4: Subscriptions
  const subs = await prisma.blogSubscription.findMany({
    select: {
      id: true,
      blogsPerMonth: true,
      blogsUsed: true,
      blogsRemaining: true,
      companyId: true,
    },
  });
  console.log(`\n✅ Active Subscriptions: ${subs.length}`);
  subs.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.blogsUsed}/${s.blogsPerMonth} used | ${s.blogsRemaining} remaining`);
  });

  // Test 5: Notifications
  const notifications = await prisma.notification.count();
  console.log(`\n✅ Total Notifications: ${notifications}`);

  // Test 6: Users with blogs
  const usersWithBlogs = await prisma.user.findMany({
    where: {
      company: {
        blogPosts: { some: {} },
      },
    },
    select: {
      id: true,
      email: true,
      company: {
        select: {
          name: true,
          _count: {
            select: { blogPosts: true },
          },
        },
      },
    },
  });
  console.log(`\n✅ Users with Blogs: ${usersWithBlogs.length}`);
  usersWithBlogs.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email} (${u.company.name}) - ${u.company._count.blogPosts} blogs`);
  });

  console.log('\n=== All Tests Complete ===');
  await prisma.$disconnect();
}

testBlogSystem().catch(console.error);
